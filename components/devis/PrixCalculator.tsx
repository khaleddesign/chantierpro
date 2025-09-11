'use client';

import { useState, useEffect } from 'react';

export default function PrixCalculator() {
  const [calcul, setCalcul] = useState({
    prixBase: 0,
    quantite: 1,
    coefficientRegion: 1,
    coefficientComplexite: 1,
    margeEntreprise: 20,
    remiseCommerciale: 0
  });

  const [resultats, setResultats] = useState({
    prixUnitaire: 0,
    montantHT: 0,
    marge: 0,
    remise: 0,
    prixFinal: 0
  });

  const [regions, setRegions] = useState([
    { nom: 'Île-de-France', coefficient: 1.15 },
    { nom: 'PACA', coefficient: 1.10 },
    { nom: 'Auvergne-Rhône-Alpes', coefficient: 1.05 },
    { nom: 'Hauts-de-France', coefficient: 0.95 },
    { nom: 'Nouvelle-Aquitaine', coefficient: 1.00 },
    { nom: 'Occitanie', coefficient: 1.00 },
    { nom: 'Grand Est', coefficient: 0.98 },
    { nom: 'Pays de la Loire', coefficient: 1.02 },
    { nom: 'Bretagne', coefficient: 1.03 },
    { nom: 'Normandie', coefficient: 1.00 },
    { nom: 'Bourgogne-Franche-Comté', coefficient: 0.97 },
    { nom: 'Centre-Val de Loire', coefficient: 0.98 },
    { nom: 'Corse', coefficient: 1.20 }
  ]);

  useEffect(() => {
    calculerPrix();
  },[calcul]);

 const calculerPrix = () => {
   // Prix de base ajusté par région et complexité
   const prixUnitaire = calcul.prixBase * calcul.coefficientRegion * calcul.coefficientComplexite;
   
   // Montant HT avant marge
   const montantHT = prixUnitaire * calcul.quantite;
   
   // Application de la marge entreprise
   const marge = montantHT * (calcul.margeEntreprise / 100);
   const montantAvecMarge = montantHT + marge;
   
   // Application de la remise commerciale
   const remise = montantAvecMarge * (calcul.remiseCommerciale / 100);
   const prixFinal = montantAvecMarge - remise;

   setResultats({
     prixUnitaire,
     montantHT,
     marge,
     remise,
     prixFinal
   });
 };

 const formatCurrency = (amount: number) => {
   return new Intl.NumberFormat('fr-FR', {
     style: 'currency',
     currency: 'EUR'
   }).format(amount);
 };

 const handleRegionChange = (regionNom: string) => {
   const region = regions.find(r => r.nom === regionNom);
   if (region) {
     setCalcul({ ...calcul, coefficientRegion: region.coefficient });
   }
 };

 return (
   <div className="card" style={{ padding: '1.5rem' }}>
     <h3 style={{
       margin: '0 0 1.5rem 0',
       color: '#1e293b',
       display: 'flex',
       alignItems: 'center',
       gap: '0.5rem'
     }}>
       🧮 Calculateur de Prix BTP
     </h3>

     <div style={{
       display: 'grid',
       gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
       gap: '2rem'
     }}>
       {/* Paramètres de calcul */}
       <div>
         <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
           Paramètres de Base
         </h4>
         
         <div style={{ display: 'grid', gap: '1rem' }}>
           <div>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Prix de base (€ HT)
             </label>
             <input
               type="number"
               step="0.01"
               min="0"
               value={calcul.prixBase}
               onChange={(e) => setCalcul({
                 ...calcul,
                 prixBase: parseFloat(e.target.value) || 0
               })}
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
               Quantité
             </label>
             <input
               type="number"
               step="0.01"
               min="0"
               value={calcul.quantite}
               onChange={(e) => setCalcul({
                 ...calcul,
                 quantite: parseFloat(e.target.value) || 1
               })}
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
               Région
             </label>
             <select
               onChange={(e) => handleRegionChange(e.target.value)}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             >
               <option value="">Sélectionner une région...</option>
               {regions.map((region) => (
                 <option key={region.nom} value={region.nom}>
                   {region.nom} (×{region.coefficient})
                 </option>
               ))}
             </select>
             <div style={{
               fontSize: '0.75rem',
               color: '#64748b',
               marginTop: '0.25rem'
             }}>
               Coefficient actuel: ×{calcul.coefficientRegion}
             </div>
           </div>

           <div>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Complexité du chantier
             </label>
             <select
               value={calcul.coefficientComplexite}
               onChange={(e) => setCalcul({
                 ...calcul,
                 coefficientComplexite: parseFloat(e.target.value)
               })}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             >
               <option value={0.9}>Simple (-10%)</option>
               <option value={1}>Standard</option>
               <option value={1.1}>Complexe (+10%)</option>
               <option value={1.2}>Très complexe (+20%)</option>
               <option value={1.3}>Exceptionnel (+30%)</option>
             </select>
           </div>
         </div>
       </div>

       {/* Paramètres commerciaux */}
       <div>
         <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
           Paramètres Commerciaux
         </h4>
         
         <div style={{ display: 'grid', gap: '1rem' }}>
           <div>
             <label style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               <span>Marge entreprise</span>
               <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                 {calcul.margeEntreprise}%
               </span>
             </label>
             <input
               type="range"
               min="0"
               max="50"
               step="1"
               value={calcul.margeEntreprise}
               onChange={(e) => setCalcul({
                 ...calcul,
                 margeEntreprise: parseInt(e.target.value)
               })}
               style={{ width: '100%' }}
             />
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               fontSize: '0.75rem',
               color: '#9ca3af',
               marginTop: '0.25rem'
             }}>
               <span>0%</span>
               <span>25%</span>
               <span>50%</span>
             </div>
           </div>

           <div>
             <label style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               <span>Remise commerciale</span>
               <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                 {calcul.remiseCommerciale}%
               </span>
             </label>
             <input
               type="range"
               min="0"
               max="30"
               step="1"
               value={calcul.remiseCommerciale}
               onChange={(e) => setCalcul({
                 ...calcul,
                 remiseCommerciale: parseInt(e.target.value)
               })}
               style={{ width: '100%' }}
             />
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               fontSize: '0.75rem',
               color: '#9ca3af',
               marginTop: '0.25rem'
             }}>
               <span>0%</span>
               <span>15%</span>
               <span>30%</span>
             </div>
           </div>

           {/* Résultats en temps réel */}
           <div style={{
             background: '#f0f9ff',
             border: '1px solid #0ea5e9',
             borderRadius: '0.75rem',
             padding: '1rem',
             marginTop: '1rem'
           }}>
             <h5 style={{ margin: '0 0 0.75rem 0', color: '#0369a1' }}>
               💰 Résultats du Calcul
             </h5>
             
             <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
               <div style={{
                 display: 'flex',
                 justifyContent: 'space-between',
                 color: '#0369a1'
               }}>
                 <span>Prix unitaire ajusté:</span>
                 <span style={{ fontWeight: '600' }}>
                   {formatCurrency(resultats.prixUnitaire)}
                 </span>
               </div>
               
               <div style={{
                 display: 'flex',
                 justifyContent: 'space-between',
                 color: '#0369a1'
               }}>
                 <span>Montant HT (×{calcul.quantite}):</span>
                 <span style={{ fontWeight: '600' }}>
                   {formatCurrency(resultats.montantHT)}
                 </span>
               </div>
               
               <div style={{
                 display: 'flex',
                 justifyContent: 'space-between',
                 color: '#059669'
               }}>
                 <span>+ Marge ({calcul.margeEntreprise}%):</span>
                 <span style={{ fontWeight: '600' }}>
                   {formatCurrency(resultats.marge)}
                 </span>
               </div>
               
               {calcul.remiseCommerciale > 0 && (
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   color: '#dc2626'
                 }}>
                   <span>- Remise ({calcul.remiseCommerciale}%):</span>
                   <span style={{ fontWeight: '600' }}>
                     {formatCurrency(resultats.remise)}
                   </span>
                 </div>
               )}
               
               <div style={{
                 borderTop: '1px solid #0ea5e9',
                 paddingTop: '0.5rem',
                 marginTop: '0.5rem'
               }}>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   fontSize: '1rem',
                   fontWeight: 'bold',
                   color: '#0369a1'
                 }}>
                   <span>Prix final HT:</span>
                   <span>{formatCurrency(resultats.prixFinal)}</span>
                 </div>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   fontSize: '0.75rem',
                   color: '#64748b',
                   marginTop: '0.25rem'
                 }}>
                   <span>TVA 20% (indicative):</span>
                   <span>{formatCurrency(resultats.prixFinal * 0.2)}</span>
                 </div>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#374151',
                   marginTop: '0.25rem'
                 }}>
                   <span>Prix TTC estimé:</span>
                   <span>{formatCurrency(resultats.prixFinal * 1.2)}</span>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Guide des coefficients régionaux */}
     <div style={{
       marginTop: '2rem',
       background: '#fef3c7',
       border: '1px solid #f59e0b',
       borderRadius: '0.75rem',
       padding: '1rem'
     }}>
       <h5 style={{ margin: '0 0 0.75rem 0', color: '#92400e' }}>
         📍 Guide des Coefficients Régionaux
       </h5>
       <div style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
         gap: '0.5rem',
         fontSize: '0.75rem',
         color: '#92400e'
       }}>
         {regions.slice(0, 6).map((region) => (
           <div key={region.nom} style={{
             display: 'flex',
             justifyContent: 'space-between'
           }}>
             <span>{region.nom}:</span>
             <span style={{ fontWeight: '600' }}>×{region.coefficient}</span>
           </div>
         ))}
       </div>
       <div style={{
         fontSize: '0.75rem',
         color: '#92400e',
         fontStyle: 'italic',
         marginTop: '0.5rem'
       }}>
         * Coefficients basés sur les indices de coût de la construction par région
       </div>
     </div>
   </div>
 );
}
