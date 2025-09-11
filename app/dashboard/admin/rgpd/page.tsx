'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface DataRightsRequest {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface ComplianceReport {
  totalUsers: number;
  activeConsents: number;
  pendingRequests: number;
  recentBreaches: number;
  generatedAt: string;
}

export default function RGPDAdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingRequests, setPendingRequests] = useState<DataRightsRequest[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les demandes en attente
      const requestsResponse = await fetch('/api/admin/gdpr?action=pending-requests');
      if (requestsResponse.ok) {
        const requests = await requestsResponse.json();
        setPendingRequests(requests.data || []);
      }

      // Charger le rapport de conformité
      const complianceResponse = await fetch('/api/admin/gdpr?action=compliance-report');
      if (complianceResponse.ok) {
        const compliance = await complianceResponse.json();
        setComplianceReport(compliance.data);
      }
    } catch (error) {
      console.error('Erreur chargement données RGPD:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/gdpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `${action}_request`,
          requestId,
          note: `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} par l'administrateur`
        })
      });

      if (response.ok) {
        loadData(); // Recharger les données
        alert(`Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`);
      }
    } catch (error) {
      console.error('Erreur traitement demande:', error);
      alert('Erreur lors du traitement de la demande');
    }
  };

  const handleCleanupExpiredData = async () => {
    if (!confirm('Êtes-vous sûr de vouloir nettoyer les données expirées ?')) return;

    try {
      const response = await fetch('/api/admin/gdpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup_expired_data' })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Nettoyage terminé: ${result.deletedRecords} enregistrements supprimés`);
        loadData();
      }
    } catch (error) {
      console.error('Erreur nettoyage:', error);
      alert('Erreur lors du nettoyage');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'ACCESS': 'Accès aux données',
      'RECTIFICATION': 'Rectification',
      'ERASURE': 'Effacement',
      'RESTRICT': 'Limitation',
      'PORTABILITY': 'Portabilité',
      'OBJECT': 'Opposition'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Administration RGPD
        </h1>
        <p className="text-gray-600">
          Gestion de la conformité RGPD et des droits des utilisateurs
        </p>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Shield },
            { id: 'requests', label: 'Demandes', icon: FileText },
            { id: 'compliance', label: 'Conformité', icon: CheckCircle },
            { id: 'tools', label: 'Outils', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && complianceReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{complianceReport.totalUsers}</p>
                <p className="text-gray-600">Utilisateurs</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{complianceReport.activeConsents}</p>
                <p className="text-gray-600">Consentements actifs</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{complianceReport.pendingRequests}</p>
                <p className="text-gray-600">Demandes en attente</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{complianceReport.recentBreaches}</p>
                <p className="text-gray-600">Violations récentes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demandes de droits */}
      {activeTab === 'requests' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Demandes de droits en attente
            </h3>
            
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucune demande en attente
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type de demande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRequests.map(request => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {getTypeLabel(request.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleProcessRequest(request.id, 'approve')}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approuver</span>
                          </button>
                          <button
                            onClick={() => handleProcessRequest(request.id, 'reject')}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Rejeter</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outils de maintenance */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Outils de maintenance RGPD
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Nettoyage automatique</h4>
                    <p className="text-sm text-gray-600">
                      Supprimer les données expirées selon les politiques de conservation
                    </p>
                  </div>
                  <button
                    onClick={handleCleanupExpiredData}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Nettoyer</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Export des logs d'audit</h4>
                    <p className="text-sm text-gray-600">
                      Télécharger l'historique complet des traitements de données
                    </p>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    <Download className="w-4 h-4" />
                    <span>Exporter</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Rapport de conformité</h4>
                    <p className="text-sm text-gray-600">
                      Générer un rapport détaillé de conformité RGPD
                    </p>
                  </div>
                  <button
                    onClick={loadData}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Générer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conformité */}
      {activeTab === 'compliance' && complianceReport && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Rapport de conformité RGPD
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Consentements actifs: {complianceReport.activeConsents}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">Demandes en attente: {complianceReport.pendingRequests}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-sm">Violations récentes: {complianceReport.recentBreaches}</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Rapport généré le:</strong></p>
                <p>{new Date(complianceReport.generatedAt).toLocaleString('fr-FR')}</p>
                
                <div className="mt-4">
                  <p><strong>Statut de conformité:</strong></p>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    complianceReport.pendingRequests === 0 && complianceReport.recentBreaches === 0
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {complianceReport.pendingRequests === 0 && complianceReport.recentBreaches === 0
                      ? 'Conforme' 
                      : 'Attention requise'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}