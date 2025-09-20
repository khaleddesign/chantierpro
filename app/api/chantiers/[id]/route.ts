import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChantierStatus } from "@prisma/client";
import { logChantierAction, logAccessDenied, SecurityActions } from "@/lib/audit-logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const chantier = await prisma.chantier.findUnique({
      where: { id: id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            address: true,
          }
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        etapes: {
          orderBy: { ordre: "asc" },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        timeline: {
          orderBy: { date: "desc" },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            auteur: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        devis: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            numero: true,
            type: true,
            statut: true,
            montant: true,
            totalTTC: true,
            dateCreation: true,
          }
        },
        _count: {
          select: {
            messages: true,
            comments: true,
            etapes: true,
            documents: true,
          }
        }
      }
    });

    if (!chantier) {
      return NextResponse.json(
        { error: "Chantier non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (plus permissif pour les commerciaux)
    const hasAccess =
      session.user.role === "ADMIN" ||
      (chantier.clientId === session.user.id) || // Le client propriétaire
      (session.user.role === "COMMERCIAL" && (chantier.client as any)?.commercialId === session.user.id) || // Le commercial assigné au client
      (chantier.assignees.some(a => a.id === session.user.id)); // L'utilisateur est assigné au chantier

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json(chantier);

  } catch (error) {
    console.error("Erreur lors de la récupération du chantier:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    console.log('=== PUT /api/chantiers/[id] - Début ===');
    console.log('ID du chantier:', id);
    
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error('Erreur session dans PUT chantier:', sessionError);
      return NextResponse.json({ 
        error: "Session invalide. Veuillez vous reconnecter." 
      }, { status: 401 });
    }
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le chantier existe et les permissions
    const existingChantier = await prisma.chantier.findUnique({
      where: { id: id },
      include: { 
        client: {
          include: {
            commercial: true
          }
        }
      }
    });

    if (!existingChantier) {
      return NextResponse.json(
        { error: "Chantier non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (seuls admin et commerciaux peuvent modifier)
    const canEdit = 
      session.user.role === "ADMIN" ||
      session.user.role === "COMMERCIAL";

    if (!canEdit) {
      // Log tentative d'accès refusé
      await logAccessDenied(
        session.user.id,
        `chantier:${id}`,
        ip,
        userAgent,
        'insufficient_permissions'
      );
      
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    console.log('Données reçues pour modification:', JSON.stringify(body, null, 2));
    
    const {
      nom,
      description,
      adresse,
      dateDebut,
      dateFin,
      budget,
      superficie,
      photo,
      statut,
      progression,
      lat,
      lng
    } = body;

    // Données à mettre à jour
    const updateData: any = {};
    
    if (nom !== undefined) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (adresse !== undefined) updateData.adresse = adresse;
    if (dateDebut !== undefined) updateData.dateDebut = new Date(dateDebut);
    if (dateFin !== undefined) updateData.dateFin = new Date(dateFin);
    if (budget !== undefined) updateData.budget = parseFloat(budget);
    if (superficie !== undefined) updateData.superficie = superficie;
    if (photo !== undefined) updateData.photo = photo;
    if (statut !== undefined && Object.values(ChantierStatus).includes(statut)) {
      updateData.statut = statut;
    }
    if (progression !== undefined && progression >= 0 && progression <= 100) {
      updateData.progression = parseInt(progression);
    }
    if (lat !== undefined) updateData.lat = lat ? parseFloat(lat) : null;
    if (lng !== undefined) updateData.lng = lng ? parseFloat(lng) : null;

    // Mettre à jour le chantier
    const updatedChantier = await prisma.chantier.update({
      where: { id: id },
      data: updateData,
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
        _count: {
          select: {
            messages: true,
            comments: true,
            etapes: true,
          }
        }
      }
    });

    // Créer un événement de timeline si le statut a changé
    if (statut && statut !== existingChantier.statut) {
      const statusMessages = {
        PLANIFIE: "Le chantier a été replanifié",
        EN_COURS: "Le chantier a démarré",
        EN_ATTENTE: "Le chantier est en attente",
        TERMINE: "Le chantier est terminé",
        ANNULE: "Le chantier a été annulé",
      };

      await prisma.timelineEvent.create({
        data: {
          chantierId: id,
          titre: "Changement de statut",
          description: statusMessages[statut as ChantierStatus] || "Statut modifié",
          date: new Date(),
          type: statut === "TERMINE" ? "FIN" : statut === "EN_ATTENTE" ? "ATTENTE" : "ETAPE",
          createdById: session.user.id,
        }
      });
    }

    // Log modification réussie du chantier
    await logChantierAction(
      session.user.id,
      SecurityActions.CHANTIER_UPDATE,
      id,
      ip,
      userAgent,
      {
        changes: Object.keys(body),
        previousStatus: existingChantier.statut,
        newStatus: statut || existingChantier.statut,
      }
    );

    return NextResponse.json(updatedChantier);

  } catch (error) {
    console.error("Erreur lors de la mise à jour du chantier:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Les commerciaux et admins peuvent "supprimer" (soft delete) des chantiers
    if (session.user.role !== "ADMIN" && session.user.role !== "COMMERCIAL") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que le chantier existe et n'est pas déjà supprimé
    const chantier = await prisma.chantier.findUnique({
      where: { id: id }
    });

    if (!chantier) {
      return NextResponse.json(
        { error: "Chantier non trouvé" },
        { status: 404 }
      );
    }

    if (chantier.deletedAt) {
      return NextResponse.json(
        { error: "Chantier déjà supprimé" },
        { status: 400 }
      );
    }

    // Soft delete : marquer comme supprimé au lieu de supprimer réellement
    const updatedChantier = await prisma.chantier.update({
      where: { id: id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      }
    });

    // Créer un événement de timeline
    await prisma.timelineEvent.create({
      data: {
        chantierId: id,
        titre: "Chantier archivé",
        description: `Le chantier a été archivé par ${session.user.name}`,
        date: new Date(),
        type: "ATTENTE",
        createdById: session.user.id,
      }
    });

    return NextResponse.json({ 
      message: "Chantier archivé avec succès",
      chantier: updatedChantier
    });

  } catch (error) {
    console.error("Erreur lors de l'archivage du chantier:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}