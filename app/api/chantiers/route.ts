import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChantierStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId") || "";

    const skip = (page - 1) * limit;

    // Construction de la condition WHERE
    const where: any = {
      // Par défaut, exclure les chantiers supprimés (sauf pour les admins qui demandent explicitement)
      deletedAt: searchParams.get("includeDeleted") === "true" && session.user.role === "ADMIN" 
        ? undefined 
        : null
    };

    // Filtrage par rôle utilisateur
    if (session.user.role === "CLIENT") {
      where.clientId = session.user.id;
    } else if (session.user.role === "COMMERCIAL") {
      where.client = {
        commercialId: session.user.id
      };
    }

    // Filtres additionnels
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { adresse: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (status && status !== "TOUS") {
      where.statut = status as ChantierStatus;
    }

    // clientId est déjà géré dans le filtrage par rôle ci-dessus
    // Pas besoin de l'ajouter ici car cela créerait une faille de sécurité

    // Récupération des chantiers avec pagination
    const [chantiers, total] = await Promise.all([
      prisma.chantier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
              documents: true,
            }
          }
        }
      }),
      prisma.chantier.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      chantiers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des chantiers:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Les admins, commerciaux et clients peuvent créer des chantiers
    if (!["ADMIN", "COMMERCIAL", "CLIENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.log('Erreur parsing JSON dans POST /api/chantiers:', parseError);
      return NextResponse.json({ error: "Données JSON invalides" }, { status: 400 });
    }
    
    const {
      nom,
      description,
      adresse,
      clientId,
      dateDebut,
      dateFin,
      budget,
      superficie,
      photo,
      lat,
      lng
    } = body;

    // Validation des champs obligatoires
    const missingFields = [];
    if (!nom) missingFields.push('nom');
    if (!description) missingFields.push('description');
    if (!adresse) missingFields.push('adresse');
    if (!clientId) missingFields.push('clientId');
    if (!dateDebut) missingFields.push('dateDebut');
    if (!dateFin) missingFields.push('dateFin');
    if (!budget || budget < 0) missingFields.push('budget'); // Permettre budget = 0
    // superficie est optionnel selon le schéma Zod
    
    if (missingFields.length > 0) {
      console.log('Champs manquants:', missingFields, 'Données reçues:', { nom, description, adresse, clientId, dateDebut, dateFin, budget, superficie });
      return NextResponse.json(
        { error: `Champs obligatoires manquants: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Pour les clients, ils ne peuvent créer que leurs propres chantiers
    if (session.user.role === "CLIENT" && clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Un client ne peut créer que ses propres chantiers" },
        { status: 403 }
      );
    }

    // Vérifier que le client existe
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, role: true }
    });

    if (!client || client.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Client non valide" },
        { status: 400 }
      );
    }

    // Créer le chantier et l'événement timeline dans une transaction
    const chantier = await prisma.$transaction(async (tx) => {
      // Créer le chantier
      const newChantier = await tx.chantier.create({
        data: {
          nom,
          description,
          adresse,
          clientId,
          dateDebut: new Date(dateDebut),
          dateFin: new Date(dateFin),
          budget: parseFloat(budget),
          superficie,
          photo,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          statut: "PLANIFIE",
          progression: 0,
        },
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

      // Créer un événement de timeline pour la création (optionnel)
      try {
        await tx.timelineEvent.create({
          data: {
            chantierId: newChantier.id,
            titre: "Chantier créé",
            description: `Le chantier "${nom}" a été créé et planifié.`,
            date: new Date(),
            type: "DEBUT",
            createdById: session.user.id,
          }
        });
      } catch (timelineError) {
        console.warn('Erreur création timeline (non bloquante):', timelineError);
        // Ne pas faire échouer la transaction pour cette erreur
      }

      return newChantier;
    });

    return NextResponse.json(chantier, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du chantier:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}