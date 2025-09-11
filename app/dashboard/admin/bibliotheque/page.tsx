"use client";

import { useState, useEffect } from "react";
import { 
  PlusCircle, Search, Filter, Edit, Trash2, Copy, 
  Import, Download, Tag, DollarSign, Package,
  Wrench, Zap, Droplets, Paintbrush, Hammer,
  Calculator, Save, X, Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PriceItem {
  id: string;
  code: string;
  designation: string;
  unite: string;
  prixUnitaire: number;
  categorie: 'gros_oeuvre' | 'second_oeuvre' | 'finitions' | 'electricite' | 'plomberie' | 'autres';
  tvaApplicable: number;
  description?: string;
  dateCreation: string;
  dateModification: string;
  actif: boolean;
  tags?: string[];
}

const categoryIcons = {
  gros_oeuvre: Package,
  second_oeuvre: Wrench,
  finitions: Paintbrush,
  electricite: Zap,
  plomberie: Droplets,
  autres: Hammer
};

const categoryColors = {
  gros_oeuvre: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  second_oeuvre: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  finitions: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  electricite: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  plomberie: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  autres: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
};

const categoryLabels = {
  gros_oeuvre: 'Gros œuvre',
  second_oeuvre: 'Second œuvre',
  finitions: 'Finitions',
  electricite: 'Électricité',
  plomberie: 'Plomberie',
  autres: 'Autres'
};

export default function BibliothequeAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("tous");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [newItem, setNewItem] = useState<Partial<PriceItem>>({
    code: '',
    designation: '',
    unite: 'u',
    prixUnitaire: 0,
    categorie: 'autres',
    tvaApplicable: 20,
    description: '',
    actif: true,
    tags: []
  });

  // Vérifier les permissions d'admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      window.location.href = '/dashboard';
      return;
    }
  }, [user]);

  // Charger les éléments de la bibliothèque depuis l'API
  const loadPriceItems = async () => {
    try {
      const searchQuery = search ? `&search=${encodeURIComponent(search)}` : '';
      const corpsQuery = categoryFilter !== 'tous' ? `&corpsEtat=${categoryFilter}` : '';
      const response = await fetch(`/api/bibliotheque?page=1&limit=100${searchQuery}${corpsQuery}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Mapper les données API vers le format de l'interface
        const mappedItems = data.elements.map((item: any) => ({
          id: item.id,
          code: item.code,
          designation: item.designation,
          unite: item.unite,
          prixUnitaire: item.prixHT,
          categorie: mapCorpsEtatToCategory(item.corpsEtat),
          tvaApplicable: 20, // Valeur par défaut
          description: `${item.corpsEtat} - ${item.region}`,
          dateCreation: item.createdAt,
          dateModification: item.dateMAJ,
          actif: true,
          tags: []
        }));
        
        setPriceItems(mappedItems);
        
        if (data.stats) {
          console.log('Statistiques bibliothèque:', data.stats);
        }
      } else {
        console.error('Erreur lors du chargement de la bibliothèque');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la bibliothèque:', error);
    }
  };

  // Mapper les corps d'état vers les catégories d'affichage
  const mapCorpsEtatToCategory = (corpsEtat: string) => {
    switch (corpsEtat?.toLowerCase()) {
      case 'gros oeuvre':
      case 'gros_oeuvre':
        return 'gros_oeuvre';
      case 'electricite':
      case 'électricité':
        return 'electricite';
      case 'plomberie':
        return 'plomberie';
      case 'second oeuvre':
      case 'second_oeuvre':
        return 'second_oeuvre';
      case 'finitions':
        return 'finitions';
      default:
        return 'autres';
    }
  };

  useEffect(() => {
    loadPriceItems();
    setLoading(false);
  }, [search, categoryFilter]);

  const filteredItems = priceItems.filter(item => {
    const matchesSearch = !search || 
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.designation.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "tous" || item.categorie === categoryFilter;
    
    return matchesSearch && matchesCategory && item.actif;
  });

  const handleAddItem = async () => {
    if (!newItem.code || !newItem.designation || !newItem.prixUnitaire) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/bibliotheque', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newItem.code,
          designation: newItem.designation,
          unite: newItem.unite,
          prixHT: newItem.prixUnitaire,
          corpsEtat: mapCategoryToCorpsEtat(newItem.categorie || 'autres'),
          region: 'France'
        }),
      });

      if (response.ok) {
        // Recharger la liste
        await loadPriceItems();
        
        // Réinitialiser le formulaire
        setNewItem({
          code: '',
          designation: '',
          unite: 'u',
          prixUnitaire: 0,
          categorie: 'autres',
          tvaApplicable: 20,
          description: '',
          actif: true,
          tags: []
        });
        
        setShowAddForm(false);
        console.log('Élément ajouté avec succès');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de l\'ajout de l\'élément');
    }
  };

  // Mapper les catégories d'affichage vers les corps d'état
  const mapCategoryToCorpsEtat = (category: string): string => {
    switch (category) {
      case 'gros_oeuvre': return 'Gros Oeuvre';
      case 'second_oeuvre': return 'Second Oeuvre';
      case 'finitions': return 'Finitions';
      case 'electricite': return 'Electricité';
      case 'plomberie': return 'Plomberie';
      default: return 'Autres';
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        const response = await fetch(`/api/bibliotheque/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await loadPriceItems();
          console.log('Élément supprimé avec succès');
        } else {
          console.error('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDuplicateItem = (id: string) => {
    const originalItem = priceItems.find(item => item.id === id);
    if (originalItem) {
      const duplicatedItem: PriceItem = {
        ...originalItem,
        id: Date.now().toString(),
        code: `${originalItem.code}-COPY`,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };
      setPriceItems(prev => [...prev, duplicatedItem]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <PlusCircle size={48} className="mx-auto text-red-400 mb-4" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bibliothèque de Prix</h1>
            <p className="text-gray-500">
              Gérez votre base de données des prix et prestations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Import size={18} />
              Importer
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download size={18} />
              Exporter
            </Button>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle size={18} />
              Ajouter un élément
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{priceItems.length}</p>
              </div>
              <Calculator size={24} className="text-gray-400" />
            </div>
          </div>
          
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = priceItems.filter(item => item.categorie === key && item.actif).length;
            const IconComponent = categoryIcons[key as keyof typeof categoryIcons];
            return (
              <div key={key} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <IconComponent size={24} className="text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par code, désignation ou description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="tous">Toutes catégories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions bulk si des éléments sont sélectionnés */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {selectedItems.length} élément(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Download size={16} className="mr-2" />
                  Exporter sélection
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 size={16} className="mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un nouvel élément</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={18} />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                <Input
                  value={newItem.code}
                  onChange={(e) => setNewItem(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: GO-001"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Désignation *</label>
                <Input
                  value={newItem.designation}
                  onChange={(e) => setNewItem(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="Description courte de la prestation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unité</label>
                <select
                  value={newItem.unite}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unite: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="u">Unité (u)</option>
                  <option value="m²">Mètre carré (m²)</option>
                  <option value="m³">Mètre cube (m³)</option>
                  <option value="ml">Mètre linéaire (ml)</option>
                  <option value="kg">Kilogramme (kg)</option>
                  <option value="h">Heure (h)</option>
                  <option value="j">Jour (j)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix unitaire (€) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.prixUnitaire}
                  onChange={(e) => setNewItem(prev => ({ ...prev, prixUnitaire: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TVA (%)</label>
                <select
                  value={newItem.tvaApplicable}
                  onChange={(e) => setNewItem(prev => ({ ...prev, tvaApplicable: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={5.5}>5,5%</option>
                  <option value={10}>10%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={newItem.categorie}
                  onChange={(e) => setNewItem(prev => ({ ...prev, categorie: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée de la prestation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddItem}>
                <Save size={16} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        )}

        {/* Table des éléments */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredItems.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    />
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Code</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Désignation</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Catégorie</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Unité</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Prix HT</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">TVA</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const IconComponent = categoryIcons[item.categorie];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                        />
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-gray-900">{item.code}</span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.designation}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[item.categorie].bg} ${categoryColors[item.categorie].text} ${categoryColors[item.categorie].border} border`}>
                          <IconComponent size={12} className="mr-1" />
                          {categoryLabels[item.categorie]}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">{item.unite}</span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-green-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(item.prixUnitaire)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">{item.tvaApplicable}%</span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" title="Modifier">
                            <Edit size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDuplicateItem(item.id)}
                            title="Dupliquer"
                          >
                            <Copy size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredItems.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun élément trouvé</h3>
            <p className="text-gray-500">
              Aucun élément ne correspond à vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}