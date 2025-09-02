import { describe, it, expect } from 'vitest'
import {
  pesosTocentavos,
  centavosToPesos,
  calculateCommission,
  calculateLaborFee,
  calculateNetAmount,
  calculateLotValue,
  calculateSettlement,
  formatMoney,
  parseMoneyString,
  isValidMoneyAmount,
  addMoney,
  subtractMoney
} from '@/lib/money-utils'

describe('Money Utilities', () => {
  describe('pesosTocentavos', () => {
    it('should convert pesos to centavos correctly', () => {
      expect(pesosTocentavos(1)).toBe(100)
      expect(pesosTocentavos(10.50)).toBe(1050)
      expect(pesosTocentavos(0)).toBe(0)
      expect(pesosTocentavos(123.45)).toBe(12345)
    })

    it('should handle floating point precision', () => {
      expect(pesosTocentavos(1.005)).toBe(100) // Rounds to nearest cent (banker's rounding)
      expect(pesosTocentavos(1.004)).toBe(100)
      expect(pesosTocentavos(1.006)).toBe(101)
    })
  })

  describe('centavosToPesos', () => {
    it('should convert centavos to pesos correctly', () => {
      expect(centavosToPesos(100)).toBe(1)
      expect(centavosToPesos(1050)).toBe(10.5)
      expect(centavosToPesos(0)).toBe(0)
      expect(centavosToPesos(12345)).toBe(123.45)
    })
  })

  describe('calculateCommission', () => {
    it('should calculate 6% commission correctly', () => {
      expect(calculateCommission(10000)).toBe(600) // $100 -> $6
      expect(calculateCommission(50000)).toBe(3000) // $500 -> $30
      expect(calculateCommission(0)).toBe(0)
    })

    it('should round commission to nearest cent', () => {
      expect(calculateCommission(1000)).toBe(60) // $10 -> $0.60
      expect(calculateCommission(1001)).toBe(60) // $10.01 -> $0.60 (rounds)
    })
  })

  describe('calculateLaborFee', () => {
    it('should return fixed $25 labor fee', () => {
      expect(calculateLaborFee()).toBe(2500) // $25 in centavos
    })
  })

  describe('calculateNetAmount', () => {
    it('should calculate net amount correctly', () => {
      const gross = 10000 // $100
      const commission = calculateCommission(gross) // $6 (600 centavos)
      const labor = calculateLaborFee() // $25 (2500 centavos)
      const net = calculateNetAmount(gross, commission, labor)
      
      expect(net).toBe(6900) // $100 - $6 - $25 = $69
    })

    it('should handle zero amounts', () => {
      expect(calculateNetAmount(0, 0, 0)).toBe(0)
    })
  })

  describe('calculateLotValue', () => {
    it('should calculate lot value correctly', () => {
      expect(calculateLotValue(10, 500)).toBe(5000) // 10kg * $5/kg = $50
      expect(calculateLotValue(2.5, 1200)).toBe(3000) // 2.5kg * $12/kg = $30
    })

    it('should round to nearest cent', () => {
      expect(calculateLotValue(3.333, 300)).toBe(1000) // 3.333kg * $3/kg = $10 (rounded)
    })
  })

  describe('calculateSettlement', () => {
    it('should calculate complete settlement breakdown', () => {
      const grossAmount = 50000 // $500
      const settlement = calculateSettlement(grossAmount)

      expect(settlement.grossAmount).toBe(50000)
      expect(settlement.commissionCents).toBe(3000) // 6% = $30
      expect(settlement.laborFeeCents).toBe(2500) // $25
      expect(settlement.netToSupplierCents).toBe(44500) // $500 - $30 - $25 = $445
      expect(settlement.commissionRate).toBe(0.06)
      expect(settlement.laborFeeFixed).toBe(25.00)
    })
  })

  describe('formatMoney', () => {
    it('should format centavos as currency', () => {
      expect(formatMoney(10000)).toBe('₱100.00')
      expect(formatMoney(1050)).toBe('₱10.50')
      expect(formatMoney(0)).toBe('₱0.00')
      expect(formatMoney(1)).toBe('₱0.01')
    })

    it('should handle large amounts', () => {
      expect(formatMoney(1234567)).toBe('₱12,345.67')
    })
  })

  describe('parseMoneyString', () => {
    it('should parse currency strings correctly', () => {
      expect(parseMoneyString('₱100.00')).toBe(10000)
      expect(parseMoneyString('10.50')).toBe(1050)
      expect(parseMoneyString('₱1,234.56')).toBe(123456)
    })

    it('should handle strings with spaces', () => {
      expect(parseMoneyString(' ₱100.00 ')).toBe(10000)
    })

    it('should throw error for invalid formats', () => {
      expect(() => parseMoneyString('invalid')).toThrow('Invalid money format')
      expect(() => parseMoneyString('$abc.def')).toThrow('Invalid money format')
    })
  })

  describe('isValidMoneyAmount', () => {
    it('should validate money amounts correctly', () => {
      expect(isValidMoneyAmount(10000)).toBe(true)
      expect(isValidMoneyAmount(0)).toBe(true)
      expect(isValidMoneyAmount(-100)).toBe(false) // Negative
      expect(isValidMoneyAmount(10.5)).toBe(false) // Not integer
    })
  })

  describe('addMoney', () => {
    it('should add multiple amounts correctly', () => {
      expect(addMoney(1000, 2000, 3000)).toBe(6000)
      expect(addMoney(500)).toBe(500) // Single amount
      expect(addMoney()).toBe(0) // No amounts
    })
  })

  describe('subtractMoney', () => {
    it('should subtract amounts correctly', () => {
      expect(subtractMoney(10000, 1000, 2000)).toBe(7000) // $100 - $10 - $20 = $70
      expect(subtractMoney(5000, 1000)).toBe(4000) // $50 - $10 = $40
    })

    it('should handle single subtraction', () => {
      expect(subtractMoney(10000, 1000)).toBe(9000)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete auction scenario', () => {
      // Scenario: 10kg fish at $50/kg = $500 gross
      const weightKg = 10
      const pricePerKgCents = 5000 // $50/kg
      
      const lotValue = calculateLotValue(weightKg, pricePerKgCents)
      expect(lotValue).toBe(50000) // $500
      
      const settlement = calculateSettlement(lotValue)
      expect(settlement.grossAmount).toBe(50000) // $500
      expect(settlement.commissionCents).toBe(3000) // $30 (6%)
      expect(settlement.laborFeeCents).toBe(2500) // $25
      expect(settlement.netToSupplierCents).toBe(44500) // $445
      
      // Verify math consistency
      const calculatedNet = subtractMoney(
        settlement.grossAmount,
        settlement.commissionCents,
        settlement.laborFeeCents
      )
      expect(calculatedNet).toBe(settlement.netToSupplierCents)
    })

    it('should maintain precision through conversions', () => {
      const originalPesos = 123.45
      const centavos = pesosTocentavos(originalPesos)
      const convertedBack = centavosToPesos(centavos)
      expect(convertedBack).toBe(originalPesos)
    })
  })
})
