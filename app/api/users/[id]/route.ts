import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role, TypeClient } from "@prisma/client";

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

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        adresse2: true,
        ville: true,
        codePostal: true,
        pays: true,
        typeClient: true,
        secteurActivite: true,
        effectif: true,
        chiffreAffaires: true,
        sourceProspection: true,
        prefEmail: true,
        prefSMS: true,
        prefAppel: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        commercial: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        commerciaux: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        chantiers: {
          select: {
            id: true,
            nom: true,
            statut: true,
            progression: true,
            budget: true,
            dateDebut: true,
            dateFin: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5
        },
        devis: {
          select: {
            id: true,
            numero: true,
            type: true,
            statut: true,
            montant: true,
            dateCreation: true,
          },
          orderBy: { dateCreation: "desc" },
          take: 5
        },
        interactions: {
          orderBy: { dateContact: "desc" },
          take: 5
        },
        opportunites: {
          orderBy: { createdAt: "desc" },
          take: 5
        },
        _count: {
          select: {
            chantiers: true,
            devis: true,
            messages: true,
            commerciaux: true,
            interactions: true,
            opportunites: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const hasAccess = 
      session.user.role === "ADMIN" ||
      session.user.id === id ||
      (session.user.role === "COMMERCIAL" && user.commercial?.id === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
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
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, role: true, commercial: true, email: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const canEdit = 
      session.user.role === "ADMIN" ||
      session.user.id === id ||
      (session.user.role === "COMMERCIAL" && existingUser.commercial?.id === session.user.id);

    if (!canEdit) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      phone,
      company,
      address,
      adresse2,
      ville,
      codePostal,
      pays,
      typeClient,
      secteurActivite,
      effectif,
      chiffreAffaires,
      sourceProspection,
      prefEmail,
      prefSMS,
      prefAppel,
      commercialId,
      image
    } = body;

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (address !== undefined) updateData.address = address;
    if (adresse2 !== undefined) updateData.adresse2 = adresse2;
    if (ville !== undefined) updateData.ville = ville;
    if (codePostal !== undefined) updateData.codePostal = codePostal;
    if (pays !== undefined) updateData.pays = pays;
    if (typeClient !== undefined) updateData.typeClient = typeClient as TypeClient;
    if (secteurActivite !== undefined) updateData.secteurActivite = secteurActivite;
    if (effectif !== undefined) updateData.effectif = effectif;
    if (chiffreAffaires !== undefined) updateData.chiffreAffaires = chiffreAffaires ? parseFloat(chiffreAffaires) : null;
    if (sourceProspection !== undefined) updateData.sourceProspection = sourceProspection;
    if (prefEmail !== undefined) updateData.prefEmail = prefEmail;
    if (prefSMS !== undefined) updateData.prefSMS = prefSMS;
    if (prefAppel !== undefined) updateData.prefAppel = prefAppel;
    if (image !== undefined) updateData.image = image;

    // Seuls les admins peuvent changer le rôle et le commercial assigné
    if (session.user.role === "ADMIN") {
      if (role !== undefined && Object.values(Role).includes(role)) {
        updateData.role = role as Role;
      }
      if (commercialId !== undefined) updateData.commercialId = commercialId;
    }

    // Hacher le nouveau mot de passe si fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        ville: true,
        codePostal: true,
        pays: true,
        typeClient: true,
        secteurActivite: true,
        effectif: true,
        chiffreAffaires: true,
        image: true,
        updatedAt: true,
        commercial: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
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

    // Seuls les admins peuvent supprimer des utilisateurs
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { 
        id: true,
        _count: {
          select: {
            chantiers: true,
            devis: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la suppression si l'utilisateur a des chantiers ou devis
    if (user._count.chantiers > 0 || user._count.devis > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un utilisateur avec des chantiers ou devis associés" },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}