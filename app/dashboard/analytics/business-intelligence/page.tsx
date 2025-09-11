'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building2, 
  AlertTriangle,
  Target,
  Clock,
  PieChart,
  BarChart3,
  LineChart,
  RefreshCw,
  Download,
  Calendar,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  ComposedChart,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';

interface PerformanceData {
  chiffreAffaires: {
    total: number;
    evolution: number;
    parMois: Array<{ mois: string; montant: number }>;
    parType: Array<{ type: string; montant: number; pourcentage: number }>;
  };
  marges: {
    bruteMoyenne: number;
    netteMoyenne: number;
    parChantier: Array<{ chantierId: string; nom: string; marge: number }>;
  };
  productivite: {
    tempsPasseParChantier: number;
    tauxUtilisation: number;
    efficaciteEquipes: Array<{ equipeId: string; nom: string; efficacite: number }>;
  };
}

interface PredictiveData {
  tendances: {
    chiffreAffairesPrevu: Array<{ mois: string; prevision: number; confiance: number }>;
    demandeParSecteur: Array<{ secteur: string; croissance: number }>;
  };
  risques: {
    clientsRisque: Array<{ clientId: string; nom: string; scoreRisque: number; raisons: string[] }>;
    chantiersRetard: Array<{ chantierId: string; nom: string; retardPrevu: number }>;
  };
  opportunites: {
    secteursCroissance: Array<{ secteur: string; potentiel: number }>;
    clientsPotentiels: Array<{ clientId: string; nom: string; potentiel: number }>;
  };
}

