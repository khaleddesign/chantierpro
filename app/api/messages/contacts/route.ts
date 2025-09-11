import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    console.log(`Récupération contacts pour utilisateur: ${userId}`);

    const contacts = [
      { 
        id: 'contact-1', 
        name: 'Marie Commercial', 
        email: 'marie@chantierpro.fr', 
        role: 'COMMERCIAL',
        company: 'ChantierPro'
      },
      { 
        id: 'contact-2', 
        name: 'Pierre Client', 
        email: 'pierre@example.com', 
        role: 'CLIENT',
        company: 'Client Corp'
      },
      { 
        id: 'contact-3', 
        name: 'Jean Ouvrier', 
        email: 'jean@example.com', 
        role: 'OUVRIER',
        company: 'BTP Pro'
      }
    ];

    console.log(`Retour de ${contacts.length} contacts`);

    return NextResponse.json({
      contacts,
      success: true,
      userRole: 'CLIENT',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API contacts:', error);
    return NextResponse.json({
      error: 'Erreur lors du chargement des contacts',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
