import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DevisStatus, DevisType } from "@prisma/client";

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
    const type = searchParams.get("type");
    const clientId = searchParams.get("clientId") || "";
    const chantierId = searchParams.get("chantierId") || "";

    const skip = (page - 1) * limit;

    // Construction de la condition WHERE
    const where: any = {};

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
        { numero: { contains: search, mode: "insensitive" } },
        { objet: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (status && status !== "TOUS") {
      where.statut = status as DevisStatus;
    }

    if (type) {
      where.type = type as DevisType;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (chantierId) {
      where.chantierId = chantierId;
    }

    // Récupération des devis avec pagination
    const [devis, total] = await Promise.all([
      prisma.devis.findMany({
        where,
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
            }
          }
        }
      }),
      prisma.devis.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      devis,
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
    console.error("Erreur lors de la récupération des devis:", error);
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

    // Seuls les admins et commerciaux peuvent créer des devis
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      clientId,
      chantierId,
      type = "DEVIS",
      objet,
      dateEcheance,
      lignes = [],
      notes,
      conditionsVente,
      modalitesPaiement,
      tva = 20.0,
      retenueGarantie,
      autoliquidation = false,
    } = body;

    // Validation des champs obligatoires
    if (!clientId || !dateEcheance || !lignes.length) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
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

    // Vérifier le chantier s'il est spécifié
    if (chantierId) {
      const chantier = await prisma.chantier.findUnique({
        where: { id: chantierId },
        select: { id: true, clientId: true }
      });

      if (!chantier || chantier.clientId !== clientId) {
        return NextResponse.json(
          { error: "Chantier non valide pour ce client" },
          { status: 400 }
        );
      }
    }

    // Générer un numéro de devis unique
    const currentYear = new Date().getFullYear();
    const lastDevis = await prisma.devis.findFirst({
      where: {
        numero: {
          startsWith: `${type}-${currentYear}-`
        }
      },
      orderBy: { numero: "desc" }
    });

    let numeroSuite = 1;
    if (lastDevis) {
      const lastNumber = parseInt(lastDevis.numero.split('-')[2]);
      numeroSuite = lastNumber + 1;
    }

    const numero = `${type}-${currentYear}-${numeroSuite.toString().padStart(3, '0')}`;

    // Calculer les totaux
    const totalHT = lignes.reduce((sum: number, ligne: any) => sum + (ligne.quantite * ligne.prixUnit), 0);
    const totalTVA = autoliquidation ? 0 : (totalHT * tva) / 100;
    const totalTTC = totalHT + totalTVA;
    const montantRetenue = retenueGarantie ? (totalTTC * retenueGarantie) / 100 : 0;
    const montantFinal = totalTTC - montantRetenue;

    // Créer le devis dans une transaction
    const devis = await prisma.$transaction(async (tx) => {
      const newDevis = await tx.devis.create({
        data: {
          numero,
          clientId,
          chantierId: chantierId || null,
          type,
          objet: objet || `${type} ${numero}`,
          montant: montantFinal,
          totalHT,
          totalTVA,
          totalTTC,
          tva,
          dateEcheance: new Date(dateEcheance),
          notes,
          conditionsVente,
          modalitesPaiement,
          retenueGarantie,
          autoliquidation,
          statut: "BROUILLON",
        }
      });

      // Créer les lignes de devis
      for (let i = 0; i < lignes.length; i++) {
        const ligne = lignes[i];
        await tx.ligneDevis.create({
          data: {
            devisId: newDevis.id,
            description: ligne.description,
            quantite: parseFloat(ligne.quantite),
            prixUnit: parseFloat(ligne.prixUnit),
            total: parseFloat(ligne.quantite) * parseFloat(ligne.prixUnit),
            ordre: i + 1,
          }
        });
      }

      return newDevis;
    });

    // Récupérer le devis complet avec ses relations
    const fullDevis = await prisma.devis.findUnique({
      where: { id: devis.id },
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
          }
        },
        ligneDevis: {
          orderBy: { ordre: "asc" }
        }
      }
    });

    return NextResponse.json(fullDevis, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du devis:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}