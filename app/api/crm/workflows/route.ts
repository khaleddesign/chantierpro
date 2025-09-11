import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema pour créer une règle d'automatisation
const WorkflowRuleSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional(),
  actif: z.boolean().default(true),
  
  // Déclencheur
  evenement: z.enum(['CREATION_OPPORTUNITE', 'CHANGEMENT_STATUT', 'ECHEANCE_PROCHE', 'AUCUNE_INTERACTION']),
  conditions: z.object({
    statut: z.string().optional(),
    ancienStatut: z.string().optional(),
    nombreJours: z.number().optional(),
    priorite: z.string().optional(),
    typeClient: z.string().optional()
  }).optional(),
  
  // Actions
  actions: z.array(z.object({
    type: z.enum(['CREER_TACHE', 'ENVOYER_EMAIL', 'PROGRAMMER_RAPPEL', 'CHANGER_PRIORITE', 'ASSIGNER_COMMERCIAL']),
    parametres: z.record(z.any())
  }))
});

// GET - Récupérer les règles de workflow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer toutes les règles d'automatisation
    const workflows = await prisma.workflowRule.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Statistiques d'exécution
    const stats = await prisma.workflowExecution.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return NextResponse.json({
      workflows,
      stats: {
        totalExecutions: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        reussites: stats.find(s => s.status === 'SUCCES')?._count.id || 0,
        echecs: stats.find(s => s.status === 'ERREUR')?._count.id || 0,
        enAttente: stats.find(s => s.status === 'EN_ATTENTE')?._count.id || 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des workflows:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des workflows' },
      { status: 500 }
    );
  }
}

// POST - Créer une règle de workflow
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
    const validatedData = WorkflowRuleSchema.parse(body);

    const workflow = await prisma.workflowRule.create({
      data: {
        ...validatedData,
        conditions: validatedData.conditions || {},
        actions: validatedData.actions,
        createdBy: session.user.id,
      }
    });

    return NextResponse.json(workflow, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création du workflow:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du workflow' },
      { status: 500 }
    );
  }
}

// Fonction pour exécuter les workflows automatiques
export async function executeWorkflows(evenement: string, contexte: any) {
  try {
    console.log(`🤖 Exécution des workflows pour l'événement: ${evenement}`, contexte);

    // Récupérer les règles actives pour cet événement
    const regles = await prisma.workflowRule.findMany({
      where: {
        evenement,
        actif: true
      }
    });

    console.log(`📋 ${regles.length} règle(s) trouvée(s) pour ${evenement}`);

    for (const regle of regles) {
      try {
        // Vérifier les conditions
        if (!verifierConditions(regle.conditions, contexte)) {
          console.log(`⏭️ Conditions non remplies pour la règle: ${regle.nom}`);
          continue;
        }

        console.log(`✅ Exécution de la règle: ${regle.nom}`);

        // Créer l'enregistrement d'exécution
        const execution = await prisma.workflowExecution.create({
          data: {
            workflowRuleId: regle.id,
            evenement,
            contexte,
            status: 'EN_COURS'
          }
        });

        // Exécuter les actions
        const resultats = [];
        for (const action of regle.actions) {
          const resultat = await executerAction(action, contexte);
          resultats.push(resultat);
        }

        // Mettre à jour le statut d'exécution
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'SUCCES',
            resultats,
            completedAt: new Date()
          }
        });

        console.log(`✅ Règle ${regle.nom} exécutée avec succès`);

      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de la règle ${regle.nom}:`, error);
        
        // Marquer l'exécution comme échouée
        await prisma.workflowExecution.updateMany({
          where: {
            workflowRuleId: regle.id,
            status: 'EN_COURS'
          },
          data: {
            status: 'ERREUR',
            erreur: error instanceof Error ? error.message : 'Erreur inconnue',
            completedAt: new Date()
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale lors de l\'exécution des workflows:', error);
  }
}

// Vérifier si les conditions sont remplies
function verifierConditions(conditions: any, contexte: any): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // Vérifier chaque condition
  for (const [cle, valeur] of Object.entries(conditions)) {
    if (valeur === null || valeur === undefined) continue;

    switch (cle) {
      case 'statut':
        if (contexte.nouveauStatut !== valeur) return false;
        break;
      case 'ancienStatut':
        if (contexte.ancienStatut !== valeur) return false;
        break;
      case 'nombreJours':
        // Logique pour vérifier l'ancienneté
        const joursDepuisCreation = Math.floor(
          (Date.now() - new Date(contexte.dateCreation).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (joursDepuisCreation < valeur) return false;
        break;
      case 'priorite':
        if (contexte.priorite !== valeur) return false;
        break;
      case 'typeClient':
        if (contexte.client?.typeClient !== valeur) return false;
        break;
    }
  }

  return true;
}

// Exécuter une action spécifique
async function executerAction(action: any, contexte: any): Promise<any> {
  console.log(`🔧 Exécution de l'action: ${action.type}`, action.parametres);

  switch (action.type) {
    case 'CREER_TACHE':
      return await creerTache(action.parametres, contexte);
    
    case 'ENVOYER_EMAIL':
      return await envoyerEmail(action.parametres, contexte);
    
    case 'PROGRAMMER_RAPPEL':
      return await programmerRappel(action.parametres, contexte);
    
    case 'CHANGER_PRIORITE':
      return await changerPriorite(action.parametres, contexte);
    
    case 'ASSIGNER_COMMERCIAL':
      return await assignerCommercial(action.parametres, contexte);
    
    default:
      throw new Error(`Type d'action non supporté: ${action.type}`);
  }
}

