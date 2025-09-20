#!/bin/bash

echo "🔍 DIAGNOSTIC DES NOMS D'UTILISATEURS DANS LA BASE DE DONNÉES"
echo "============================================================="
echo ""

# Charger les variables d'environnement depuis .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "1️⃣ VÉRIFICATION DE LA CONNEXION BASE DE DONNÉES..."
echo "URL: ${DATABASE_URL::50}..."

# Test de connexion et vérification des noms d'utilisateurs
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUserNames() {
    try {
        await prisma.$connect();
        console.log("✅ Connexion Prisma réussie");
        
        // Récupérer tous les utilisateurs avec leurs informations
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                company: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" }
        });
        
        console.log(`\n📊 UTILISATEURS TROUVÉS: ${users.length}`);
        console.log("=====================================");
        
        let usersWithoutNames = 0;
        let usersWithEmptyNames = 0;
        
        users.forEach((user, index) => {
            const hasName = user.name && user.name.trim();
            const isEmptyName = user.name === "" || user.name === null || user.name === undefined;
            
            if (!hasName) usersWithoutNames++;
            if (isEmptyName) usersWithEmptyNames++;
            
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Nom: "${user.name || "NULL/UNDEFINED"}"`);
            console.log(`   - Rôle: ${user.role}`);
            console.log(`   - Société: ${user.company || "N/A"}`);
            console.log(`   - Créé: ${user.createdAt.toISOString()}`);
            console.log(`   - Problème: ${!hasName ? "❌ PAS DE NOM" : "✅ OK"}`);
            console.log("");
        });
        
        console.log("📋 RÉSUMÉ:");
        console.log(`- Total utilisateurs: ${users.length}`);
        console.log(`- Sans nom valide: ${usersWithoutNames}`);
        console.log(`- Avec nom vide/null: ${usersWithEmptyNames}`);
        console.log(`- Avec nom valide: ${users.length - usersWithoutNames}`);
        
        if (usersWithoutNames > 0) {
            console.log("\n⚠️ PROBLÈME DÉTECTÉ:");
            console.log("Certains utilisateurs n ont pas de nom défini dans la base de données.");
            console.log("Cela explique pourquoi les messages affichent Utilisateur.");
            console.log("\n🔧 SOLUTION RECOMMANDÉE:");
            console.log("1. Mettre à jour les utilisateurs sans nom");
            console.log("2. Utiliser l email comme fallback dans l application");
            console.log("3. Corriger la logique de création d utilisateurs");
        } else {
            console.log("\n✅ TOUS LES UTILISATEURS ONT DES NOMS VALIDES");
        }
        
    } catch (error) {
        console.error("❌ Erreur lors de la vérification des utilisateurs:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserNames();
' || {
    echo "❌ Erreur lors de la vérification des noms d'utilisateurs."
    exit 1
}

echo ""
echo "🎯 ÉTAPES SUIVANTES:"
echo "1. Accéder à /dashboard/test-messages-debug pour tester en temps réel"
echo "2. Vérifier les logs de la console du navigateur"
echo "3. Corriger les utilisateurs sans nom si nécessaire"
echo ""
echo "✅ DIAGNOSTIC TERMINÉ !"