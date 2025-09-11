import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Importer des prix depuis un fichier CSV/JSON
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string || 'csv';
    const overwrite = formData.get('overwrite') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const fileContent = await file.text();
    let prixData: any[] = [];

    try {
      if (format === 'json') {
        prixData = JSON.parse(fileContent);
      } else {
        // Parse CSV (format simple : code,designation,unite,prixHT,corpsEtat,region)
        const lines = fileContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        prixData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const prix: any = {};
          headers.forEach((header, index) => {
            if (header === 'prixHT') {
              prix[header] = parseFloat(values[index]) || 0;
            } else {
              prix[header] = values[index] || '';
            }
          });
          return prix;
        });
      }
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Erreur de format de fichier',
        details: 'Vérifiez que votre fichier respecte le format attendu'
      }, { status: 400 });
    }

    // Validation des données
    const requiredFields = ['code', 'designation', 'unite', 'prixHT', 'corpsEtat'];
    const invalidEntries: any[] = [];
    const validEntries: any[] = [];

    prixData.forEach((prix, index) => {
      const errors: string[] = [];
      
      requiredFields.forEach(field => {
        if (!prix[field]) {
          errors.push(`${field} manquant`);
        }
      });

      if (prix.prixHT && (isNaN(prix.prixHT) || prix.prixHT < 0)) {
        errors.push('Prix invalide');
      }

      if (errors.length > 0) {
        invalidEntries.push({
          ligne: index + 2, // +2 car index commence à 0 et on ignore l'en-tête
          prix,
          errors
        });
      } else {
        validEntries.push({
          ...prix,
          region: prix.region || 'France',
          dateMAJ: new Date()
        });
      }
    });

    if (invalidEntries.length > 0 && validEntries.length === 0) {
      return NextResponse.json({
        error: 'Aucune entrée valide trouvée',
        invalidEntries: invalidEntries.slice(0, 10) // Limiter à 10 erreurs
      }, { status: 400 });
    }

    try {
      let imported = 0;
      let updated = 0;
      let skipped = 0;

      for (const prixData of validEntries) {
        const existingPrix = await db.bibliothequePrix.findUnique({
          where: { code: prixData.code }
        });

        if (existingPrix) {
          if (overwrite) {
            await db.bibliothequePrix.update({
              where: { code: prixData.code },
              data: prixData
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await db.bibliothequePrix.create({
            data: prixData
          });
          imported++;
        }
      }

      return NextResponse.json({
        success: true,
        imported,
        updated,
        skipped,
        invalidEntries: invalidEntries.length,
        message: `Import terminé : ${imported} créés, ${updated} mis à jour, ${skipped} ignorés`
      });

    } catch (dbError) {
      console.warn('Base de données non disponible, simulation de l\'import');
      
      return NextResponse.json({
        success: true,
        imported: validEntries.length,
        updated: 0,
        skipped: 0,
        invalidEntries: invalidEntries.length,
        message: `Import simulé : ${validEntries.length} entrées traitées`,
        simulation: true
      });
    }

  } catch (error) {
    console.error('Erreur import prix:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'import',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
