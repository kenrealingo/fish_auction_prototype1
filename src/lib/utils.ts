import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format centavos as currency string
 * @param centavos - Amount in centavos (1/100th of a peso)
 * @param currency - Currency code (default: 'PHP')
 * @param locale - Locale for formatting (default: 'en-PH')
 * @returns Formatted currency string
 */
export function formatMoney(
  centavos: number, 
  currency: string = 'PHP', 
  locale: string = 'en-PH'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}

/**
 * Format centavos as currency string with cents
 * @param centavos - Amount in centavos (1/100th of a peso)
 * @param currency - Currency code (default: 'PHP')
 * @param locale - Locale for formatting (default: 'en-PH')
 * @returns Formatted currency string with cents
 */
export function formatMoneyWithCents(
  centavos: number, 
  currency: string = 'PHP', 
  locale: string = 'en-PH'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100)
}
