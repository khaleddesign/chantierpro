import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema pour envoyer un email/SMS
const CommunicationSchema = z.object({
  clientId: z.string().cuid(),
  type: z.enum(['EMAIL', 'SMS']),
  sujet: z.string().min(1).optional(),
  message: z.string().min(1),
  templateId: z.string().optional(),
  programmee: z.boolean().default(false),
  dateEnvoi: z.string().datetime().optional()
});

// Schema pour créer un template
const TemplateSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(['EMAIL', 'SMS']),
  sujet: z.string().optional(),
  contenu: z.string().min(1),
  variables: z.array(z.string()).default([]),
  categorie: z.enum(['RELANCE', 'PROSPECTION', 'SUIVI', 'NEGOCIATION', 'CLOTURE']).default('SUIVI')
});

// GET - Récupérer l'historique des communications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const clientId = searchParams.get('clientId');
    
    let whereClause: any = {};
    
    if (type !== 'all') {
      whereClause.type = type;
    }
    
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const communications = await prisma.communicationClient.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            name: true,
            email: true,
            phone: true,
            telephoneMobile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Récupérer aussi les templates disponibles
    const templates = await prisma.templateCommunication.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      communications,
      templates
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des communications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des communications' },
      { status: 500 }
    );
  }
}

// POST - Envoyer une communication (email/SMS)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CommunicationSchema.parse(body);

    // Récupérer les infos du client
    const client = await prisma.user.findUnique({
      where: { id: validatedData.clientId },
      select: {
        id: true,
        nom: true,
        name: true,
        email: true,
        phone: true,
        telephoneMobile: true,
        company: true,
        typeClient: true,
        prefEmail: true,
        prefSMS: true
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les préférences de communication
    if (validatedData.type === 'EMAIL' && !client.prefEmail) {
      return NextResponse.json(
        { error: 'Le client n\'accepte pas les emails' },
        { status: 400 }
      );
    }

    if (validatedData.type === 'SMS' && !client.prefSMS) {
      return NextResponse.json(
        { error: 'Le client n\'accepte pas les SMS' },
        { status: 400 }
      );
    }

    // Traitement du template si fourni
    let contenuFinal = validatedData.message;
    let sujetFinal = validatedData.sujet;

    if (validatedData.templateId) {
      const template = await prisma.templateCommunication.findUnique({
        where: { id: validatedData.templateId }
      });

      if (template) {
        // Remplacer les variables dans le template
        contenuFinal = remplacerVariables(template.contenu, client);
        sujetFinal = template.sujet ? remplacerVariables(template.sujet, client) : validatedData.sujet;
      }
    }

    // Créer l'enregistrement de communication
    const communication = await prisma.communicationClient.create({
      data: {
        clientId: validatedData.clientId,
        type: validatedData.type,
        sujet: sujetFinal || '',
        message: contenuFinal,
        statut: validatedData.programmee ? 'PROGRAMMEE' : 'ENVOYE',
        dateEnvoi: validatedData.dateEnvoi ? new Date(validatedData.dateEnvoi) : new Date(),
        createdBy: session.user.id,
        templateId: validatedData.templateId || null
      },
      include: {
        client: {
          select: {
            nom: true,
            name: true,
            email: true,
            phone: true,
            telephoneMobile: true
          }
        }
      }
    });

    // Simuler l'envoi
    if (!validatedData.programmee) {
      const resultatEnvoi = await simulerEnvoi(communication, client);
      
      // Mettre à jour le statut
      await prisma.communicationClient.update({
        where: { id: communication.id },
        data: { 
          statut: resultatEnvoi.success ? 'ENVOYE' : 'ECHEC',
          erreur: resultatEnvoi.error || null
        }
      });
    }

    // Log de l'action dans l'historique CRM
    await prisma.historiqueActionCRM.create({
      data: {
        action: `ENVOI_${validatedData.type}`,
        entite: 'client',
        entiteId: validatedData.clientId,
        nouvelleValeur: {
          type: validatedData.type,
          sujet: sujetFinal,
          programmee: validatedData.programmee
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur',
      }
    });

    return NextResponse.json(communication, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur lors de l\'envoi de communication:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'envoi de communication' },
      { status: 500 }
    );
  }
}

// Fonction pour remplacer les variables dans les templates
function remplacerVariables(template: string, client: any): string {
  const variables = {
    '{{nom}}': client.nom || client.name || 'Client',
    '{{email}}': client.email || '',
    '{{telephone}}': client.telephoneMobile || client.phone || '',
    '{{societe}}': client.company || '',
    '{{type_client}}': client.typeClient || '',
    '{{date}}': new Date().toLocaleDateString('fr-FR'),
    '{{heure}}': new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  };

  let contenu = template;
  for (const [variable, valeur] of Object.entries(variables)) {
    contenu = contenu.replace(new RegExp(variable, 'g'), valeur);
  }

  return contenu;
}

// Fonction pour simuler l'envoi (en production, utiliser SendGrid, Twilio, etc.)
async function simulerEnvoi(communication: any, client: any): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 Simulation d'envoi ${communication.type}:`);
  console.log(`📧 À: ${communication.type === 'EMAIL' ? client.email : client.telephoneMobile || client.phone}`);
  console.log(`📧 Sujet: ${communication.sujet}`);
  console.log(`📧 Message: ${communication.message.substring(0, 100)}...`);

  // Simuler un délai d'envoi
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simuler un taux de réussite de 95%
  const success = Math.random() > 0.05;

  return {
    success,
    error: success ? undefined : 'Erreur de simulation d\'envoi'
  };
}

// API pour créer des templates
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = TemplateSchema.parse(body);

    const template = await prisma.templateCommunication.create({
      data: {
        ...validatedData,
        createdBy: session.user.id
      }
    });

    return NextResponse.json(template, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création du template:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du template' },
      { status: 500 }
    );
  }
}