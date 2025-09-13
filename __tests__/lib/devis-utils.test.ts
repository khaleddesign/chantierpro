import { calculerTotaux, validerLigne, formaterMontant } from '@/lib/devis-utils'
import { LigneDevis } from '@/types/devis'

describe('lib/devis-utils', () => {
  describe('calculerTotaux', () => {
    it('should calculate totals correctly with default TVA 20%', () => {
      const lignes: LigneDevis[] = [
        {
          id: '1',
          designation: 'Item 1',
          quantite: 2,
          prixUnitaire: 100,
          total: 200,
          tauxTVA: 20
        },
        {
          id: '2',
          designation: 'Item 2',
          quantite: 1,
          prixUnitaire: 300,
          total: 300,
          tauxTVA: 20
        }
      ]

      const result = calculerTotaux(lignes)
      
      expect(result.totalHT).toBe(500)
      expect(result.totalTVA).toBe(100) // 20% of 500
      expect(result.totalTTC).toBe(600)
    })

    it('should handle different TVA rates', () => {
      const lignes: LigneDevis[] = [
        {
          id: '1',
          designation: 'Item 1',
          quantite: 1,
          prixUnitaire: 100,
          total: 100,
          tauxTVA: 10
        },
        {
          id: '2',
          designation: 'Item 2',
          quantite: 1,
          prixUnitaire: 100,
          total: 100,
          tauxTVA: 5.5
        }
      ]

      const result = calculerTotaux(lignes)
      
      expect(result.totalHT).toBe(200)
      expect(result.totalTVA).toBe(15.5) // 10 + 5.5
      expect(result.totalTTC).toBe(215.5)
    })

    it('should handle empty array', () => {
      const result = calculerTotaux([])
      
      expect(result.totalHT).toBe(0)
      expect(result.totalTVA).toBe(0)
      expect(result.totalTTC).toBe(0)
    })

    it('should use default TVA rate when not specified', () => {
      const lignes: LigneDevis[] = [
        {
          id: '1',
          designation: 'Item 1',
          quantite: 1,
          prixUnitaire: 100,
          total: 100
          // tauxTVA not specified, should default to 20%
        }
      ]

      const result = calculerTotaux(lignes)
      
      expect(result.totalHT).toBe(100)
      expect(result.totalTVA).toBe(20)
      expect(result.totalTTC).toBe(120)
    })
  })

  describe('validerLigne', () => {
    it('should return no errors for valid line', () => {
      const ligne: Partial<LigneDevis> = {
        designation: 'Valid item',
        quantite: 2,
        prixUnitaire: 100
      }

      const errors = validerLigne(ligne)
      expect(errors).toHaveLength(0)
    })

    it('should return error for missing designation', () => {
      const ligne: Partial<LigneDevis> = {
        quantite: 2,
        prixUnitaire: 100
      }

      const errors = validerLigne(ligne)
      expect(errors).toContain('La désignation est requise')
    })

    it('should return error for empty designation', () => {
      const ligne: Partial<LigneDevis> = {
        designation: '   ',
        quantite: 2,
        prixUnitaire: 100
      }

      const errors = validerLigne(ligne)
      expect(errors).toContain('La désignation est requise')
    })

    it('should return error for invalid quantity', () => {
      const ligne: Partial<LigneDevis> = {
        designation: 'Valid item',
        quantite: 0,
        prixUnitaire: 100
      }

      const errors = validerLigne(ligne)
      expect(errors).toContain('La quantité doit être positive')
    })

    it('should return error for negative quantity', () => {
      const ligne: Partial<LigneDevis> = {
        designation: 'Valid item',
        quantite: -1,
        prixUnitaire: 100
      }

      const errors = validerLigne(ligne)
      expect(errors).toContain('La quantité doit être positive')
    })

    it('should return error for negative price', () => {
      const ligne: Partial<LigneDevis> = {
        designation: 'Valid item',
        quantite: 2,
        prixUnitaire: -10
      }

      const errors = validerLigne(ligne)
      expect(errors).toContain('Le prix unitaire doit être positif ou nul')
    })

    it('should reject zero price (due to !prixUnitaire check)', () => {
      const ligne: Partial<LigneDevis> = {
        designation: 'Free item',
        quantite: 1,
        prixUnitaire: 0
      }

      const errors = validerLigne(ligne)
      expect(errors).toContain('Le prix unitaire doit être positif ou nul')
    })

    it('should return multiple errors for invalid line', () => {
      const ligne: Partial<LigneDevis> = {
        designation: '',
        quantite: -1,
        prixUnitaire: -100
      }

      const errors = validerLigne(ligne)
      expect(errors).toHaveLength(3)
      expect(errors).toContain('La désignation est requise')
      expect(errors).toContain('La quantité doit être positive')
      expect(errors).toContain('Le prix unitaire doit être positif ou nul')
    })
  })

  describe('formaterMontant', () => {
    it('should format positive amounts correctly', () => {
      const result = formaterMontant(1234.56)
      expect(result).toMatch(/1\s*234,56\s*€/)
    })

    it('should format zero correctly', () => {
      const result = formaterMontant(0)
      expect(result).toMatch(/0,00\s*€/)
    })

    it('should format negative amounts correctly', () => {
      const result = formaterMontant(-500.75)
      expect(result).toMatch(/-500,75\s*€/)
    })

    it('should format large amounts correctly', () => {
      const result = formaterMontant(1000000)
      expect(result).toMatch(/1\s*000\s*000,00\s*€/)
    })

    it('should format small amounts correctly', () => {
      const result = formaterMontant(0.01)
      expect(result).toMatch(/0,01\s*€/)
    })

    it('should handle decimal precision', () => {
      const result = formaterMontant(123.456789)
      expect(result).toMatch(/123,46\s*€/)
    })

    it('should contain currency symbol', () => {
      const result = formaterMontant(100)
      expect(result).toContain('€')
    })

    it('should use French decimal separator', () => {
      const result = formaterMontant(100.50)
      expect(result).toContain(',50')
    })
  })
})