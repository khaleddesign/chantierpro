'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Database,
  Globe,
  Cloud,
  Mail,
  FileSignature,
  CreditCard
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  enabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'DEGRADED' | 'MAINTENANCE';
  baseUrl?: string;
  hasCredentials: boolean;
  lastHealthCheck?: string;
  lastSync?: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  logs: Array<{
    id: string;
    endpoint: string;
    method: string;
    success: boolean;
    timestamp: string;
  }>;
  syncRecords: Array<{
    id: string;
    syncType: string;
    status: string;
    startedAt: string;
  }>;
}

interface SyncRecord {
  id: string;
  syncType: string;
  direction: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  integration: {
    name: string;
    type: string;
    provider: string;
  };
}

const integrationTypeIcons = {
  ACCOUNTING: Database,
  MAPPING: Globe,
  WEATHER: Cloud,
  COMMUNICATION: Mail,
  CLOUD_STORAGE: Cloud,
  E_SIGNATURE: FileSignature,
  PAYMENT: CreditCard,
  OTHER: Settings
};

const statusColors = {
  ACTIVE: 'text-green-600 bg-green-50',
  INACTIVE: 'text-gray-600 bg-gray-50',
  ERROR: 'text-red-600 bg-red-50',
  DEGRADED: 'text-orange-600 bg-orange-50',
  MAINTENANCE: 'text-blue-600 bg-blue-50'
};

