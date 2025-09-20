"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  attempt: number;
  status: number;
  message: string;
  remaining?: number;
  retryAfter?: number;
  timestamp: string;
}

export default function RateLimitTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('admin@chantierpro.fr');
  const [password, setPassword] = useState('wrongpassword');

  const makeLoginAttempt = async (attempt: number): Promise<TestResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const retryAfter = response.headers.get('Retry-After');

      return {
        attempt,
        status: response.status,
        message: data.error || data.message || 'Réponse inattendue',
        remaining: remaining ? parseInt(remaining) : undefined,
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch (error) {
      return {
        attempt,
        status: 0,
        message: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  };

  const runRateLimitTest = async () => {
    setIsLoading(true);
    setResults([]);
    
    const maxAttempts = 7; // Plus que la limite de 5 pour tester le blocage
    
    for (let i = 1; i <= maxAttempts; i++) {
      const result = await makeLoginAttempt(i);
      setResults(prev => [...prev, result]);
      
      // Si on reçoit un 429, on s'arrête
      if (result.status === 429) {
        break;
      }
      
      // Petite pause entre les tentatives
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusColor = (status: number) => {
    if (status === 401) return 'text-yellow-600';
    if (status === 429) return 'text-red-600';
    if (status === 200) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (status: number) => {
    if (status === 401) return '⚠️';
    if (status === 429) return '🚫';
    if (status === 200) return '✅';
    return '❓';
  };

  const isRateLimitTriggered = results.some(r => r.status === 429);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Test Rate Limiting - Login</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration du Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email de test</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@chantierpro.fr"
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe (incorrect)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe incorrect"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runRateLimitTest} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Test en cours...' : 'Lancer le Test'}
              </Button>
              <Button 
                onClick={clearResults} 
                variant="outline"
                disabled={isLoading}
              >
                Effacer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Type:</strong> AUTH</p>
            <p><strong>Limite:</strong> 5 tentatives par 15 minutes</p>
            <p><strong>Identifiant:</strong> IP + User-Agent</p>
            <p><strong>Store:</strong> Redis (fallback mémoire)</p>
            <p><strong>Endpoint:</strong> /api/auth/login</p>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Résultats du Test
              {isRateLimitTriggered && (
                <span className="text-green-600">✅ Rate Limiting Actif</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 border rounded-md ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(result.status)}</span>
                      <span className="font-medium">Tentative {result.attempt}</span>
                      <span className="text-sm text-gray-500">({result.timestamp})</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">HTTP {result.status}</div>
                      {result.remaining !== undefined && (
                        <div className="text-xs">Restantes: {result.remaining}</div>
                      )}
                      {result.retryAfter !== undefined && (
                        <div className="text-xs">Retry après: {result.retryAfter}s</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-sm">{result.message}</div>
                </div>
              ))}
            </div>

            {isRateLimitTriggered && (
              <Alert className="mt-4">
                <AlertDescription>
                  <strong>✅ Succès!</strong> Le rate limiting fonctionne correctement. 
                  Les tentatives répétées ont été bloquées avec le code HTTP 429.
                </AlertDescription>
              </Alert>
            )}

            {!isRateLimitTriggered && results.length >= 5 && (
              <Alert className="mt-4">
                <AlertDescription>
                  <strong>⚠️ Attention:</strong> Aucun blocage détecté après {results.length} tentatives. 
                  Vérifiez la configuration du rate limiter.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Ce test simule des tentatives de connexion répétées pour vérifier le rate limiting.</p>
        <p>Le rate limiting devrait bloquer après 5 tentatives échouées.</p>
      </div>
    </div>
  );
}
