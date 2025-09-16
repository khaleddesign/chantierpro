'use client';

import { useState, useEffect } from 'react';
import { CacheManagerService } from '@/lib/cache';
import { Activity, Database, Trash2, RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface CacheHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: string;
}

export default function CacheMonitor() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState<CacheHealth>({ status: 'healthy', details: '' });
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  const checkHealth = async () => {
    const healthStatus = await CacheManagerService.healthCheck();
    setHealth(healthStatus);
  };

  const clearCache = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider tout le cache ? Cette action est irréversible.')) {
      return;
    }

    setIsClearing(true);
    try {
      await CacheManagerService.clearAllCaches();
      setLastCleared(new Date());
      // Rafraîchir les stats après nettoyage
      setStats(null);
      await checkHealth();
      alert('Cache vidé avec succès');
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
      alert('Erreur lors du vidage du cache');
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Vérifier toutes les 30s
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getHealthColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const hitRate = stats.hits + stats.misses > 0 
    ? (stats.hits / (stats.hits + stats.misses)) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Surveillance du Cache Redis
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={checkHealth}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </button>
            
            <button
              onClick={clearCache}
              disabled={isClearing}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isClearing ? 'Vidage...' : 'Vider le cache'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* État de santé */}
        <div className={`p-4 rounded-lg border mb-6 ${getHealthColor()}`}>
          <div className="flex items-center space-x-2">
            {getHealthIcon()}
            <span className="font-medium">
              État: {health.status === 'healthy' ? 'Sain' : 
                    health.status === 'degraded' ? 'Dégradé' : 'Non fonctionnel'}
            </span>
          </div>
          <p className="text-sm mt-1">{health.details}</p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Taux de succès</p>
                <p className="text-2xl font-bold text-blue-900">
                  {hitRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Cache Hits</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.hits.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Cache Misses</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.misses.toLocaleString()}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Clés totales</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.totalKeys.toLocaleString()}
                </p>
              </div>
              <Database className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Détails supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Utilisation mémoire</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.memory}</p>
              <p className="text-sm text-gray-600">Mémoire utilisée par Redis</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Informations</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total requêtes:</span>
                <span className="text-sm font-medium">
                  {(stats.hits + stats.misses).toLocaleString()}
                </span>
              </div>
              
              {lastCleared && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Dernier vidage:</span>
                  <span className="text-sm font-medium">
                    {lastCleared.toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Statut:</span>
                <span className={`text-sm font-medium ${
                  health.status === 'healthy' ? 'text-green-600' :
                  health.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {health.status === 'healthy' ? 'Opérationnel' :
                   health.status === 'degraded' ? 'Dégradé' : 'Hors service'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de progression du taux de succès */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Efficacité du cache</span>
            <span className="text-sm text-gray-600">{hitRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                hitRate >= 80 ? 'bg-green-500' :
                hitRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(hitRate, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}