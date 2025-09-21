'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TestUsersAPIPage() {
  const { data: session, status } = useSession();
  const [apiResults, setApiResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testUsersAPI = async () => {
    setLoading(true);
    const results: any = {};

    try {
      console.log('🔍 Testing Users API...');
      console.log('Session:', session);

      // Test 1: API Users sans paramètres
      console.log('Test 1: /api/users');
      const usersResponse = await fetch('/api/users');
      results.users = {
        status: usersResponse.status,
        ok: usersResponse.ok,
        data: usersResponse.ok ? await usersResponse.json() : await usersResponse.text()
      };

      // Test 2: API Users avec role=CLIENT
      console.log('Test 2: /api/users?role=CLIENT');
      const clientsResponse = await fetch('/api/users?role=CLIENT');
      results.clients = {
        status: clientsResponse.status,
        ok: clientsResponse.ok,
        data: clientsResponse.ok ? await clientsResponse.json() : await clientsResponse.text()
      };

      // Test 3: API Users avec role=CLIENT&limit=100
      console.log('Test 3: /api/users?role=CLIENT&limit=100');
      const clientsLimitResponse = await fetch('/api/users?role=CLIENT&limit=100');
      results.clientsLimit = {
        status: clientsLimitResponse.status,
        ok: clientsLimitResponse.ok,
        data: clientsLimitResponse.ok ? await clientsLimitResponse.json() : await clientsLimitResponse.text()
      };

      // Test 4: POST /api/users
      console.log('Test 4: POST /api/users');
      const postResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          role: 'CLIENT'
        })
      });
      results.post = {
        status: postResponse.status,
        ok: postResponse.ok,
        data: postResponse.ok ? await postResponse.json() : await postResponse.text()
      };

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Erreur inconnue';
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
      <h1 className="text-2xl font-bold mb-4">Test API Users</h1>
      
      <div className="mb-4">
        <p><strong>Utilisateur connecté:</strong> {session.user?.email}</p>
        <p><strong>Rôle:</strong> {session.user?.role}</p>
        <p><strong>ID:</strong> {session.user?.id}</p>
      </div>

      <button 
        onClick={testUsersAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Test en cours...' : 'Tester API Users'}
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
