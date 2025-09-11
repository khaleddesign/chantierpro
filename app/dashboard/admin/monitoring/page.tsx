'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Activity, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  TrendingUp,
  Server,
  Database,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SecurityLog {
  id: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  user?: { email: string; role: string; nom?: string };
}

interface PerformanceMetric {
  id: string;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: string;
  memoryUsage?: number;
  dbQueries?: number;
  cacheHits?: number;
  cacheMisses?: number;
}

interface SecurityStats {
  totalLogs: number;
  failedAttempts: number;
  successRate: string;
  criticalAlerts: number;
  highRiskAlerts: number;
  byRiskLevel: Record<string, number>;
  suspiciousActions: Array<{ action: string; count: number }>;
  suspiciousIPs: Array<{ ipAddress: string; count: number }>;
  hourlyTrends: Array<{ hour: string; total: number; failures: number; alerts: number }>;
}

interface PerformanceStats {
  total: number;
  avgDuration: number;
  p50: number;
  p95: number;
  p99: number;
  minDuration: number;
  maxDuration: number;
}

const COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#dc2626'
};

export default function MonitoringDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // États pour les données de sécurité
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  
  // États pour les données de performance
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);

  // Chargement des données
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [securityResponse, performanceResponse] = await Promise.all([
        fetch(`/api/admin/security?timeframe=${timeframe}&limit=50`),
        fetch(`/api/admin/performance?timeframe=${timeframe}&limit=50`)
      ]);

      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        setSecurityLogs(securityData.data.logs);
        setSecurityStats(securityData.data.summary);
      }

      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformanceMetrics(performanceData.data.metrics);
        setPerformanceStats(performanceData.data.stats.global);
      }

    } catch (error) {
      console.error('Erreur chargement données monitoring:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [timeframe]);

  const handleRefresh = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Chargement du monitoring...</p>
        </div>
      </div>
    );
  }

  const getRiskLevelColor = (level: string) => {
    return COLORS[level as keyof typeof COLORS] || '#6b7280';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code >= 300 && code < 400) return 'text-blue-600';
    if (code >= 400 && code < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  // Données pour les graphiques
  const riskLevelData = securityStats ? Object.entries(securityStats.byRiskLevel).map(([level, count]) => ({
    name: level,
    value: count,
    color: getRiskLevelColor(level)
  })) : [];

  const performanceTrends = performanceMetrics
    .slice(-20)
    .map(metric => ({
      time: new Date(metric.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      duration: metric.duration,
      status: metric.statusCode
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Système</h1>
          <p className="text-muted-foreground">
            Surveillance de la sécurité et des performances en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Dernière heure</option>
            <option value="24h">Dernières 24h</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
          </select>
          
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métriques principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sécurité</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {securityStats ? `${securityStats.successRate}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Taux de succès
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {securityStats ? securityStats.criticalAlerts + securityStats.highRiskAlerts : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Alertes critiques/élevées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {performanceStats ? formatDuration(performanceStats.avgDuration) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Temps moyen de réponse
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requêtes</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {performanceStats ? performanceStats.total : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total {timeframe}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alertes récentes */}
          {securityLogs.filter(log => log.riskLevel === 'CRITICAL' || log.riskLevel === 'HIGH').length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Alertes de sécurité détectées</AlertTitle>
              <AlertDescription>
                {securityLogs.filter(log => log.riskLevel === 'CRITICAL' || log.riskLevel === 'HIGH').length} alertes de sécurité nécessitent votre attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Graphiques de tendance */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendances de sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskLevelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {riskLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance temps réel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatDuration(Number(value)), 'Durée']} />
                    <Line 
                      type="monotone" 
                      dataKey="duration" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Statistiques de sécurité */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Accès réussis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {securityStats ? securityStats.totalLogs - securityStats.failedAttempts : 0}
                </div>
                <Progress 
                  value={securityStats ? parseFloat(securityStats.successRate) : 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Tentatives échouées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {securityStats ? securityStats.failedAttempts : 0}
                </div>
                <Progress 
                  value={securityStats ? (securityStats.failedAttempts / securityStats.totalLogs) * 100 : 0}
                  className="mt-2 [&>div]:bg-red-600"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Alertes actives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {securityStats ? securityStats.criticalAlerts + securityStats.highRiskAlerts : 0}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="destructive">
                    {securityStats ? securityStats.criticalAlerts : 0} Critiques
                  </Badge>
                  <Badge variant="secondary">
                    {securityStats ? securityStats.highRiskAlerts : 0} Élevées
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des logs de sécurité */}
          <Card>
            <CardHeader>
              <CardTitle>Logs de sécurité récents</CardTitle>
              <CardDescription>
                Les {securityLogs.length} événements de sécurité les plus récents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={log.success ? "default" : "destructive"}
                        style={{ backgroundColor: getRiskLevelColor(log.riskLevel) }}
                      >
                        {log.riskLevel}
                      </Badge>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.user?.email || 'Utilisateur inconnu'} - {log.ipAddress}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.resource}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Métriques de performance */}
          {performanceStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Moyenne
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(performanceStats.avgDuration)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    P95
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(performanceStats.p95)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Min/Max
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {formatDuration(performanceStats.minDuration)} / {formatDuration(performanceStats.maxDuration)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Requêtes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceStats.total}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Liste des métriques de performance */}
          <Card>
            <CardHeader>
              <CardTitle>Métriques de performance détaillées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.slice(0, 20).map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {metric.method}
                      </Badge>
                      <div>
                        <p className="font-medium">{metric.endpoint}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Durée: {formatDuration(metric.duration)}</span>
                          {metric.memoryUsage && (
                            <span>Mémoire: {metric.memoryUsage.toFixed(2)}MB</span>
                          )}
                          {metric.dbQueries && (
                            <span>Requêtes DB: {metric.dbQueries}</span>
                          )}
                          {metric.cacheHits !== undefined && (
                            <span>Cache: {metric.cacheHits}H/{metric.cacheMisses}M</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(metric.statusCode)}`}>
                        {metric.statusCode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}