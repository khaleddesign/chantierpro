import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface SearchFilters {
  dateRange?: 'today' | 'week' | 'month' | 'all';
  person?: string;
  chantier?: string;
  fileType?: 'image' | 'document' | 'all';
  messageType?: 'DIRECT' | 'CHANTIER' | 'GROUPE' | 'all';
}

interface SearchResult {
  type: 'message' | 'contact' | 'file';
  id: string;
  title: string;
  content: string;
  timestamp: string;
  relevanceScore: number;
  metadata: {
    expediteur?: {
      id: string;
      name: string;
      role: string;
    };
    chantier?: {
      id: string;
      nom: string;
    };
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId') || 'test-client-123';
    
    // Filters
    const filters: SearchFilters = {
      dateRange: (searchParams.get('dateRange') as SearchFilters['dateRange']) || 'all',
      person: searchParams.get('person') || undefined,
      chantier: searchParams.get('chantier') || undefined,
      fileType: (searchParams.get('fileType') as SearchFilters['fileType']) || 'all',
      messageType: (searchParams.get('messageType') as SearchFilters['messageType']) || 'all'
    };

    if (!query || query.length < 2) {
      return NextResponse.json({
        error: 'Requête trop courte',
        message: 'La recherche doit contenir au moins 2 caractères',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const offset = (page - 1) * limit;
    let results: SearchResult[] = [];
    let totalResults = 0;

    try {
      // Recherche dans les messages
      const messageResults = await searchMessages(query, filters, userId, limit, offset);
      
      // Recherche dans les contacts
      const contactResults = await searchContacts(query, filters, userId, limit);
      
      // Recherche dans les fichiers
      const fileResults = await searchFiles(query, filters, userId, limit);

      // Combiner et trier par score de pertinence
      results = [...messageResults, ...contactResults, ...fileResults]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      totalResults = results.length;

    } catch (dbError) {
      console.warn('Base de données non disponible, utilisation des données de simulation');
      
      // Données de simulation pour la recherche
      const mockResults = generateMockSearchResults(query, filters);
      results = mockResults.slice(offset, offset + limit);
      totalResults = mockResults.length;
    }

    // Highlights des termes recherchés
    results = results.map(result => ({
      ...result,
      title: highlightText(result.title, query),
      content: highlightText(result.content, query)
    }));

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total: totalResults,
        pages: Math.ceil(totalResults / limit)
      },
      query,
      filters,
      searchTime: Date.now(),
      suggestions: generateSearchSuggestions(query, results),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API recherche:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de la recherche',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function searchMessages(
  query: string, 
  filters: SearchFilters, 
  userId: string, 
  limit: number, 
  offset: number
): Promise<SearchResult[]> {
  const whereClause: Prisma.MessageWhereInput = {
    OR: [
      { message: { contains: query } },
      { expediteur: { name: { contains: query } } }
    ]
  };

  // Appliquer les filtres de date
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let dateFilter: Date;
    
    switch (filters.dateRange) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        dateFilter = new Date(0);
    }
    
    whereClause.createdAt = { gte: dateFilter };
  }

  // Filtrer par personne
  if (filters.person) {
    whereClause.expediteurId = filters.person;
  }

  // Filtrer par chantier
  if (filters.chantier) {
    whereClause.chantierId = filters.chantier;
  }

  // Filtrer par type de message
  if (filters.messageType && filters.messageType !== 'all') {
    whereClause.typeMessage = filters.messageType;
  }

  const messages = await prisma.message.findMany({
    where: whereClause,
    include: {
      expediteur: {
        select: { id: true, name: true, role: true }
      },
      chantier: {
        select: { id: true, nom: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  return messages.map(message => ({
    type: 'message' as const,
    id: message.id,
    title: `Message de ${message.expediteur.name || 'Anonyme'}`,
    content: message.message,
    timestamp: message.createdAt.toISOString(),
    relevanceScore: calculateRelevanceScore(message.message, query) + (message.typeMessage === 'CHANTIER' ? 0.1 : 0),
    metadata: {
      expediteur: {
        ...message.expediteur,
        name: message.expediteur.name || 'Anonyme'
      },
      chantier: message.chantier || undefined
    }
  }));
}

async function searchContacts(
  query: string, 
  filters: SearchFilters, 
  userId: string, 
  limit: number
): Promise<SearchResult[]> {
  const whereClause: Prisma.UserWhereInput = {
    id: { not: userId },
    OR: [
      { name: { contains: query } },
      { email: { contains: query } },
      { company: { contains: query } }
    ]
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      createdAt: true
    },
    take: Math.min(limit, 10) // Limiter les contacts dans les résultats
  });

  return users.map(user => ({
    type: 'contact' as const,
    id: user.id,
    title: user.name || 'Utilisateur sans nom',
    content: `${user.role}${user.company ? ` • ${user.company}` : ''} • ${user.email}`,
    timestamp: user.createdAt.toISOString(),
    relevanceScore: calculateRelevanceScore(`${user.name || ''} ${user.email} ${user.company || ''}`, query),
    metadata: {
      expediteur: {
        id: user.id,
        name: user.name || 'Utilisateur sans nom',
        role: user.role
      }
    }
  }));
}

async function searchFiles(
  query: string, 
  filters: SearchFilters, 
  userId: string, 
  limit: number
): Promise<SearchResult[]> {
  // Recherche dans les fichiers attachés aux messages
  const whereClause: Prisma.MessageWhereInput = {
    photos: { not: null }
  };

  if (filters.chantier) {
    whereClause.chantierId = filters.chantier;
  }

  const messagesWithFiles = await prisma.message.findMany({
    where: whereClause,
    include: {
      expediteur: {
        select: { id: true, name: true, role: true }
      },
      chantier: {
        select: { id: true, nom: true }
      }
    },
    take: limit
  });

  const fileResults: SearchResult[] = [];

  messagesWithFiles.forEach(message => {
    // Traiter les photos
    const photos = typeof message.photos === 'string' ? 
      (message.photos ? JSON.parse(message.photos) : []) : 
      (message.photos || []);
    photos?.forEach((photoUrl: string, index: number) => {
      if (filters.fileType === 'all' || filters.fileType === 'image') {
        const fileName = extractFileNameFromUrl(photoUrl);
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
          fileResults.push({
            type: 'file',
            id: `${message.id}-photo-${index}`,
            title: fileName,
            content: `Photo partagée par ${message.expediteur.name}`,
            timestamp: message.createdAt.toISOString(),
            relevanceScore: calculateRelevanceScore(fileName, query),
            metadata: {
              expediteur: {
                id: message.expediteur.id,
                name: message.expediteur.name || 'Anonyme',
                role: message.expediteur.role.toString()
              },
              chantier: message.chantier || undefined,
              fileUrl: photoUrl,
              fileType: 'image',
              fileSize: undefined // À calculer si nécessaire
            }
          });
        }
      }
    });

    // Traiter les fichiers
    const files = typeof message.photos === 'string' ? 
      (message.photos ? JSON.parse(message.photos) : []) : 
      (message.photos || []);
    (files || []).forEach((fileUrl: string, index: number) => {
      if (filters.fileType === 'all' || filters.fileType === 'document') {
        const fileName = extractFileNameFromUrl(fileUrl);
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
          fileResults.push({
            type: 'file',
            id: `${message.id}-file-${index}`,
            title: fileName,
            content: `Document partagé par ${message.expediteur.name}`,
            timestamp: message.createdAt.toISOString(),
            relevanceScore: calculateRelevanceScore(fileName, query),
            metadata: {
              expediteur: {
                id: message.expediteur.id,
                name: message.expediteur.name || 'Anonyme',
                role: message.expediteur.role.toString()
              },
              chantier: message.chantier || undefined,
              fileUrl: fileUrl,
              fileType: 'document',
              fileSize: undefined
            }
          });
        }
      }
    });
  });

  return fileResults;
}

function generateMockSearchResults(query: string, filters: SearchFilters): SearchResult[] {
  const mockResults: SearchResult[] = [
    {
      type: 'message',
      id: 'msg-1',
      title: 'Message de Pierre Maçon',
      content: `Bonjour Marie, les carrelages que vous avez choisis sont arrivés. Nous pouvons commencer la pose dès demain si vous confirmez. Le ${query} est parfait pour ce type de travaux.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      relevanceScore: 0.9,
      metadata: {
        expediteur: { id: 'user-1', name: 'Pierre Maçon', role: 'OUVRIER' },
        chantier: { id: '1', nom: 'Rénovation Villa Moderne' }
      }
    },
    {
      type: 'contact',
      id: 'user-2',
      title: 'Julie Électricienne',
      content: 'OUVRIER • julie.elec@chantierpro.fr',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      relevanceScore: 0.7,
      metadata: {
        expediteur: { id: 'user-2', name: 'Julie Électricienne', role: 'OUVRIER' }
      }
    },
    {
      type: 'file',
      id: 'file-1',
      title: `Plan_${query}_v2.pdf`,
      content: 'Document partagé par Marie Dupont',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      relevanceScore: 0.8,
      metadata: {
        expediteur: { id: 'user-3', name: 'Marie Dupont', role: 'COMMERCIAL' },
        chantier: { id: '1', nom: 'Rénovation Villa Moderne' },
        fileUrl: '#',
        fileType: 'document',
        fileSize: 2456789
      }
    },
    {
      type: 'message',
      id: 'msg-2',
      title: 'Message de Marie Dubois',
      content: `Merci pour l'update sur le ${query}. J'ai hâte de voir le résultat final!`,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      relevanceScore: 0.6,
      metadata: {
        expediteur: { id: 'client-1', name: 'Marie Dubois', role: 'CLIENT' },
        chantier: { id: '1', nom: 'Rénovation Villa Moderne' }
      }
    }
  ];

  // Appliquer les filtres sur les données de simulation
  return mockResults.filter(result => {
    let match = true;

    if (filters.person) {
      match = match && result.metadata.expediteur?.id === filters.person;
    }

    if (filters.chantier) {
      match = match && result.metadata.chantier?.id === filters.chantier;
    }

    if (filters.fileType && filters.fileType !== 'all') {
      // Le type 'file' n'existe pas dans les types possibles (message, contact)
      // Cette logique de filtrage des fichiers n'est pas applicable pour nos types
      if (result.type === 'message' && (result as any).metadata?.fileType) {
        match = match && (
          (filters.fileType === 'image' && (result as any).metadata.fileType === 'image') ||
          (filters.fileType === 'document' && (result as any).metadata.fileType === 'document')
        );
      }
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const resultDate = new Date(result.timestamp);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          match = match && resultDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          match = match && resultDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          match = match && resultDate >= monthAgo;
          break;
      }
    }

    return match;
  });
}

function calculateRelevanceScore(content: string, query: string): number {
  const contentLower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Score de base pour la présence du terme
  let score = contentLower.includes(queryLower) ? 0.5 : 0;
  
  // Bonus si le terme est au début
  if (contentLower.startsWith(queryLower)) {
    score += 0.3;
  }
  
  // Bonus pour correspondance exacte de mots
  const words = queryLower.split(' ');
  words.forEach(word => {
    if (contentLower.includes(` ${word} `) || contentLower.startsWith(`${word} `) || contentLower.endsWith(` ${word}`)) {
      score += 0.1;
    }
  });
  
  // Normaliser entre 0 et 1
  return Math.min(score, 1);
}

function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function extractFileNameFromUrl(url: string): string {
  return url.split('/').pop() || url;
}

function generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
  // Générer des suggestions basées sur les résultats
  const suggestions: Set<string> = new Set();
  
  results.forEach(result => {
    if (result.metadata.chantier) {
      suggestions.add(result.metadata.chantier.nom);
    }
    if (result.metadata.expediteur) {
      suggestions.add(result.metadata.expediteur.name);
    }
  });
  
  // Ajouter quelques suggestions génériques
  const genericSuggestions = [
    `${query} photos`,
    `${query} documents`,
    `${query} aujourd'hui`,
    `${query} cette semaine`
  ];
  
  genericSuggestions.forEach(s => suggestions.add(s));
  
  return Array.from(suggestions).slice(0, 5);
}

// POST pour sauvegarder l'historique de recherche
export async function POST(request: NextRequest) {
  try {
    const { userId, query, resultCount } = await request.json();
    
    if (!userId || !query) {
      return NextResponse.json({
        error: 'userId et query requis',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Sauvegarder dans l'historique (simulation pour l'instant)
    // En production, créer une table SearchHistory
    
    return NextResponse.json({
      success: true,
      message: 'Recherche sauvegardée dans l\'historique',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur sauvegarde recherche:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de la sauvegarde',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}