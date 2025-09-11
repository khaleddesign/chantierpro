"use client";

import jsPDF from "jspdf";

export class PDFGenerator {
  static async genererDevisPDF(devis: any): Promise<Blob> {
    const pdf = new jsPDF();
    
    // En-tête
    pdf.setFontSize(20);
    pdf.text("ChantierPro", 20, 20);
    
    pdf.setFontSize(16);
    const typeDoc = devis.type === "DEVIS" ? "DEVIS" : "FACTURE";
    pdf.text(`${typeDoc} N° ${devis.numero}`, 20, 35);
    
    // Informations client
    pdf.setFontSize(12);
    pdf.text("CLIENT:", 20, 55);
    pdf.text(devis.client.name, 20, 65);
    if (devis.client.company) {
      pdf.text(devis.client.company, 20, 75);
    }
    pdf.text(devis.client.email, 20, 85);
    
    // Date
    pdf.text(`Date: ${new Date(devis.dateCreation).toLocaleDateString("fr-FR")}`, 120, 55);
    if (devis.dateValidite) {
      pdf.text(`Valide jusqu'au: ${new Date(devis.dateValidite).toLocaleDateString("fr-FR")}`, 120, 65);
    }
    
    // Objet
    pdf.text("Objet:", 20, 105);
    const objet = devis.objet || "";
    const lignesObjet = pdf.splitTextToSize(objet, 170);
    pdf.text(lignesObjet, 20, 115);
    
    // Tableau des lignes
    let yPosition = 140;
    
    // En-têtes tableau
    pdf.setFontSize(10);
    pdf.text("Désignation", 20, yPosition);
    pdf.text("Qté", 110, yPosition);
    pdf.text("Prix Unit.", 130, yPosition);
    pdf.text("TVA", 155, yPosition);
    pdf.text("Total HT", 175, yPosition);
    
    // Ligne sous les en-têtes
    pdf.line(20, yPosition + 5, 200, yPosition + 5);
    yPosition += 15;
    
    // Lignes du devis
    if (devis.ligneDevis && devis.ligneDevis.length > 0) {
      devis.ligneDevis.forEach((ligne: any) => {
        const designation = pdf.splitTextToSize(ligne.description || ligne.designation, 80);
        pdf.text(designation, 20, yPosition);
        pdf.text(String(ligne.quantite), 110, yPosition);
        pdf.text(`${ligne.prixUnit}€`, 130, yPosition);
        pdf.text("20%", 155, yPosition);
        pdf.text(`${ligne.total}€`, 175, yPosition);
        
        yPosition += Math.max(10, designation.length * 5);
        
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
      });
    }
    
    // Totaux
    yPosition += 20;
    pdf.line(120, yPosition - 10, 200, yPosition - 10);
    
    pdf.setFontSize(12);
    pdf.text("Total HT:", 130, yPosition);
    pdf.text(`${devis.totalHT || 0}€`, 175, yPosition);
    
    yPosition += 10;
    pdf.text("TVA:", 130, yPosition);
    pdf.text(`${devis.totalTVA || 0}€`, 175, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.text("Total TTC:", 130, yPosition);
    pdf.text(`${devis.totalTTC || 0}€`, 175, yPosition);
    
    // Notes
    if (devis.notes) {
      yPosition += 30;
      pdf.setFontSize(12);
      pdf.text("Notes:", 20, yPosition);
      yPosition += 10;
      pdf.setFontSize(10);
      const notesLines = pdf.splitTextToSize(devis.notes, 170);
      pdf.text(notesLines, 20, yPosition);
    }
    
    // Conditions de vente
    if (devis.conditionsVente) {
      yPosition += Math.max(20, devis.notes ? 40 : 20);
      pdf.setFontSize(12);
      pdf.text("Conditions de vente:", 20, yPosition);
      yPosition += 10;
      pdf.setFontSize(10);
      const conditionsLines = pdf.splitTextToSize(devis.conditionsVente, 170);
      pdf.text(conditionsLines, 20, yPosition);
    }
    
    return pdf.output("blob");
  }
  
  static telechargerPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