interface BTPMetrics {
  operationnels: {
    tauxRealisation: number;
    qualiteExecution: number;
    tauxDefauts: number;
    tempsMovenIntervention: number;
  };
  financiers: {
    delaiPaiement: number;
    tauxImpayesSur: number;
    rentabiliteParMetier: Array<{ metier: string; rentabilite: number }>;
  };
  ressources: {
    utilisationMateriel: number;
    productiviteOuvriers: number;
    tauxAbsenteisme: number;
  };
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function BusinessIntelligencePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [periode, setPeriode] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // États des données
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null);
  const [btpMetrics, setBtpMetrics] = useState<BTPMetrics | null>(null);
  const [report, setReport] = useState<any>(null);

  // Chargement des données
  const fetchData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [performanceRes, predictiveRes, btpRes] = await Promise.all([
        fetch(`/api/analytics/business-intelligence?type=performance&periode=${periode}`),
        fetch('/api/analytics/business-intelligence?type=predictive'),
        fetch(`/api/analytics/business-intelligence?type=btp&periode=${periode}`)
      ]);

      if (performanceRes.ok) {
        const perfData = await performanceRes.json();
        setPerformanceData(perfData.data);
      }

      if (predictiveRes.ok) {
        const predData = await predictiveRes.json();
        setPredictiveData(predData.data);
      }

      if (btpRes.ok) {
        const btpData = await btpRes.json();
        setBtpMetrics(btpData.data);
      }

    } catch (error) {
      console.error('Erreur chargement données BI:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Génération de rapport
  const generateReport = async (type: 'hebdomadaire' | 'mensuel' | 'trimestriel') => {
    try {
      const response = await fetch(`/api/analytics/business-intelligence?type=report&reportType=${type}`);
      if (response.ok) {
        const reportData = await response.json();
        setReport(reportData.data);
      }
    } catch (error) {
      console.error('Erreur génération rapport:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periode]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-muted-foreground">
            Analyses avancées et insights métier pour ChantierPro
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={periode} onValueChange={setPeriode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="6m">6 derniers mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Rapport automatique */}
      {report && (
        <Alert className="border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4" />
          <AlertTitle>Rapport automatique généré</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">{report.resume}</p>
            {report.alertes.length > 0 && (
              <div className="mb-2">
                <strong>Alertes :</strong>
                <ul className="list-disc list-inside mt-1">
                  {report.alertes.map((alerte: string, index: number) => (
                    <li key={index} className="text-sm">{alerte}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.recommandations.length > 0 && (
              <div>
                <strong>Recommandations :</strong>
                <ul className="list-disc list-inside mt-1">
                  {report.recommandations.slice(0, 3).map((reco: string, index: number) => (
                    <li key={index} className="text-sm">{reco}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictive">Prédictif</TabsTrigger>
          <TabsTrigger value="btp">Métriques BTP</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs principaux */}
          {performanceData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(performanceData.chiffreAffaires.total)}
                  </div>
                  <div className="flex items-center text-xs">
                    {performanceData.chiffreAffaires.evolution > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={performanceData.chiffreAffaires.evolution > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercent(performanceData.chiffreAffaires.evolution)}
                    </span>
                    <span className="text-muted-foreground ml-1">vs période précédente</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Marge brute</CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceData.marges.bruteMoyenne.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Nette: {performanceData.marges.netteMoyenne.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productivité</CardTitle>
                  <Clock className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(performanceData.productivite.tauxUtilisation * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {performanceData.productivite.tempsPasseParChantier}j/chantier
                  </div>
                </CardContent>
              </Card>

              {btpMetrics && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Réalisation</CardTitle>
                    <Building2 className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {btpMetrics.operationnels.tauxRealisation.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qualité: {btpMetrics.operationnels.qualiteExecution}/100
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Évolution du CA */}
          {performanceData && (
            <Card>
              <CardHeader>
                <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData.chiffreAffaires.parMois}>
                    <defs>
                      <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'CA']} />
                    <Area
                      type="monotone"
                      dataKey="montant"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorCA)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Alertes et recommandations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Actions recommandées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => generateReport('mensuel')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Générer rapport mensuel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter données
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer alerte
                </Button>
              </CardContent>
            </Card>

            {predictiveData && predictiveData.risques.clientsRisque.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Clients à risque
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictiveData.risques.clientsRisque.slice(0, 3).map((client) => (
                      <div key={client.clientId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{client.nom}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.raisons[0]}
                          </p>
                        </div>
                        <Badge
                          variant="destructive"
                          className="bg-red-100 text-red-700"
                        >
                          {client.scoreRisque}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performanceData && (
            <>
              {/* Répartition CA par type */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition du chiffre d'affaires par type de client</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsPieChart>
                      <Pie
                        data={performanceData.chiffreAffaires.parType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, pourcentage }) => `${name} (${pourcentage.toFixed(1)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="montant"
                      >
                        {performanceData.chiffreAffaires.parType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Montant']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Marges par chantier */}
              <Card>
                <CardHeader>
                  <CardTitle>Marges par chantier (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={performanceData.marges.parChantier.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nom" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Marge']} />
                      <Bar dataKey="marge" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          {predictiveData && (
            <>
              {/* Prévisions CA */}
              <Card>
                <CardHeader>
                  <CardTitle>Prévisions chiffre d'affaires</CardTitle>
                  <CardDescription>
                    Projections basées sur l'historique et les tendances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={predictiveData.tendances.chiffreAffairesPrevu}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="prevision" fill="#3b82f6" opacity={0.7} />
                      <Line
                        type="monotone"
                        dataKey="confiance"
                        stroke="#10b981"
                        yAxisId="right"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Clients à risque détaillés */}
              {predictiveData.risques.clientsRisque.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse des risques clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {predictiveData.risques.clientsRisque.map((client) => (
                        <div key={client.clientId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{client.nom}</h4>
                            <Badge
                              variant={client.scoreRisque > 70 ? "destructive" : "secondary"}
                            >
                              Risque: {client.scoreRisque}%
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {client.raisons.map((raison, index) => (
                              <p key={index} className="text-sm text-muted-foreground">
                                • {raison}
                              </p>
                            ))}
                          </div>
                          <Progress
                            value={client.scoreRisque}
                            className="mt-2"
                            color={client.scoreRisque > 70 ? "bg-red-600" : "bg-orange-600"}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="btp" className="space-y-6">
          {btpMetrics && (
            <>
              {/* Métriques opérationnelles */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Taux réalisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {btpMetrics.operationnels.tauxRealisation.toFixed(1)}%
                    </div>
                    <Progress value={btpMetrics.operationnels.tauxRealisation} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Qualité d'exécution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {btpMetrics.operationnels.qualiteExecution}/100
                    </div>
                    <Progress value={btpMetrics.operationnels.qualiteExecution} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Délai paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {btpMetrics.financiers.delaiPaiement.toFixed(0)}j
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Objectif: &lt;30 jours
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Utilisation matériel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {btpMetrics.ressources.utilisationMateriel}%
                    </div>
                    <Progress value={btpMetrics.ressources.utilisationMateriel} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Rentabilité par métier */}
              <Card>
                <CardHeader>
                  <CardTitle>Rentabilité par corps d'état</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={btpMetrics.financiers.rentabiliteParMetier}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metier" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Rentabilité']} />
                      <Bar dataKey="rentabilite" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Métriques détaillées */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Efficacité opérationnelle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Taux de défauts</span>
                      <span className="font-semibold">
                        {btpMetrics.operationnels.tauxDefauts}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temps moyen d'intervention</span>
                      <span className="font-semibold">
                        {btpMetrics.operationnels.tempsMovenIntervention}j
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux d'absentéisme</span>
                      <span className="font-semibold">
                        {btpMetrics.ressources.tauxAbsenteisme}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance financière</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Taux d'impayés</span>
                      <span className="font-semibold text-red-600">
                        {btpMetrics.financiers.tauxImpayesSur}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Productivité ouvriers</span>
                      <span className="font-semibold">
                        {formatCurrency(btpMetrics.ressources.productiviteOuvriers)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}