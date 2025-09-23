// Template pré-validé pour app/api/devis/route.ts
// Force Node.js runtime pour les opérations de base de données
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from "next/server";
import { 
  withErrorHandling, 
  requireAuth, 
  createSuccessResponse,
  createPaginatedResponse,
  logUserAction,
  checkRateLimit,
  APIError
} from '@/lib/api-helpers';
import { validateAndSanitize } from '@/lib/validations/crm';
import { DevisQuerySchema, DevisCreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { DevisStatus, DevisType } from "@prisma/client";

// GET /api/devis - Récupérer la liste des devis
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'COMMERCIAL', 'CLIENT']);
  
  if (!checkRateLimit(`devis:${session.user.id}`, 200, 15 * 60 * 1000)) {
    throw new APIError('Trop de requêtes, veuillez réessayer plus tard', 429);
  }

  const { searchParams } = new URL(request.url);
  
  const paramsValidation = validateAndSanitize(DevisQuerySchema, {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    clientId: searchParams.get('clientId') || undefined,
    chantierId: searchParams.get('chantierId') || undefined
  });

  if (!paramsValidation.success) {
    throw new APIError(`Paramètres invalides: ${paramsValidation.errors?.join(', ')}`, 400);
  }

  const { page, limit, search, status, type, clientId, chantierId } = paramsValidation.data as {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    type?: string;
    clientId?: string;
    chantierId?: string;
  };
  const skip = (page - 1) * limit;

  // Construction des filtres selon le rôle
  const whereClause: any = {};
  
  // Filtrage par rôle utilisateur
  if (session.user.role === "CLIENT") {
    whereClause.clientId = session.user.id;
  } else if (session.user.role === "COMMERCIAL") {
    // Vérification des permissions commerciales
    if (clientId) {
      const client = await prisma.user.findFirst({
        where: { id: clientId, commercialId: session.user.id }
      });
      if (!client) {
        throw new APIError('Accès refusé: Ce client ne vous est pas assigné', 403);
      }
    }
    whereClause.client = {
      commercialId: session.user.id
    };
  }
  
  // Filtres de recherche
  if (search) {
    whereClause.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { objet: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } }
    ];
  }
  
  if (status && status !== "TOUS") {
    whereClause.statut = status as DevisStatus;
  }
  
  if (type) {
    whereClause.type = type as DevisType;
  }
  
  if (chantierId) {
    whereClause.chantierId = chantierId;
  }

  const [devis, total] = await Promise.all([
    prisma.devis.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { dateCreation: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true,
            adresse: true,
          }
        },
        ligneDevis: {
          orderBy: { ordre: "asc" },
          include: {
            details: true
          }
        },
        _count: {
          select: {
            ligneDevis: true,
            paiements: true,
            relances: true,
          }
        }
      }
    }),
    prisma.devis.count({ where: whereClause })
  ]);

  await logUserAction(
    session.user.id, 
    'GET_DEVIS', 
    'devis', 
    undefined, 
    { search, status, type, clientId, chantierId, page, limit, total: devis.length },
    request
  );

  return createPaginatedResponse(devis, total, page, limit, 'Devis récupérés avec succès');
});

// POST /api/devis - Créer un nouveau devis
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  if (!checkRateLimit(`devis:${session.user.id}`, 10, 15 * 60 * 1000)) {
    throw new APIError('Trop de créations, veuillez réessayer plus tard', 429);
  }

  const body = await request.json();
  
  const validation = validateAndSanitize(DevisCreateSchema, body);
  if (!validation.success) {
    throw new APIError(`Données invalides: ${validation.errors?.join(', ')}`, 400);
  }

  const devisData = validation.data as {
    clientId: string;
    type: DevisType;
    objet?: string;
    dateEcheance: string;
    lignes: Array<{
      description: string;
      quantite: number;
      prixUnit: number;
    }>;
    notes?: string;
    conditionsVente?: string;
    modalitesPaiement?: string;
    tva: number;
    retenueGarantie: number;
    autoliquidation: boolean;
    chantierId?: string;
  };

  // Vérifier que le client existe
  const client = await prisma.user.findUnique({
    where: { id: devisData.clientId },
    select: { id: true, role: true, commercialId: true }
  });

  if (!client || client.role !== "CLIENT") {
    throw new APIError('Client non trouvé ou invalide', 400);
  }

  // Vérifier les permissions pour les commerciaux
  if (session.user.role === "COMMERCIAL" && client.commercialId !== session.user.id) {
    throw new APIError('Permissions insuffisantes pour ce client', 403);
  }

  // Générer un numéro de devis unique
  const lastDevis = await prisma.devis.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true }
  });
  
  const nextNumber = lastDevis 
    ? parseInt(lastDevis.numero.split('-')[1]) + 1 
    : 1;
  const numero = `DEV-${nextNumber.toString().padStart(4, '0')}`;

  // Calculer les totaux
  const totalHT = devisData.lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prixUnit), 0);
  const totalTVA = devisData.autoliquidation ? 0 : (totalHT * devisData.tva) / 100;
  const totalTTC = totalHT + totalTVA;
  const montantRetenue = (totalTTC * devisData.retenueGarantie) / 100;
  const montantFinal = totalTTC - montantRetenue;

  // Créer le devis dans une transaction
  const newDevis = await prisma.$transaction(async (tx) => {
    // Créer le devis
    const devis = await tx.devis.create({
      data: {
        numero,
        clientId: devisData.clientId,
        chantierId: devisData.chantierId,
        type: devisData.type,
        objet: devisData.objet,
        montant: montantFinal,
        totalHT,
        totalTVA,
        totalTTC,
        tva: devisData.tva,
        dateEcheance: new Date(devisData.dateEcheance),
        retenueGarantie: devisData.retenueGarantie,
        autoliquidation: devisData.autoliquidation,
        notes: devisData.notes,
        conditionsVente: devisData.conditionsVente,
        modalitesPaiement: devisData.modalitesPaiement,
        statut: "BROUILLON",
        lignes: JSON.stringify(devisData.lignes)
      }
    });

    // Créer les lignes de devis
    for (let i = 0; i < devisData.lignes.length; i++) {
      const ligne = devisData.lignes[i];
      await tx.ligneDevis.create({
        data: {
          devisId: devis.id,
          description: ligne.description,
          quantite: ligne.quantite,
          prixUnit: ligne.prixUnit,
          total: ligne.quantite * ligne.prixUnit,
          ordre: i + 1
        }
      });
    }

    return devis;
  });

  await logUserAction(
    session.user.id, 
    'CREATE_DEVIS', 
    'devis', 
    newDevis.id, 
    { numero: newDevis.numero, clientId: newDevis.clientId, montant: newDevis.montant },
    request
  );

  return createSuccessResponse(newDevis, 'Devis créé avec succès', 201);
});
