'use client';

import { useState, useEffect } from 'react';
import PrixCalculator from '@/components/devis/PrixCalculator';

export default function BibliothequeManager() {
  const [prix, setPrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    corpsEtat: 'TOUS',
    region: 'TOUS'
  });
  const [corpsEtats, setCorpsEtats] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPrix, setEditingPrix] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [formData, setFormData] = useState({
    code: '',
    designation: '',
    unite: 'forfait',
    prixHT: 0,
    corpsEtat: '',
    region: 'France'
  });

  useEffect(() => {
    fetchPrix();
  }, [filters, pagination.page]);

  const fetchPrix = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.corpsEtat !== 'TOUS' && { corpsEtat: filters.corpsEtat }),
        ...(filters.region !== 'TOUS' && { region: filters.region })
      });

      const response = await fetch(`/api/bibliotheque-prix?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setPrix(data.prix || []);
        setPagination(data.pagination || pagination);
        setCorpsEtats(data.corpsEtats || []);
      }
    } catch (error) {
      console.error('Erreur chargement prix:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingPrix ? `/api/bibliotheque-prix/${editingPrix.id}` : '/api/bibliotheque-prix';
      const method = editingPrix ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPrix();
        handleCloseForm();
        alert(editingPrix ? 'Prix mis à jour avec succès' : 'Prix créé avec succès');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde prix:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (prixItem: any) => {
    setEditingPrix(prixItem);
    setFormData({
      code: prixItem.code,
      designation: prixItem.designation,
      unite: prixItem.unite,
      prixHT: prixItem.prixHT,
      corpsEtat: prixItem.corpsEtat,
      region: prixItem.region || 'France'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prix ?')) return;

    try {
      const response = await fetch(`/api/bibliotheque-prix/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPrix();
        alert('Prix supprimé avec succès');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression prix:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPrix(null);
    setFormData({
      code: '',
      designation: '',
      unite: 'forfait',
      prixHT: 0,
      corpsEtat: '',
      region: 'France'
    });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/bibliotheque-prix/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          filters
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bibliotheque-prix.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
            📚 Bibliothèque Prix BTP
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            {prix.length} prix • {corpsEtats.length} corps d'état
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowImport(true)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📥 Importer
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📤 CSV
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            ➕ Nouveau Prix
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '1rem',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Recherche
            </label>
            <input
              type="text"
              placeholder="Code ou désignation..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Corps d'État
            </label>
            <select
              value={filters.corpsEtat}
              onChange={(e) => setFilters({ ...filters, corpsEtat: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem'
              }}
            >
              <option value="TOUS">Tous</option>
              {corpsEtats.map((corps) => (
                <option key={corps} value={corps}>{corps}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Région
            </label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem'
              }}
            >
              <option value="TOUS">Toutes</option>
              <option value="Île-de-France">Île-de-France</option>
              <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
              <option value
="Nouvelle-Aquitaine">Nouvelle-Aquitaine</option>
             <option value="Occitanie">Occitanie</option>
             <option value="Hauts-de-France">Hauts-de-France</option>
             <option value="Provence-Alpes-Côte d'Azur">PACA</option>
             <option value="Grand Est">Grand Est</option>
             <option value="Pays de la Loire">Pays de la Loire</option>
             <option value="Bretagne">Bretagne</option>
             <option value="Normandie">Normandie</option>
             <option value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</option>
             <option value="Centre-Val de Loire">Centre-Val de Loire</option>
             <option value="Corse">Corse</option>
             <option value="France">National</option>
           </select>
         </div>
       </div>
     </div>

     {/* Calculateur de prix intégré */}
     <PrixCalculator />

     {/* Table des prix */}
     <div className="card">
       {loading ? (
         <div style={{ padding: '3rem', textAlign: 'center' }}>
           <div style={{ color: '#64748b' }}>Chargement de la bibliothèque...</div>
         </div>
       ) : prix.length === 0 ? (
         <div style={{ padding: '3rem', textAlign: 'center' }}>
           <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
           <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
             Aucun prix trouvé
           </h3>
           <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
             {filters.search || filters.corpsEtat !== 'TOUS' || filters.region !== 'TOUS' ? 
               'Aucun prix ne correspond à vos critères.' :
               'Commencez par ajouter des prix à votre bibliothèque.'
             }
           </p>
           <button
             onClick={() => setShowForm(true)}
             className="btn-primary"
           >
             Ajouter le premier prix
           </button>
         </div>
       ) : (
         <>
           <div style={{ overflow: 'auto' }}>
             <table style={{
               width: '100%',
               borderCollapse: 'collapse'
             }}>
               <thead>
                 <tr style={{ background: '#f8fafc' }}>
                   <th style={{
                     padding: '1rem',
                     textAlign: 'left',
                     borderBottom: '1px solid #e2e8f0',
                     fontWeight: '600',
                     color: '#374151'
                   }}>
                     Code
                   </th>
                   <th style={{
                     padding: '1rem',
                     textAlign: 'left',
                     borderBottom: '1px solid #e2e8f0',
                     fontWeight: '600',
                     color: '#374151'
                   }}>
                     Désignation
                   </th>
                   <th style={{
                     padding: '1rem',
                     textAlign: 'center',
                     borderBottom: '1px solid #e2e8f0',
                     fontWeight: '600',
                     color: '#374151'
                   }}>
                     Unité
                   </th>
                   <th style={{
                     padding: '1rem',
                     textAlign: 'right',
                     borderBottom: '1px solid #e2e8f0',
                     fontWeight: '600',
                     color: '#374151'
                   }}>
                     Prix HT
                   </th>
                   <th style={{
                     padding: '1rem',
                     textAlign: 'center',
                     borderBottom: '1px solid #e2e8f0',
                     fontWeight: '600',
                     color: '#374151'
                   }}>
                     Corps État
                   </th>
                   <th style={{
                     padding: '1rem',
                     textAlign: 'center',
                     borderBottom: '1px solid #e2e8f0',
                     fontWeight: '600',
                     color: '#374151'
                   }}>
                     Région
                   </th>
                   <th style={{
                     padding: '1rem',
                     textAlign: 'center',
                     borderBottom: '1px solid #e2e8f0',
                     fontWeight: '600',
                     color: '#374151'
                   }}>
                     Actions
                   </th>
                 </tr>
               </thead>
               <tbody>
                 {prix.map((prixItem, index) => (
                   <tr key={prixItem.id || index} style={{
                     borderBottom: '1px solid #f1f5f9'
                   }}>
                     <td style={{ 
                       padding: '1rem',
                       fontWeight: '600',
                       color: '#3b82f6'
                     }}>
                       {prixItem.code}
                     </td>
                     <td style={{ padding: '1rem', color: '#374151' }}>
                       {prixItem.designation}
                     </td>
                     <td style={{ 
                       padding: '1rem', 
                       textAlign: 'center',
                       fontSize: '0.875rem',
                       color: '#64748b'
                     }}>
                       {prixItem.unite}
                     </td>
                     <td style={{ 
                       padding: '1rem', 
                       textAlign: 'right',
                       fontWeight: '600',
                       color: '#059669'
                     }}>
                       {formatCurrency(prixItem.prixHT)}
                     </td>
                     <td style={{ 
                       padding: '1rem', 
                       textAlign: 'center'
                     }}>
                       <span style={{
                         background: '#f0f9ff',
                         color: '#0369a1',
                         padding: '0.25rem 0.75rem',
                         borderRadius: '1rem',
                         fontSize: '0.75rem',
                         fontWeight: '500'
                       }}>
                         {prixItem.corpsEtat}
                       </span>
                     </td>
                     <td style={{ 
                       padding: '1rem', 
                       textAlign: 'center',
                       fontSize: '0.875rem',
                       color: '#64748b'
                     }}>
                       {prixItem.region}
                     </td>
                     <td style={{ 
                       padding: '1rem', 
                       textAlign: 'center'
                     }}>
                       <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                         <button
                           onClick={() => handleEdit(prixItem)}
                           style={{
                             padding: '0.25rem 0.5rem',
                             border: '1px solid #d1d5db',
                             borderRadius: '0.25rem',
                             background: 'white',
                             color: '#374151',
                             cursor: 'pointer',
                             fontSize: '0.75rem'
                           }}
                           title="Modifier"
                         >
                           ✏️
                         </button>
                         <button
                           onClick={() => handleDelete(prixItem.id)}
                           style={{
                             padding: '0.25rem 0.5rem',
                             border: '1px solid #fecaca',
                             borderRadius: '0.25rem',
                             background: '#fef2f2',
                             color: '#dc2626',
                             cursor: 'pointer',
                             fontSize: '0.75rem'
                           }}
                           title="Supprimer"
                         >
                           🗑️
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>

           {/* Pagination */}
           {pagination.pages > 1 && (
             <div style={{
               padding: '1rem',
               borderTop: '1px solid #e2e8f0',
               display: 'flex',
               justifyContent: 'center',
               alignItems: 'center',
               gap: '1rem'
             }}>
               <button
                 onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                 disabled={pagination.page <= 1}
                 style={{
                   padding: '0.5rem 1rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem',
                   background: pagination.page <= 1 ? '#f9fafb' : 'white',
                   color: pagination.page <= 1 ? '#9ca3af' : '#374151',
                   cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer'
                 }}
               >
                 ← Précédent
               </button>
               
               <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                 Page {pagination.page} sur {pagination.pages}
               </span>
               
               <button
                 onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                 disabled={pagination.page >= pagination.pages}
                 style={{
                   padding: '0.5rem 1rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem',
                   background: pagination.page >= pagination.pages ? '#f9fafb' : 'white',
                   color: pagination.page >= pagination.pages ? '#9ca3af' : '#374151',
                   cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer'
                 }}
               >
                 Suivant →
               </button>
             </div>
           )}
         </>
       )}
     </div>

     {/* Formulaire d'ajout/modification */}
     {showForm && (
       <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         right: 0,
         bottom: 0,
         background: 'rgba(0,0,0,0.5)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         zIndex: 1000,
         padding: '1rem'
       }}>
         <div style={{
           background: 'white',
           borderRadius: '1rem',
           width: '100%',
           maxWidth: '600px',
           maxHeight: '90vh',
           overflow: 'auto'
         }}>
           <div style={{
             padding: '1.5rem',
             borderBottom: '1px solid #e2e8f0',
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center'
           }}>
             <h3 style={{ margin: 0, color: '#1e293b' }}>
               {editingPrix ? '✏️ Modifier le Prix' : '➕ Nouveau Prix'}
             </h3>
             <button
               onClick={handleCloseForm}
               style={{
                 padding: '0.5rem',
                 border: 'none',
                 background: '#f1f5f9',
                 borderRadius: '0.5rem',
                 cursor: 'pointer',
                 color: '#64748b'
               }}
             >
               ✕
             </button>
           </div>

           <div style={{ padding: '1.5rem' }}>
             <div style={{
               display: 'grid',
               gridTemplateColumns: 'repeat(2, 1fr)',
               gap: '1rem',
               marginBottom: '1rem'
             }}>
               <div>
                 <label style={{
                   display: 'block',
                   marginBottom: '0.5rem',
                   fontWeight: '500',
                   color: '#374151'
                 }}>
                   Code *
                 </label>
                 <input
                   type="text"
                   value={formData.code}
                   onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                   placeholder="Ex: MA.01.001"
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '1px solid #d1d5db',
                     borderRadius: '0.5rem'
                   }}
                 />
               </div>

               <div>
                 <label style={{
                   display: 'block',
                   marginBottom: '0.5rem',
                   fontWeight: '500',
                   color: '#374151'
                 }}>
                   Unité *
                 </label>
                 <select
                   value={formData.unite}
                   onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '1px solid #d1d5db',
                     borderRadius: '0.5rem'
                   }}
                 >
                   <option value="forfait">Forfait</option>
                   <option value="m²">m²</option>
                   <option value="m³">m³</option>
                   <option value="ml">ml (mètre linéaire)</option>
                   <option value="U">Unité</option>
                   <option value="kg">kg</option>
                   <option value="L">Litre</option>
                   <option value="H">Heure</option>
                   <option value="J">Jour</option>
                 </select>
               </div>
             </div>

             <div style={{ marginBottom: '1rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Désignation *
               </label>
               <input
                 type="text"
                 value={formData.designation}
                 onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                 placeholder="Description détaillée du poste"
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem'
                 }}
               />
             </div>

             <div style={{
               display: 'grid',
               gridTemplateColumns: 'repeat(2, 1fr)',
               gap: '1rem',
               marginBottom: '1rem'
             }}>
               <div>
                 <label style={{
                   display: 'block',
                   marginBottom: '0.5rem',
                   fontWeight: '500',
                   color: '#374151'
                 }}>
                   Prix HT (€) *
                 </label>
                 <input
                   type="number"
                   step="0.01"
                   min="0"
                   value={formData.prixHT}
                   onChange={(e) => setFormData({ ...formData, prixHT: parseFloat(e.target.value) || 0 })}
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '1px solid #d1d5db',
                     borderRadius: '0.5rem'
                   }}
                 />
               </div>

               <div>
                 <label style={{
                   display: 'block',
                   marginBottom: '0.5rem',
                   fontWeight: '500',
                   color: '#374151'
                 }}>
                   Corps d'État *
                 </label>
                 <select
                   value={formData.corpsEtat}
                   onChange={(e) => setFormData({ ...formData, corpsEtat: e.target.value })}
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '1px solid #d1d5db',
                     borderRadius: '0.5rem'
                   }}
                 >
                   <option value="">Sélectionner...</option>
                   <option value="Maçonnerie">Maçonnerie</option>
                   <option value="Charpente">Charpente</option>
                   <option value="Couverture">Couverture</option>
                   <option value="Plomberie">Plomberie</option>
                   <option value="Électricité">Électricité</option>
                   <option value="Chauffage">Chauffage</option>
                   <option value="Menuiserie">Menuiserie</option>
                   <option value="Cloisons">Cloisons</option>
                   <option value="Revêtements">Revêtements</option>
                   <option value="Peinture">Peinture</option>
                   <option value="Carrelage">Carrelage</option>
                   <option value="Terrassement">Terrassement</option>
                   <option value="VRD">VRD</option>
                   <option value="Isolation">Isolation</option>
                   <option value="Étanchéité">Étanchéité</option>
                 </select>
               </div>
             </div>

             <div style={{ marginBottom: '2rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Région
               </label>
               <select
                 value={formData.region}
                 onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem'
                 }}
               >
                 <option value="France">National</option>
                 <option value="Île-de-France">Île-de-France</option>
                 <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
                 <option value="Nouvelle-Aquitaine">Nouvelle-Aquitaine</option>
                 <option value="Occitanie">Occitanie</option>
                 <option value="Hauts-de-France">Hauts-de-France</option>
                 <option value="Provence-Alpes-Côte d'Azur">PACA</option>
                 <option value="Grand Est">Grand Est</option>
                 <option value="Pays de la Loire">Pays de la Loire</option>
                 <option value="Bretagne">Bretagne</option>
                 <option value="Normandie">Normandie</option>
                 <option value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</option>
                 <option value="Centre-Val de Loire">Centre-Val de Loire</option>
                 <option value="Corse">Corse</option>
               </select>
             </div>

             <div style={{
               display: 'flex',
               justifyContent: 'flex-end',
               gap: '1rem'
             }}>
               <button
                 onClick={handleCloseForm}
                 style={{
                   padding: '0.75rem 1.5rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem',
                   background: 'white',
                   color: '#374151',
                   cursor: 'pointer'
                 }}
               >
                 Annuler
               </button>
               <button
                 onClick={handleSubmit}
                 disabled={!formData.code || !formData.designation || !formData.corpsEtat || !formData.prixHT}
                 className="btn-primary"
                 style={{
                   opacity: (!formData.code || !formData.designation || !formData.corpsEtat || !formData.prixHT) ? 0.5 : 1,
                   cursor: (!formData.code || !formData.designation || !formData.corpsEtat || !formData.prixHT) ? 'not-allowed' : 'pointer'
                 }}
               >
                 {editingPrix ? '💾 Mettre à jour' : '➕ Créer'}
               </button>
             </div>
           </div>
         </div>
       </div>
     )}

     {/* Modal Import */}
     {showImport && (
       <ImportModal
         onClose={() => setShowImport(false)}
         onSuccess={() => {
           setShowImport(false);
           fetchPrix();
         }}
       />
     )}
   </div>
 );
}

