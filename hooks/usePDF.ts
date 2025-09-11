"use client";

import { useCallback } from "react";
import jsPDF from 'jspdf';
import { Devis } from "./useDevis";

interface PDFOptions {
  includeSignature?: boolean;
  watermark?: string;
}

export function usePDF() {
  
  const generateDevisPDF = useCallback(async (devis: Devis, options: PDFOptions = {}) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Configuration des polices
      pdf.setFont('helvetica');

      // En-tête de l'entreprise
      pdf.setFontSize(20);
      pdf.setTextColor(67, 56, 202); // Couleur indigo
      pdf.text('ChantierPro', margin, yPosition);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Plateforme de gestion BTP', margin, yPosition + 7);
      pdf.text('contact@chantierpro.fr | 01 23 45 67 89', margin, yPosition + 12);
      
      // Ligne de séparation
      yPosition += 25;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Titre du document
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      const docTitle = (devis.type as string) === 'FACTURE' ? 'FACTURE' : (devis.type as string) === 'AVOIR' ? 'AVOIR' : 'DEVIS';
      pdf.text(`${docTitle} N° ${devis.numero}`, margin, yPosition);
      yPosition += 15;

      // Informations client et document
      pdf.setFontSize(10);
      
      // Colonne gauche - Client
      const leftCol = margin;
      pdf.setFont('helvetica', 'bold');
      pdf.text('ADRESSÉ À :', leftCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 7;
      
      pdf.text(devis.client.name, leftCol, yPosition);
      yPosition += 5;
      
      if (devis.client.company) {
        pdf.text(devis.client.company, leftCol, yPosition);
        yPosition += 5;
      }
      
      if (devis.client.address) {
        pdf.text(devis.client.address, leftCol, yPosition);
        yPosition += 5;
      }
      
      if (devis.client.ville && devis.client.codePostal) {
        pdf.text(`${devis.client.codePostal} ${devis.client.ville}`, leftCol, yPosition);
        yPosition += 5;
      }
      
      if (devis.client.email) {
        pdf.text(devis.client.email, leftCol, yPosition);
        yPosition += 5;
      }

      // Colonne droite - Informations du document
      const rightCol = pageWidth - 80;
      let rightY = yPosition - (devis.client.company ? 35 : 30);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATE :', rightCol, rightY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(devis.dateCreation).toLocaleDateString('fr-FR'), rightCol + 25, rightY);
      rightY += 7;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('ÉCHÉANCE :', rightCol, rightY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(devis.dateEcheance).toLocaleDateString('fr-FR'), rightCol + 25, rightY);
      rightY += 7;
      
      if (devis.chantier) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('CHANTIER :', rightCol, rightY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(devis.chantier.nom, rightCol + 25, rightY);
        rightY += 7;
      }

      yPosition = Math.max(yPosition, rightY) + 15;

      // Objet du devis
      if (devis.objet) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('OBJET :', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        
        // Gérer le retour à la ligne pour l'objet
        const objetLines = pdf.splitTextToSize(devis.objet, pageWidth - margin - 40);
        pdf.text(objetLines, margin + 25, yPosition);
        yPosition += 7 * objetLines.length + 10;
      }

      // Tableau des lignes
      const tableStartY = yPosition;
      const colWidths = [80, 20, 30, 30]; // Description, Qté, P.U., Total
      const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

      // En-tête du tableau
      pdf.setFillColor(67, 56, 202);
      pdf.rect(margin, yPosition, tableWidth, 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      
      pdf.text('DESCRIPTION', colPositions[0] + 2, yPosition + 5);
      pdf.text('QTÉ', colPositions[1] + 2, yPosition + 5);
      pdf.text('P.U. (€)', colPositions[2] + 2, yPosition + 5);
      pdf.text('TOTAL (€)', colPositions[3] + 2, yPosition + 5);
      
      yPosition += 8;

      // Lignes du devis
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      devis.ligneDevis.forEach((ligne, index) => {
        const bgColor = index % 2 === 0 ? 248 : 255;
        pdf.setFillColor(bgColor, bgColor, bgColor);
        pdf.rect(margin, yPosition, tableWidth, 8, 'F');
        
        // Description (avec retour à la ligne si nécessaire)
        const descLines = pdf.splitTextToSize(ligne.description, colWidths[0] - 4);
        const lineHeight = Math.max(8, descLines.length * 4);
        
        pdf.text(descLines, colPositions[0] + 2, yPosition + 4);
        pdf.text((ligne.quantite ?? 0).toString(), colPositions[1] + 2, yPosition + 4);
        pdf.text((ligne.prixUnit ?? 0).toFixed(2), colPositions[2] + 2, yPosition + 4);
        pdf.text((ligne.total ?? 0).toFixed(2), colPositions[3] + 2, yPosition + 4);
        
        yPosition += lineHeight;
      });

      // Bordures du tableau
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, tableStartY, tableWidth, yPosition - tableStartY);
      
      for (let i = 1; i < colWidths.length; i++) {
        const x = colPositions[i];
        pdf.line(x, tableStartY, x, yPosition);
      }

      yPosition += 10;

      // Totaux
      const totalsStartX = pageWidth - 80;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      pdf.text('Total HT :', totalsStartX, yPosition);
      pdf.text(`${(devis.totalHT ?? 0).toFixed(2)} €`, totalsStartX + 40, yPosition);
      yPosition += 7;
      
      if (!devis.autoliquidation) {
        pdf.text(`TVA (${devis.tva ?? 20}%) :`, totalsStartX, yPosition);
        pdf.text(`${(devis.totalTVA ?? 0).toFixed(2)} €`, totalsStartX + 40, yPosition);
        yPosition += 7;
      } else {
        pdf.text('TVA (autoliq.) :', totalsStartX, yPosition);
        pdf.text('0,00 €', totalsStartX + 40, yPosition);
        yPosition += 7;
      }
      
      pdf.text('Total TTC :', totalsStartX, yPosition);
      pdf.text(`${(devis.totalTTC ?? 0).toFixed(2)} €`, totalsStartX + 40, yPosition);
      yPosition += 7;
      
      if (devis.retenueGarantie && devis.retenueGarantie > 0) {
        pdf.text(`Retenue (${devis.retenueGarantie}%) :`, totalsStartX, yPosition);
        const montantRetenue = ((devis.totalTTC ?? 0) * (devis.retenueGarantie ?? 0)) / 100;
        pdf.text(`-${montantRetenue.toFixed(2)} €`, totalsStartX + 40, yPosition);
        yPosition += 7;
      }
      
      // Net à payer
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setDrawColor(67, 56, 202);
      pdf.rect(totalsStartX - 5, yPosition - 2, 70, 10);
      
      pdf.text('NET À PAYER :', totalsStartX, yPosition + 5);
      pdf.text(`${(devis.montant ?? 0).toFixed(2)} €`, totalsStartX + 40, yPosition + 5);
      yPosition += 20;

      // Modalités de paiement
      if (devis.modalitesPaiement) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('MODALITÉS DE PAIEMENT :', margin, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const modalitesLines = pdf.splitTextToSize(devis.modalitesPaiement, pageWidth - 2 * margin);
        pdf.text(modalitesLines, margin, yPosition);
        yPosition += 5 * modalitesLines.length + 10;
      }

      // Conditions de vente
      if (devis.conditionsVente) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('CONDITIONS DE VENTE :', margin, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const conditionsLines = pdf.splitTextToSize(devis.conditionsVente, pageWidth - 2 * margin);
        pdf.text(conditionsLines, margin, yPosition);
        yPosition += 5 * conditionsLines.length + 10;
      }

      // Notes
      if (devis.notes) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('NOTES :', margin, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const notesLines = pdf.splitTextToSize(devis.notes, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, yPosition);
        yPosition += 5 * notesLines.length + 10;
      }

      // Signature si le devis est accepté
      if (devis.dateSignature && options.includeSignature) {
        yPosition += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('SIGNATURE CLIENT :', margin, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Signé électroniquement le ${new Date(devis.dateSignature).toLocaleDateString('fr-FR')}`, margin, yPosition);
        yPosition += 5;
        
        pdf.text(`Par ${devis.client.name}`, margin, yPosition);
      }

      // Filigrane si spécifié
      if (options.watermark) {
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(50);
        pdf.text(options.watermark, pageWidth / 2, pageHeight / 2, {
          angle: 45,
          align: 'center'
        });
      }

      return pdf;

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new Error('Erreur lors de la génération du PDF');
    }
  }, []);

  const downloadPDF = useCallback(async (devis: Devis, options: PDFOptions = {}) => {
    try {
      const pdf = await generateDevisPDF(devis, options);
      const fileName = `${devis.type.toLowerCase()}_${devis.numero.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      throw error;
    }
  }, [generateDevisPDF]);

  const previewPDF = useCallback(async (devis: Devis, options: PDFOptions = {}) => {
    try {
      const pdf = await generateDevisPDF(devis, options);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      // Nettoyer l'URL après un délai
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      throw error;
    }
  }, [generateDevisPDF]);

  const getPDFBlob = useCallback(async (devis: Devis, options: PDFOptions = {}) => {
    try {
      const pdf = await generateDevisPDF(devis, options);
      return pdf.output('blob');
    } catch (error) {
      throw error;
    }
  }, [generateDevisPDF]);

  return {
    generateDevisPDF,
    downloadPDF,
    previewPDF,
    getPDFBlob,
  };
}