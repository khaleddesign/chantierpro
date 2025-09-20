"use client";

import { useState } from 'react';
import { useDevis } from '@/hooks/useDevis.modern';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

/**
 * Composant de démonstration de l'architecture optimiste avancée
 * Montre les opérations en attente, le rollback automatique et la synchronisation
 */
export default function OptimisticUpdatesDemo() {
  const {
    devis,
    loading,
    error,
    createDevis,
    updateDevis,
    deleteDevis,
    pendingOperations,
    hasPendingOperations,
    lastSync,
    isSyncing,
    clearError
  } = useDevis();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // ✅ Création optimiste avec gestion d'erreur
  const handleCreateDevis = async () => {
    setIsCreating(true);
    try {
      const newDevis = {
        clientId: 'client-demo',
        objet: `Devis Demo ${Date.now()}`,
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lignes: [
          { description: 'Travaux de démonstration', quantite: 1, prixUnit: 1000 }
        ],
        tva: 20,
        autoliquidation: false
      };

      await createDevis(newDevis);
      console.log('✅ Devis créé avec succès');
    } catch (error) {
      console.error('❌ Erreur création devis:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // ✅ Mise à jour optimiste avec gestion d'erreur
  const handleUpdateDevis = async (devisId: string) => {
    setIsUpdating(devisId);
    try {
      await updateDevis(devisId, {
        objet: `Devis Modifié ${Date.now()}`,
        statut: 'ACCEPTE' as any
      });
      console.log('✅ Devis mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur mise à jour devis:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // ✅ Suppression optimiste avec gestion d'erreur
  const handleDeleteDevis = async (devisId: string) => {
    setIsDeleting(devisId);
    try {
      await deleteDevis(devisId);
      console.log('✅ Devis supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur suppression devis:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🚀 Architecture Optimiste Avancée</h1>
        <p className="text-gray-600">Démonstration des opérations optimistes avec rollback automatique</p>
      </div>

      {/* ✅ Indicateurs de statut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Opérations en Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingOperations.length}
            </div>
            <p className="text-xs text-gray-600">
              {hasPendingOperations ? 'Opérations non confirmées' : 'Toutes les opérations confirmées'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isSyncing ? 'En cours' : 'OK'}
            </div>
            <p className="text-xs text-gray-600">
              Dernière sync: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Jamais'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              État Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {error ? 'Erreur' : 'Stable'}
            </div>
            <p className="text-xs text-gray-600">
              {error ? 'Problème détecté' : 'Système opérationnel'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Gestion d'erreur */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={clearError}>
              Effacer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ Actions de démonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de Démonstration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleCreateDevis} 
              disabled={isCreating || loading}
              className="flex items-center gap-2"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Créer Devis Optimiste
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>• <strong>Création optimiste</strong> : Affichage immédiat avec ID temporaire</p>
            <p>• <strong>Rollback automatique</strong> : Si l'API échoue après 10s</p>
            <p>• <strong>Confirmation</strong> : Remplacement par les vraies données</p>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Liste des opérations en attente */}
      {pendingOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Opérations en Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingOperations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium">{operation.type.toUpperCase()} - {operation.entity.id}</p>
                      <p className="text-sm text-gray-600">
                        Il y a {Math.round((Date.now() - operation.timestamp) / 1000)}s
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    En attente
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Liste des devis */}
      <Card>
        <CardHeader>
          <CardTitle>Devis ({devis.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : devis.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun devis trouvé</p>
          ) : (
            <div className="space-y-3">
              {devis.map((devis) => (
                <div key={devis.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{devis.objet}</p>
                    <p className="text-sm text-gray-600">ID: {devis.id}</p>
                    <p className="text-sm text-gray-600">Statut: {devis.statut}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateDevis(devis.id)}
                      disabled={isUpdating === devis.id}
                    >
                      {isUpdating === devis.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Modifier'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDevis(devis.id)}
                      disabled={isDeleting === devis.id}
                    >
                      {isDeleting === devis.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Supprimer'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Informations techniques */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Techniques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Timeout de rollback :</strong> 10 secondes</p>
          <p><strong>Synchronisation automatique :</strong> Toutes les 60 secondes</p>
          <p><strong>Gestion d'erreur :</strong> Rollback automatique en cas d'échec API</p>
          <p><strong>ID temporaires :</strong> Générés avec timestamp pour éviter les conflits</p>
        </CardContent>
      </Card>
    </div>
  );
}
