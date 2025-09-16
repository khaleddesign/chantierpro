import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EvenementWorkflow } from '@prisma/client';
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
    parametres: z.record(z.string(), z.any())
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
        { error: 'Données invalides', details: error.issues },
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

// La fonction executeWorkflows a été déplacée vers lib/services/workflow-service.ts