// Composant Modal Import
function ImportModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
 const [file, setFile] = useState<File | null>(null);
 const [format, setFormat] = useState<'csv' | 'json'>('csv');
 const [overwrite, setOverwrite] = useState(false);
 const [importing, setImporting] = useState(false);
 const [result, setResult] = useState<any>(null);

 const handleImport = async () => {
   if (!file) return;

   try {
     setImporting(true);
     const formData = new FormData();
     formData.append('file', file);
     formData.append('format', format);
     formData.append('overwrite', overwrite.toString());

     const response = await fetch('/api/bibliotheque-prix/import', {
       method: 'POST',
       body: formData
     });

     const data = await response.json();

     if (response.ok) {
       setResult(data);
       if (data.imported > 0 || data.updated > 0) {
         setTimeout(() => onSuccess(), 2000);
       }
     } else {
       alert(data.error || 'Erreur lors de l\'import');
     }
   } catch (error) {
     console.error('Erreur import:', error);
     alert('Erreur lors de l\'import');
   } finally {
     setImporting(false);
   }
 };

 return (
   <div style={{
     position: 'fixed',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     background: 'rgba(0,0,0,0.5)',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     zIndex: 1000,
     padding: '1rem'
   }}>
     <div style={{
       background: 'white',
       borderRadius: '1rem',
       width: '100%',
       maxWidth: '600px',
       maxHeight: '90vh',
       overflow: 'auto'
     }}>
       <div style={{
         padding: '1.5rem',
         borderBottom: '1px solid #e2e8f0',
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center'
       }}>
         <h3 style={{ margin: 0, color: '#1e293b' }}>
           📥 Importer des Prix
         </h3>
         <button
           onClick={onClose}
           style={{
             padding: '0.5rem',
             border: 'none',
             background: '#f1f5f9',
             borderRadius: '0.5rem',
             cursor: 'pointer',
             color: '#64748b'
           }}
         >
           ✕
         </button>
       </div>

       <div style={{ padding: '1.5rem' }}>
         {!result ? (
           <>
             <div style={{
               background: '#f0f9ff',
               border: '1px solid #0ea5e9',
               borderRadius: '0.75rem',
               padding: '1rem',
               marginBottom: '1.5rem'
             }}>
               <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>
                 Format CSV attendu
               </h4>
               <div style={{ fontSize: '0.875rem', color: '#0369a1', fontFamily: 'monospace' }}>
                 Code,Designation,Unite,Prix HT,Corps Etat,Region<br/>
                 MA.01.001,"Béton armé pour fondations",m³,180.50,Maçonnerie,Île-de-France
               </div>
             </div>

             <div style={{ marginBottom: '1rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Format de fichier
               </label>
               <select
                 value={format}
                 onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem'
                 }}
               >
                 <option value="csv">CSV</option>
                 <option value="json">JSON</option>
               </select>
             </div>

             <div style={{ marginBottom: '1rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Fichier à importer
               </label>
               <input
                 type="file"
                 accept={format === 'csv' ? '.csv' : '.json'}
                 onChange={(e) => setFile(e.target.files?.[0] || null)}
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem'
                 }}
               />
             </div>

             <div style={{ marginBottom: '2rem' }}>
               <label style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 cursor: 'pointer'
               }}>
                 <input
                   type="checkbox"
                   checked={overwrite}
                   onChange={(e) => setOverwrite(e.target.checked)}
                 />
                 <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                   Écraser les prix existants (même code)
                 </span>
               </label>
             </div>

             <div style={{
               display: 'flex',
               justifyContent: 'flex-end',
               gap: '1rem'
             }}>
               <button
                 onClick={onClose}
                 style={{
                   padding: '0.75rem 1.5rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem',
                   background: 'white',
                   color: '#374151',
                   cursor: 'pointer'
                 }}
               >
                 Annuler
               </button>
               <button
                 onClick={handleImport}
                 disabled={!file || importing}
                 className="btn-primary"
                 style={{
                   opacity: (!file || importing) ? 0.5 : 1,
                   cursor: (!file || importing) ? 'not-allowed' : 'pointer'
                 }}
               >
                 {importing ? '📥 Import...' : '📥 Importer'}
               </button>
             </div>
           </>
         ) : (
           <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
               {result.imported > 0 || result.updated > 0 ? '✅' : '⚠️'}
             </div>
             <h4 style={{ color: '#1e293b', marginBottom: '1rem' }}>
               Import terminé
             </h4>
             <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
               • {result.imported} prix créés<br/>
               • {result.updated} prix mis à jour<br/>
               • {result.skipped} prix ignorés<br/>
               {result.invalidEntries > 0 && `• ${result.invalidEntries} entrées invalides`}
             </div>
             <button
               onClick={onClose}
               className="btn-primary"
             >
               Fermer
             </button>
           </div>
         )}
       </div>
     </div>
   </div>
 );
}
