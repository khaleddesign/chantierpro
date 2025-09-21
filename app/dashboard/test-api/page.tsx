'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TestAPIPage() {
  const { data: session, status } = useSession();
  const [apiResults, setApiResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testAPIs = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: API Users
      console.log('Testing /api/users...');
      const usersResponse = await fetch('/api/users?role=CLIENT&limit=10');
      results.users = {
        status: usersResponse.status,
        ok: usersResponse.ok,
        data: usersResponse.ok ? await usersResponse.json() : await usersResponse.text()
      };

      // Test 2: API CRM Clients
      console.log('Testing /api/crm/clients...');
      const crmResponse = await fetch('/api/crm/clients');
      results.crm = {
        status: crmResponse.status,
        ok: crmResponse.ok,
        data: crmResponse.ok ? await crmResponse.json() : await crmResponse.text()
      };

      // Test 3: API Health (sans auth)
      console.log('Testing /api/health...');
      const healthResponse = await fetch('/api/health');
      results.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthResponse.ok ? await healthResponse.json() : await healthResponse.text()
      };

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Erreur inconnue';
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
      <h1 className="text-2xl font-bold mb-4">Test des APIs</h1>
      
      <div className="mb-4">
        <p><strong>Utilisateur connecté:</strong> {session.user?.email}</p>
        <p><strong>Rôle:</strong> {session.user?.role}</p>
        <p><strong>ID:</strong> {session.user?.id}</p>
      </div>

      <button 
        onClick={testAPIs}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Test en cours...' : 'Tester les APIs'}
      </button>

      {Object.keys(apiResults).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Résultats des tests:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(apiResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
