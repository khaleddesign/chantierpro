'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TestDevisAPIPage() {
  const { data: session, status } = useSession();
  const [apiResults, setApiResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testDevisAPI = async () => {
    setLoading(true);
    const results: any = {};

    try {
      console.log('🔍 Testing Devis and Users APIs...');
      console.log('Session:', session);

      // Test 1: API Users avec role=CLIENT (utilisée par les formulaires)
      console.log('Test 1: /api/users?role=CLIENT');
      const usersResponse = await fetch('/api/users?role=CLIENT');
      results.usersClients = {
        status: usersResponse.status,
        ok: usersResponse.ok,
        data: usersResponse.ok ? await usersResponse.json() : await usersResponse.text()
      };

      // Test 2: API Users avec role=CLIENT&limit=100 (utilisée par CRM)
      console.log('Test 2: /api/users?role=CLIENT&limit=100');
      const usersLimitResponse = await fetch('/api/users?role=CLIENT&limit=100');
      results.usersClientsLimit = {
        status: usersLimitResponse.status,
        ok: usersLimitResponse.ok,
        data: usersLimitResponse.ok ? await usersLimitResponse.json() : await usersLimitResponse.text()
      };

      // Test 3: API Devis
      console.log('Test 3: /api/devis');
      const devisResponse = await fetch('/api/devis');
      results.devis = {
        status: devisResponse.status,
        ok: devisResponse.ok,
        data: devisResponse.ok ? await devisResponse.json() : await devisResponse.text()
      };

      // Test 4: API Chantiers
      console.log('Test 4: /api/chantiers');
      const chantiersResponse = await fetch('/api/chantiers');
      results.chantiers = {
        status: chantiersResponse.status,
        ok: chantiersResponse.ok,
        data: chantiersResponse.ok ? await chantiersResponse.json() : await chantiersResponse.text()
      };

    } catch (error) {
      results.error = error.message;
      console.error('Test error:', error);
    }

    setApiResults(results);
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
      <h1 className="text-2xl font-bold mb-4">Test APIs Devis et Chantiers</h1>
      
      <div className="mb-4">
        <p><strong>Utilisateur connecté:</strong> {session.user?.email}</p>
        <p><strong>Rôle:</strong> {session.user?.role}</p>
        <p><strong>ID:</strong> {session.user?.id}</p>
      </div>

      <button 
        onClick={testDevisAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Test en cours...' : 'Tester APIs Devis/Chantiers'}
      </button>

      {Object.keys(apiResults).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Résultats des tests:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(apiResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
