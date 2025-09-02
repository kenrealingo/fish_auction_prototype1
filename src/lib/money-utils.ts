/**
 * Money utilities for handling centavos calculations (Philippine Peso)
 * All monetary values are stored in centavos (cents) to avoid floating point issues
 */

/**
 * Convert pesos to centavos
 * @param pesos - Peso amount as number
 * @returns Amount in centavos
 */
export function pesosTocentavos(pesos: number): number {
  return Math.round(pesos * 100)
}

/**
 * Convert centavos to pesos
 * @param centavos - Amount in centavos
 * @returns Peso amount as number
 */
export function centavosToPesos(centavos: number): number {
  return centavos / 100
}

/**
 * Format money as Philippine Peso
 * @param centavos - Amount in centavos
 * @returns Formatted peso string (e.g., "₱123.45")
 */
export const toPeso = (centavos: number) => `₱${(centavos/100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * Calculate commission amount (6% of gross amount)
 * @param grossAmountCents - Gross amount in centavos
 * @returns Commission amount in centavos
 */
export function calculateCommission(grossAmountCents: number): number {
  const commissionCents = Math.round(grossAmountCents * 0.06)
  return commissionCents
}

/**
 * Calculate labor fee (₱25.00 flat fee)
 * @returns Labor fee in centavos
 */
export function calculateLaborFee(): number {
  const laborFeeCents = 2500 // ₱25.00 in centavos
  return laborFeeCents
}

/**
 * Calculate net amount to supplier
 * @param winningBidCents - Winning bid amount in centavos
 * @param commissionCents - Commission amount in centavos
 * @param laborFeeCents - Labor fee in centavos
 * @returns Net amount to supplier in centavos
 */
export function calculateNetAmount(
  winningBidCents: number,
  commissionCents?: number,
  laborFeeCents?: number
): number {
  const commission = commissionCents ?? Math.round(winningBidCents * 0.06)
  const labor = laborFeeCents ?? 2500
  const netToSupplierCents = winningBidCents - commission - labor
  return netToSupplierCents
}

/**
 * Calculate total lot value
 * @param weightKg - Weight in kilograms
 * @param pricePerKgCents - Price per kg in centavos
 * @returns Total value in centavos
 */
export function calculateLotValue(weightKg: number, pricePerKgCents: number): number {
  return Math.round(weightKg * pricePerKgCents)
}

/**
 * Calculate settlement breakdown
 * @param winningBidCents - Winning bid amount in centavos
 * @returns Settlement breakdown object
 */
export function calculateSettlement(winningBidCents: number) {
  const commissionCents = Math.round(winningBidCents * 0.06)
  const laborFeeCents = 2500
  const netToSupplierCents = winningBidCents - commissionCents - laborFeeCents

  return {
    grossAmount: winningBidCents,
    commissionCents,
    laborFeeCents,
    netToSupplierCents,
    commissionRate: 0.06,
    laborFeeFixed: 25.00
  }
}

/**
 * Format money amount for display (alias for toPeso)
 * @param centavos - Amount in centavos
 * @returns Formatted peso string (e.g., "₱123.45")
 */
export function formatMoney(centavos: number): string {
  return toPeso(centavos)
}

/**
 * Parse money string to centavos
 * @param moneyString - Money string (e.g., "₱123.45" or "123.45")
 * @returns Amount in centavos
 */
export function parseMoneyString(moneyString: string): number {
  // Remove currency symbols and spaces
  const cleanString = moneyString.replace(/[₱,\s]/g, '')
  const pesos = parseFloat(cleanString)
  
  if (isNaN(pesos)) {
    throw new Error('Invalid money format')
  }
  
  return pesosTocentavos(pesos)
}

/**
 * Validate money amount is not negative
 * @param centavos - Amount in centavos
 * @returns true if valid, false if negative
 */
export function isValidMoneyAmount(centavos: number): boolean {
  return Number.isInteger(centavos) && centavos >= 0
}

/**
 * Add money amounts safely
 * @param amounts - Array of amounts in centavos
 * @returns Sum in centavos
 */
export function addMoney(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

/**
 * Subtract money amounts safely
 * @param minuend - Amount to subtract from (in centavos)
 * @param subtrahends - Amounts to subtract (in centavos)
 * @returns Difference in centavos
 */
export function subtractMoney(minuend: number, ...subtrahends: number[]): number {
  return subtrahends.reduce((result, amount) => result - amount, minuend)
}
