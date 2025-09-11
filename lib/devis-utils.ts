import { LigneDevis } from '@/types/devis';

export function calculerTotaux(lignes: LigneDevis[]) {
  const totalHT = lignes.reduce((sum, ligne) => sum + ligne.total, 0);
  const totalTVA = lignes.reduce((sum, ligne) => {
    const tva = ligne.tauxTVA || 20;
    return sum + (ligne.total * tva / 100);
  }, 0);
  const totalTTC = totalHT + totalTVA;
  
  return { totalHT, totalTVA, totalTTC };
}

export function validerLigne(ligne: Partial<LigneDevis>): string[] {
  const erreurs: string[] = [];
  
  if (!ligne.designation?.trim()) {
    erreurs.push('La désignation est requise');
  }
  
  if (!ligne.quantite || ligne.quantite <= 0) {
    erreurs.push('La quantité doit être positive');
  }
  
  if (!ligne.prixUnitaire || ligne.prixUnitaire < 0) {
    erreurs.push('Le prix unitaire doit être positif ou nul');
  }
  
  return erreurs;
}

export function formaterMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(montant);
}