// Actions spécifiques
async function creerTache(parametres: any, contexte: any) {
  const tache = await prisma.tacheCommerciale.create({
    data: {
      titre: parametres.titre || `Suivi ${contexte.type}`,
      description: parametres.description || 'Tâche créée automatiquement par workflow',
      dateEcheance: new Date(Date.now() + (parametres.delaiJours || 1) * 24 * 60 * 60 * 1000),
      priorite: parametres.priorite || 'NORMALE',
      assigneTo: contexte.userId || parametres.assigneTo,
      createdBy: contexte.userId || 'system',
      opportuniteId: contexte.opportuniteId,
      clientId: contexte.clientId
    }
  });

  console.log(`📋 Tâche créée: ${tache.titre}`);
  return { type: 'tache', id: tache.id };
}

async function envoyerEmail(parametres: any, contexte: any) {
  // Pour l'instant, on simule l'envoi d'email
  // Dans une implémentation réelle, ici on utiliserait un service comme SendGrid, Mailgun, etc.
  
  console.log(`📧 Email simulé envoyé à: ${contexte.client?.email}`);
  console.log(`📧 Sujet: ${parametres.sujet}`);
  console.log(`📧 Template: ${parametres.template}`);
  
  return { 
    type: 'email', 
    destinataire: contexte.client?.email,
    sujet: parametres.sujet,
    status: 'simule' 
  };
}

async function programmerRappel(parametres: any, contexte: any) {
  const rappel = await prisma.relanceCommerciale.create({
    data: {
      opportuniteId: contexte.opportuniteId,
      clientId: contexte.clientId,
      typeRelance: parametres.type || 'EMAIL',
      dateRelance: new Date(Date.now() + (parametres.delaiJours || 3) * 24 * 60 * 60 * 1000),
      statut: 'PROGRAMMEE',
      commentaire: parametres.message || 'Relance automatique programmée',
      createdBy: contexte.userId || 'system'
    }
  });

  console.log(`⏰ Rappel programmé: ${rappel.typeRelance}`);
  return { type: 'rappel', id: rappel.id };
}

async function changerPriorite(parametres: any, contexte: any) {
  if (contexte.opportuniteId) {
    await prisma.opportunite.update({
      where: { id: contexte.opportuniteId },
      data: { priorite: parametres.nouvellePriorite }
    });
  }

  console.log(`🚨 Priorité changée vers: ${parametres.nouvellePriorite}`);
  return { type: 'priorite', nouvellePriorite: parametres.nouvellePriorite };
}

async function assignerCommercial(parametres: any, contexte: any) {
  if (contexte.clientId) {
    await prisma.user.update({
      where: { id: contexte.clientId },
      data: { commercialId: parametres.commercialId }
    });
  }

  console.log(`👤 Commercial assigné: ${parametres.commercialId}`);
  return { type: 'assignation', commercialId: parametres.commercialId };
}

// Function already exported above as named export