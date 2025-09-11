import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        _count: {
          select: {
            chantiers: true,
            devis: true,
            messages: true,
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

    return NextResponse.json(user);

  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
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
      image,
      currentPassword,
      newPassword
    } = body;

    // Validation des champs obligatoires
    if (!name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      name,
      phone: phone || null,
      company: company || null,
      address: address || null,
      adresse2: adresse2 || null,
      ville: ville || null,
      codePostal: codePostal || null,
      pays: pays || "France",
      typeClient,
      secteurActivite: secteurActivite || null,
      effectif: effectif || null,
      chiffreAffaires: chiffreAffaires ? parseFloat(chiffreAffaires) : null,
      sourceProspection: sourceProspection || null,
      prefEmail: prefEmail !== undefined ? prefEmail : true,
      prefSMS: prefSMS !== undefined ? prefSMS : false,
      prefAppel: prefAppel !== undefined ? prefAppel : true,
      image: image || null,
    };

    // Gestion du changement de mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Le mot de passe actuel est requis pour le changer" },
          { status: 400 }
        );
      }

      // Récupérer l'utilisateur avec son mot de passe
      const userWithPassword = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true }
      });

      if (!userWithPassword?.password) {
        return NextResponse.json(
          { error: "Aucun mot de passe défini" },
          { status: 400 }
        );
      }

      // Vérifier l'ancien mot de passe
      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password);
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 400 }
        );
      }

      // Hacher le nouveau mot de passe
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
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
        prefEmail: true,
        prefSMS: true,
        prefAppel: true,
        image: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      message: "Profil mis à jour avec succès",
      user: updatedUser
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}