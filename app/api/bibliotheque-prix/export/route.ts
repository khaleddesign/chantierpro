import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Exporter la bibliothèque de prix
export async function POST(request: NextRequest) {
  try {
    const { format, filters } = await request.json();
    
    const where: any = {};
    
    if (filters?.corpsEtat && filters.corpsEtat !== 'TOUS') {
      where.corpsEtat = filters.corpsEtat;
    }
    
    if (filters?.region && filters.region !== 'TOUS') {
      where.region = filters.region;
    }

    try {
      const prix = await db.bibliothequePrix.findMany({
        where,
        orderBy: [
          { corpsEtat: 'asc' },
          { code: 'asc' }
        ]
      });

      if (format === 'csv') {
        const csvContent = generateCSV(prix);
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="bibliotheque-prix-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      } else {
        return NextResponse.json(prix, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="bibliotheque-prix-${new Date().toISOString().split('T')[0]}.json"`
          }
        });
      }

    } catch (dbError) {
      console.warn('Base de données non disponible, export simulé');
      
      const mockPrix = [
        {
          code: 'MA.01.001',
          designation: 'Béton armé pour fondations',
          unite: 'm³',
          prixHT: 180.50,
          corpsEtat: 'Maçonnerie',
          region: 'Île-de-France'
        }
      ];

      if (format === 'csv') {
        const csvContent = generateCSV(mockPrix);
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="bibliotheque-prix-demo.csv"`
          }
        });
      }

      return NextResponse.json(mockPrix);
    }

  } catch (error) {
    console.error('Erreur export prix:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 });
  }
}

function generateCSV(prix: any[]): string {
  const headers = ['Code', 'Designation', 'Unite', 'Prix HT', 'Corps Etat', 'Region'];
  let csvContent = headers.join(',') + '\n';

  prix.forEach((p) => {
    const row = [
      p.code,
      `"${p.designation.replace(/"/g, '""')}"`, // Échapper les guillemets
      p.unite,
      p.prixHT,
      `"${p.corpsEtat}"`,
      `"${p.region || 'France'}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  return csvContent;
}
