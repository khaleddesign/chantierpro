"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Users, Database, Shield, Activity, 
  AlertTriangle, CheckCircle, TrendingUp, Server,
  HardDrive, Cpu, Wifi, Lock, Key, UserCheck,
  FileText, Download, Upload, RefreshCw, Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SystemStats {
  totalUsers: number;
  totalChantiers: number;
  totalDevis: number;
  totalDocuments: number;
  systemHealth: 'good' | 'warning' | 'error';
  dbSize: string;
  storageUsed: string;
  memoryUsage: number;
  cpuUsage: number;
  uptime: string;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'chantier' | 'devis' | 'system';
  action: string;
  user?: string;
  timestamp: string;
  details?: string;
}

interface SystemSetting {
  key: string;
  label: string;
  value: string | boolean | number;
  type: 'text' | 'boolean' | 'number' | 'select';
  options?: { value: string; label: string; }[];
  description?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'logs'>('overview');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);

  // Vérifier les permissions d'admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      window.location.href = '/dashboard';
      return;
    }
  }, [user]);

  // Charger les statistiques depuis l'API
  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      
      if (response.ok) {
        const data = await response.json();
        
        // Convertir les données API vers le format attendu
        setSystemStats({
          totalUsers: data.systemStats.totalUsers,
          totalChantiers: data.systemStats.totalChantiers,
          totalDevis: data.systemStats.totalDevis,
          totalDocuments: data.systemStats.totalDocuments,
          systemHealth: data.systemStats.systemHealth,
          dbSize: data.systemStats.dbSize,
          storageUsed: data.systemStats.storageUsed,
          memoryUsage: data.systemStats.memoryUsage,
          cpuUsage: data.systemStats.cpuUsage,
          uptime: data.systemStats.uptime
        });

        setRecentActivity(data.recentActivity || []);
        
        // Paramètres par défaut (peuvent être étendus plus tard)
        setSettings([
          {
            key: 'site_name',
            label: 'Nom du site',
            value: 'ChantierPro',
            type: 'text',
            description: 'Nom affiché dans l\'interface'
          },
          {
            key: 'auto_backup',
            label: 'Sauvegarde automatique',
            value: true,
            type: 'boolean',
            description: 'Activer la sauvegarde automatique quotidienne'
          },
          {
            key: 'max_file_size',
            label: 'Taille max des fichiers (MB)',
            value: 50,
            type: 'number',
            description: 'Taille maximale autorisée pour les uploads'
          }
        ]);
        
      } else {
        console.error('Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  useEffect(() => {
    loadSystemStats();
    setLoading(false);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `Il y a ${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return `Il y a ${Math.floor(diffInHours / 24)}j`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return Users;
      case 'chantier': return Settings;
      case 'devis': return FileText;
      case 'system': return Server;
      default: return Activity;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès interdit</h2>
          <p className="text-gray-500">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 border h-32"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg p-6 border h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
            <p className="text-gray-500">
              Gérez les paramètres système et surveillez l'activité
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Download size={18} />
              Exporter logs
            </Button>
            <Button className="flex items-center gap-2">
              <RefreshCw size={18} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Navigation des onglets */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
                { id: 'users', label: 'Utilisateurs', icon: Users },
                { id: 'settings', label: 'Paramètres', icon: Settings },
                { id: 'logs', label: 'Journaux', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Statistiques système */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats?.totalUsers}</p>
                      </div>
                      <Users size={24} className="text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Chantiers</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats?.totalChantiers}</p>
                      </div>
                      <Settings size={24} className="text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Devis</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats?.totalDevis}</p>
                      </div>
                      <FileText size={24} className="text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Documents</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats?.totalDocuments}</p>
                      </div>
                      <HardDrive size={24} className="text-orange-400" />
                    </div>
                  </div>
                </div>

                {/* État du système */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">État du système</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {systemStats && (() => {
                            const HealthIcon = getHealthIcon(systemStats.systemHealth);
                            return (
                              <HealthIcon 
                                size={20} 
                                className={getHealthColor(systemStats.systemHealth)}
                              />
                            );
                          })()}
                          <span className="text-sm font-medium text-gray-700">Santé générale</span>
                        </div>
                        <span className={`text-sm font-medium ${systemStats && getHealthColor(systemStats.systemHealth)}`}>
                          {systemStats?.systemHealth === 'good' ? 'Excellent' : 
                           systemStats?.systemHealth === 'warning' ? 'Attention' : 'Erreur'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Cpu size={20} className="text-blue-400" />
                          <span className="text-sm font-medium text-gray-700">CPU</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{systemStats?.cpuUsage}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Server size={20} className="text-green-400" />
                          <span className="text-sm font-medium text-gray-700">Mémoire</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{systemStats?.memoryUsage}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <HardDrive size={20} className="text-purple-400" />
                          <span className="text-sm font-medium text-gray-700">Stockage</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{systemStats?.storageUsed}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database size={20} className="text-orange-400" />
                          <span className="text-sm font-medium text-gray-700">Base de données</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{systemStats?.dbSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activité récente */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity) => {
                        const ActivityIcon = getActivityIcon(activity.type);
                        return (
                          <div key={activity.id} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <ActivityIcon size={16} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.action}
                                {activity.user && (
                                  <span className="text-gray-600"> par {activity.user}</span>
                                )}
                              </p>
                              {activity.details && (
                                <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTime(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Gestion des utilisateurs</h3>
                  <Button className="flex items-center gap-2">
                    <UserCheck size={18} />
                    Inviter un utilisateur
                  </Button>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Gestion des utilisateurs</h4>
                  <p className="text-gray-500 mb-4">
                    Les fonctionnalités de gestion des utilisateurs sont disponibles dans la section Équipes.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard/users'}>
                    Aller à la gestion des équipes
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Paramètres système</h3>
                
                <div className="space-y-4">
                  {settings.map((setting) => (
                    <div key={setting.key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {setting.label}
                          </label>
                          {setting.description && (
                            <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          {setting.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={setting.value as boolean}
                              onChange={() => {
                                // Handle setting change
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          ) : setting.type === 'select' ? (
                            <select
                              value={setting.value as string}
                              onChange={() => {
                                // Handle setting change
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                              {setting.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              type={setting.type}
                              value={setting.value as string | number}
                              onChange={() => {
                                // Handle setting change
                              }}
                              className="w-48"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <Button>Sauvegarder les paramètres</Button>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Journaux d'activité</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download size={16} className="mr-2" />
                      Exporter
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw size={16} className="mr-2" />
                      Actualiser
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {recentActivity.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <ActivityIcon size={18} className="text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {activity.action}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatTime(activity.timestamp)}
                                </span>
                              </div>
                              {activity.user && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Utilisateur: {activity.user}
                                </p>
                              )}
                              {activity.details && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {activity.details}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}