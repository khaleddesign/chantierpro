'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TestDataSavePage() {
  const { data: session, status } = useSession();
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testDataSave = async () => {
    setLoading(true);
    const results: any = {};

    try {
      console.log('🔍 Testing Data Save APIs...');
      console.log('Session:', session);

      if (!session) {
        results.error = 'Aucune session trouvée';
        setTestResults(results);
        setLoading(false);
        return;
      }

      // Test 1: Créer un client simple
      console.log('Test 1: POST /api/users (créer client)');
      const createClientResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Client Test Data Save',
          email: `test-datasave-${Date.now()}@example.com`,
          password: 'test123',
          role: 'CLIENT',
          phone: '0123456789',
          company: 'Test Company',
          typeClient: 'PARTICULIER'
        })
      });
      
      results.createClient = {
        status: createClientResponse.status,
        ok: createClientResponse.ok,
        data: createClientResponse.ok ? await createClientResponse.json() : await createClientResponse.text()
      };

      // Test 2: Créer un chantier simple
      console.log('Test 2: POST /api/chantiers (créer chantier)');
      const createChantierResponse = await fetch('/api/chantiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: 'Chantier Test Data Save',
          description: 'Test de sauvegarde de données',
          adresse: '123 Rue Test',
          clientId: session.user.id, // Utiliser l'ID de l'utilisateur connecté
          dateDebut: new Date().toISOString().split('T')[0],
          dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          budget: 10000,
          superficie: '100'
        })
      });
      
      results.createChantier = {
        status: createChantierResponse.status,
        ok: createChantierResponse.ok,
        data: createChantierResponse.ok ? await createChantierResponse.json() : await createChantierResponse.text()
      };

      // Test 3: Créer un devis simple
      console.log('Test 3: POST /api/devis (créer devis)');
      const createDevisResponse = await fetch('/api/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: session.user.id,
          type: 'DEVIS',
          objet: 'Test de sauvegarde de données',
          dateEcheance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Test de sauvegarde',
          lignes: [
            {
              description: 'Travaux de test',
              quantite: 1,
              prixUnit: 1000
            }
          ]
        })
      });
      
      results.createDevis = {
        status: createDevisResponse.status,
        ok: createDevisResponse.ok,
        data: createDevisResponse.ok ? await createDevisResponse.json() : await createDevisResponse.text()
      };

      // Test 4: Vérifier les utilisateurs existants
      console.log('Test 4: GET /api/users');
      const getUsersResponse = await fetch('/api/users');
      results.getUsers = {
        status: getUsersResponse.status,
        ok: getUsersResponse.ok,
        data: getUsersResponse.ok ? await getUsersResponse.json() : await getUsersResponse.text()
      };

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Test error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  if (status === 'loading') {
    return <div className="p-8">Chargement de la session...</div>;
  }

  if (!session) {
    return <div className="p-8">Non connecté</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Sauvegarde Données</h1>
      
      <div className="mb-4">
        <p><strong>Utilisateur connecté:</strong> {session.user?.email}</p>
        <p><strong>Rôle:</strong> {session.user?.role}</p>
        <p><strong>ID:</strong> {session.user?.id}</p>
      </div>

      <button 
        onClick={testDataSave}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Test en cours...' : 'Tester Sauvegarde Données'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Résultats des tests:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