const syncStatusColors = {
  PENDING: 'text-yellow-600 bg-yellow-50',
  RUNNING: 'text-blue-600 bg-blue-50',
  COMPLETED: 'text-green-600 bg-green-50',
  FAILED: 'text-red-600 bg-red-50',
  CANCELLED: 'text-gray-600 bg-gray-50'
};

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('list');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  // États pour le formulaire de création
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    provider: '',
    enabled: false,
    baseUrl: '',
    apiKey: '',
    apiSecret: '',
    settings: '{}'
  });

  // Chargement des données
  const fetchData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, syncRes] = await Promise.all([
        fetch('/api/admin/integrations'),
        fetch('/api/admin/integrations/sync?limit=20')
      ]);

      if (integrationsRes.ok) {
        const integrationsData = await integrationsRes.json();
        setIntegrations(integrationsData.data.integrations);
      }

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setSyncRecords(syncData.data.syncRecords);
      }
    } catch (error) {
      console.error('Erreur chargement intégrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Création d'une intégration
  const handleCreate = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setFormData({
          name: '',
          type: '',
          provider: '',
          enabled: false,
          baseUrl: '',
          apiKey: '',
          apiSecret: '',
          settings: '{}'
        });
        fetchData();
      }
    } catch (error) {
      console.error('Erreur création intégration:', error);
    } finally {
      setCreating(false);
    }
  };

  // Synchronisation manuelle
  const handleSync = async (integrationId: string, syncType: string) => {
    try {
      setSyncing(integrationId);
      const response = await fetch('/api/admin/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          syncType,
          direction: 'BIDIRECTIONAL'
        })
      });

      if (response.ok) {
        // Rafraîchir après 2 secondes
        setTimeout(fetchData, 2000);
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    } finally {
      setSyncing(null);
    }
  };

  // Toggle activation/désactivation
  const toggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/integrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erreur toggle intégration:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle2 className="h-4 w-4" />;
      case 'ERROR': return <XCircle className="h-4 w-4" />;
      case 'DEGRADED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intégrations Externes</h1>
          <p className="text-muted-foreground">
            Gérer les connexions avec les services externes
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle intégration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle intégration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Comptabilité Sage"
                  />
                </div>
                <div>
                  <Label htmlFor="provider">Fournisseur</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="Ex: sage, mapbox, openweather"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCOUNTING">Comptabilité</SelectItem>
                    <SelectItem value="MAPPING">Cartographie</SelectItem>
                    <SelectItem value="WEATHER">Météo</SelectItem>
                    <SelectItem value="COMMUNICATION">Communication</SelectItem>
                    <SelectItem value="CLOUD_STORAGE">Stockage Cloud</SelectItem>
                    <SelectItem value="E_SIGNATURE">Signature Électronique</SelectItem>
                    <SelectItem value="PAYMENT">Paiement</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="baseUrl">URL de base</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.exemple.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiKey">Clé API</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="apiSecret">Secret API</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="settings">Configuration (JSON)</Label>
                <Textarea
                  id="settings"
                  value={formData.settings}
                  onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
                  placeholder='{"accountId": "...", "returnUrl": "..."}'
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="enabled">Activer immédiatement</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Intégrations</TabsTrigger>
          <TabsTrigger value="sync">Synchronisations</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Statistiques */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integrations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'ACTIVE').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {integrations.filter(i => i.status === 'ERROR').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integrations.length > 0 ? Math.round(
                    integrations.reduce((sum, i) => sum + (i.totalRequests > 0 ? (i.successfulRequests / i.totalRequests) * 100 : 0), 0) / integrations.length
                  ) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des intégrations */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const IconComponent = integrationTypeIcons[integration.type as keyof typeof integrationTypeIcons] || Settings;
              
              return (
                <Card key={integration.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>
                            {integration.provider} • {integration.type}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={statusColors[integration.status]}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(integration.status)}
                          <span>{integration.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Métriques */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Requêtes</div>
                        <div className="text-muted-foreground">
                          {integration.totalRequests}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Taux succès</div>
                        <div className="text-muted-foreground">
                          {integration.totalRequests > 0 
                            ? Math.round((integration.successfulRequests / integration.totalRequests) * 100)
                            : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Temps réponse</div>
                        <div className="text-muted-foreground">
                          {Math.round(integration.averageResponseTime)}ms
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Dernière sync</div>
                        <div className="text-muted-foreground">
                          {integration.lastSync 
                            ? new Date(integration.lastSync).toLocaleDateString('fr-FR')
                            : 'Jamais'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(integration.id, 'FULL')}
                        disabled={syncing === integration.id || integration.status !== 'ACTIVE'}
                      >
                        {syncing === integration.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleIntegration(integration.id, !integration.enabled)}
                      >
                        {integration.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>

                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>

                      {integration.baseUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={integration.baseUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Logs récents */}
                    {integration.logs.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Logs récents</div>
                        <div className="space-y-1">
                          {integration.logs.slice(0, 3).map((log) => (
                            <div key={log.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {log.method} {log.endpoint}
                              </span>
                              <div className="flex items-center space-x-2">
                                {log.success ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600" />
                                )}
                                <span className="text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {integrations.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune intégration configurée</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première intégration pour connecter ChantierPro à vos outils externes.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une intégration
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          {/* Historique des synchronisations */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des synchronisations</CardTitle>
              <CardDescription>
                Les 20 synchronisations les plus récentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge className={syncStatusColors[record.status]}>
                        {record.status}
                      </Badge>
                      <div>
                        <div className="font-medium">
                          {record.integration.name} - {record.syncType}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.direction} • {new Date(record.startedAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {record.status === 'COMPLETED' && (
                        <div className="text-sm">
                          <span className="text-green-600">{record.successfulItems} succès</span>
                          {record.failedItems > 0 && (
                            <span className="text-red-600 ml-2">{record.failedItems} erreurs</span>
                          )}
                        </div>
                      )}
                      {record.status === 'FAILED' && record.errorMessage && (
                        <div className="text-sm text-red-600 max-w-xs truncate">
                          {record.errorMessage}
                        </div>
                      )}
                      {record.completedAt && (
                        <div className="text-xs text-muted-foreground">
                          Durée: {Math.round((new Date(record.completedAt).getTime() - new Date(record.startedAt).getTime()) / 1000)}s
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {syncRecords.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune synchronisation effectuée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}