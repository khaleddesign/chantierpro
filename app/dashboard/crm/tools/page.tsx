'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, Download, Database, FileText, Users, Settings,
  CheckCircle, AlertCircle, Info, MapPin, Globe, Shield,
  Zap, RefreshCw, Trash2, Archive, FileSpreadsheet, 
  FileJson, Copy, Eye
} from 'lucide-react';

interface ImportResult {
  total: number;
  success: number;
  errors: number;
  warnings: number;
  details: Array<{
    line: number;
    message: string;
    type: 'error' | 'warning' | 'success';
  }>;
}

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  includePersonalData: boolean;
  dateRange: string;
  fields: string[];
}

export default function CRMToolsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'backup' | 'settings'>('import');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includePersonalData: true,
    dateRange: '30j',
    fields: ['name', 'email', 'phone', 'company', 'typeClient', 'ville']
  });

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      // Simulation d'import de fichier
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: ImportResult = {
        total: 156,
        success: 142,
        errors: 8,
        warnings: 6,
        details: [
          { line: 15, message: 'Email invalide pour "jean.dupont@invalid"', type: 'error' },
          { line: 23, message: 'Téléphone manquant pour Marie Durand', type: 'warning' },
          { line: 45, message: 'Client déjà existant, mis à jour', type: 'success' },
          { line: 67, message: 'Code postal invalide "7500"', type: 'error' },
          { line: 89, message: 'Type client non reconnu "AUTRE"', type: 'warning' }
        ]
      };
      
      setImportResult(mockResult);
    } catch (error) {
      console.error('Erreur import:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Génération du fichier d'export
      const data = [
        { name: 'Sophie Durand', email: 'sophie.durand@email.com', phone: '+33612345678', company: 'Durand & Associés', typeClient: 'PROFESSIONNEL', ville: 'Paris' },
        { name: 'Pierre Martin', email: 'pierre.martin@gmail.com', phone: '+33687654321', company: '', typeClient: 'PARTICULIER', ville: 'Lyon' },
        { name: 'Marie Leclerc', email: 'marie.leclerc@hotmail.fr', phone: '+33623456789', company: '', typeClient: 'PARTICULIER', ville: 'Marseille' }
      ];
      
      let content = '';
      let filename = '';
      
      switch (exportOptions.format) {
        case 'csv':
          const headers = exportOptions.fields.join(',');
          const rows = data.map(row => 
            exportOptions.fields.map(field => row[field as keyof typeof row] || '').join(',')
          );
          content = headers + '\n' + rows.join('\n');
          filename = `crm_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        case 'json':
          content = JSON.stringify(data, null, 2);
          filename = `crm_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
      }
      
      // Téléchargement du fichier
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Sauvegarde complète créée avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const allFields = [
    { key: 'name', label: 'Nom complet' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'company', label: 'Entreprise' },
    { key: 'typeClient', label: 'Type de client' },
    { key: 'ville', label: 'Ville' },
    { key: 'address', label: 'Adresse complète' },
    { key: 'secteurActivite', label: 'Secteur d\'activité' },
    { key: 'chiffreAffaires', label: 'Chiffre d\'affaires' },
    { key: 'sourceProspection', label: 'Source de prospection' },
    { key: 'dateCreation', label: 'Date de création' },
    { key: 'dernierContact', label: 'Dernier contact' }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Settings size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">🛠️ Outils CRM</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Import, export et gestion des données
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Système sécurisé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Formats multiples</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>Sauvegarde automatique</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-blue-50 shadow-lg">
                <Shield size={20} />
                RGPD Compliant
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'import', label: '📥 Import', icon: Upload },
              { id: 'export', label: '📤 Export', icon: Download },
              { id: 'backup', label: '💾 Sauvegarde', icon: Database },
              { id: 'settings', label: '⚙️ Paramètres', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">📥 Import de données clients</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zone d'upload */}
                <div>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      dragActive
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Glissez votre fichier ici
                    </h4>
                    <p className="text-gray-600 mb-4">
                      ou cliquez pour sélectionner
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="mb-4"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Sélectionner un fichier
                        </>
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.json"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <div className="text-sm text-gray-500">
                      Formats acceptés: CSV, XLSX, JSON (max 10MB)
                    </div>
                  </div>
                  
                  {/* Template d'import */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">📋 Template CSV</h5>
                    <p className="text-sm text-blue-700 mb-3">
                      Téléchargez le template pour formater correctement vos données
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const template = 'name,email,phone,company,typeClient,ville\n"John Doe","john@email.com","+33612345678","Ma Société","PROFESSIONNEL","Paris"';
                        const blob = new Blob([template], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'template_import_clients.csv';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }}
                      className="text-blue-600 border-blue-200"
                    >
                      <Download size={14} className="mr-1" />
                      Télécharger le template
                    </Button>
                  </div>
                </div>

                {/* Résultats d'import */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">📊 Derniers résultats</h4>
                  
                  {importResult ? (
                    <div className="space-y-4">
                      {/* Résumé */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                          <div className="text-sm text-green-700">Succès</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                          <div className="text-sm text-red-700">Erreurs</div>
                        </div>
                      </div>
                      
                      {/* Détails */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {importResult.details.map((detail, index) => {
                          const icons = {
                            error: AlertCircle,
                            warning: Info,
                            success: CheckCircle
                          };
                          const colors = {
                            error: 'text-red-600 bg-red-50',
                            warning: 'text-orange-600 bg-orange-50', 
                            success: 'text-green-600 bg-green-50'
                          };
                          const Icon = icons[detail.type];
                          
                          return (
                            <div key={index} className={`p-3 rounded-lg ${colors[detail.type]}`}>
                              <div className="flex items-start gap-2">
                                <Icon size={16} className="mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    Ligne {detail.line}
                                  </div>
                                  <div className="text-xs opacity-80">
                                    {detail.message}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Aucun import récent</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">📤 Export de données</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Options d'export */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format d'export
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'csv', label: 'CSV', icon: FileText, desc: 'Excel compatible' },
                        { value: 'xlsx', label: 'XLSX', icon: FileSpreadsheet, desc: 'Excel natif' },
                        { value: 'json', label: 'JSON', icon: FileJson, desc: 'Développeurs' }
                      ].map((format) => (
                        <button
                          key={format.value}
                          onClick={() => setExportOptions({...exportOptions, format: format.value as any})}
                          className={`p-3 border rounded-lg text-center transition-all ${
                            exportOptions.format === format.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <format.icon size={24} className="mx-auto mb-1" />
                          <div className="text-sm font-medium">{format.label}</div>
                          <div className="text-xs text-gray-500">{format.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Période
                    </label>
                    <select
                      value={exportOptions.dateRange}
                      onChange={(e) => setExportOptions({...exportOptions, dateRange: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="7j">7 derniers jours</option>
                      <option value="30j">30 derniers jours</option>
                      <option value="3m">3 derniers mois</option>
                      <option value="6m">6 derniers mois</option>
                      <option value="1a">1 an</option>
                      <option value="all">Toutes les données</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Champs à exporter
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExportOptions({...exportOptions, fields: allFields.map(f => f.key)})}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          Tout sélectionner
                        </button>
                        <button
                          onClick={() => setExportOptions({...exportOptions, fields: []})}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Tout déselectionner
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {allFields.map((field) => (
                        <label key={field.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={exportOptions.fields.includes(field.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExportOptions({
                                  ...exportOptions,
                                  fields: [...exportOptions.fields, field.key]
                                });
                              } else {
                                setExportOptions({
                                  ...exportOptions,
                                  fields: exportOptions.fields.filter(f => f !== field.key)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Shield size={16} className="text-yellow-600" />
                    <label className="flex items-center gap-2 text-sm text-yellow-800">
                      <input
                        type="checkbox"
                        checked={exportOptions.includePersonalData}
                        onChange={(e) => setExportOptions({...exportOptions, includePersonalData: e.target.checked})}
                        className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      Inclure les données personnelles (RGPD)
                    </label>
                  </div>
                </div>

                {/* Prévisualisation */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">👁️ Aperçu de l'export</h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Estimation: <strong>247 lignes</strong> • Format: <strong>{exportOptions.format.toUpperCase()}</strong>
                    </div>
                    <div className="text-xs text-gray-500">
                      Taille approximative: ~85 KB
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">
                      Aperçu des colonnes sélectionnées:
                    </div>
                    <div className="p-3 max-h-32 overflow-y-auto">
                      {exportOptions.fields.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {exportOptions.fields.map((field, index) => (
                            <span key={field} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                              {allFields.find(f => f.key === field)?.label}
                              {index < exportOptions.fields.length - 1 && <span className="ml-1">•</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          Aucun champ sélectionné
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleExport}
                    disabled={loading || exportOptions.fields.length === 0}
                    className="w-full mt-4"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Télécharger l'export
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">💾 Sauvegarde et restauration</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nouvelle sauvegarde */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Créer une sauvegarde</h4>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="font-medium text-green-800">Sauvegarde complète</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Inclut tous les clients, interactions, opportunités et paramètres.
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleBackup}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Sauvegarde en cours...
                        </>
                      ) : (
                        <>
                          <Database size={16} className="mr-2" />
                          Créer une sauvegarde
                        </>
                      )}
                    </Button>
                    
                    <div className="text-xs text-gray-500">
                      ⚠️ Les sauvegardes sont chiffrées et stockées de manière sécurisée
                    </div>
                  </div>
                </div>

                {/* Sauvegardes existantes */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Sauvegardes disponibles</h4>
                  
                  <div className="space-y-3">
                    {[
                      { date: '2024-12-18 14:30', size: '2.4 MB', type: 'Manuel', status: 'Complète' },
                      { date: '2024-12-17 02:00', size: '2.3 MB', type: 'Auto', status: 'Complète' },
                      { date: '2024-12-16 02:00', size: '2.2 MB', type: 'Auto', status: 'Complète' },
                      { date: '2024-12-15 02:00', size: '2.1 MB', type: 'Auto', status: 'Complète' }
                    ].map((backup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{backup.date}</div>
                          <div className="text-xs text-gray-500">
                            {backup.size} • {backup.type} • {backup.status}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Download size={14} />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye size={14} />
                          </Button>
                          {index > 2 && (
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">⚙️ Paramètres des outils</h3>
              
              <div className="space-y-8">
                {/* Paramètres d'import */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">📥 Paramètres d'import</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Détecter automatiquement les doublons</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Valider les emails automatiquement</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Créer des alertes pour les erreurs</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Notification par email des imports</span>
                    </label>
                  </div>
                </div>

                {/* Paramètres de sécurité */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">🔒 Sécurité et conformité</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-800">Protection RGPD</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        Les données personnelles sont automatiquement chiffrées et peuvent être anonymisées lors de l'export.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">
                          Politique de confidentialité
                        </Button>
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">
                          Journal d'audit
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700">Log des accès aux données</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700">Authentification à 2 facteurs</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions de maintenance */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">🧹 Maintenance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Zap size={16} className="mr-2" />
                      Nettoyer les doublons
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <RefreshCw size={16} className="mr-2" />
                      Recalculer les statistiques
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Archive size={16} className="mr-2" />
                      Archiver les anciens clients
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}