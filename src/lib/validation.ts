import { z } from 'zod'

// Common validations
export const emailSchema = z.string().email('Please enter a valid email address')
export const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be less than 15 digits')
export const centavosSchema = z.number().int().min(0, 'Amount must be a positive number')
export const weightSchema = z.number().min(0.1, 'Weight must be at least 0.1 kg').max(1000, 'Weight cannot exceed 1000 kg')

// Supplier validation schema
export const supplierSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters'),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must be less than 50 characters'),
  zipCode: z.string()
    .regex(/^\d{4}$/, 'Please enter a valid ZIP code (4 digits)'), // Philippine ZIP codes
  taxId: z.string()
    .min(9, 'Tax ID must be at least 9 characters')
    .max(20, 'Tax ID must be less than 20 characters')
    .regex(/^[0-9\-]+$/, 'Tax ID can only contain numbers and hyphens'),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

// Buyer validation schema
export const buyerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters'),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must be less than 50 characters'),
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code (12345 or 12345-6789)'),
  creditLimit: centavosSchema
    .min(10000, 'Credit limit must be at least ₱100.00') // ₱100 in centavos
    .max(100000000, 'Credit limit cannot exceed ₱1,000,000.00'), // ₱1M in centavos
})

export type BuyerFormData = z.infer<typeof buyerSchema>

// Lot validation schema
export const lotSchema = z.object({
  supplierId: z.string()
    .min(1, 'Please select a supplier'),
  fishType: z.string()
    .min(2, 'Fish type must be at least 2 characters')
    .max(50, 'Fish type must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-]+$/, 'Fish type can only contain letters, spaces, and hyphens'),
  weightKg: weightSchema,
  pricePerKgCents: centavosSchema
    .min(100, 'Price per kg must be at least ₱1.00') // ₱1 in centavos
    .max(10000000, 'Price per kg cannot exceed ₱100,000.00'), // ₱100k in centavos
  catchDate: z.date()
    .max(new Date(), 'Catch date cannot be in the future')
    .min(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'Catch date cannot be more than 30 days ago'),
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters'),
  grade: z.enum(['A', 'B', 'C'], {
    message: 'Grade must be A, B, or C'
  }),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  minimumBidCents: z.number()
    .int()
    .min(1000, 'Minimum bid must be at least ₱10.00') // ₱10 in centavos
    .optional(),
})

export type LotFormData = z.infer<typeof lotSchema>

// Bid validation schema
export const bidSchema = z.object({
  lotId: z.string()
    .min(1, 'Lot ID is required'),
  buyerId: z.string()
    .min(1, 'Please select a buyer'),
  bidAmountCents: centavosSchema
    .min(1000, 'Bid amount must be at least ₱10.00'), // ₱10 in centavos
  notes: z.string()
    .max(200, 'Notes must be less than 200 characters')
    .optional(),
})

export type BidFormData = z.infer<typeof bidSchema>

// Auction validation schema
export const auctionSchema = z.object({
  lotId: z.string()
    .min(1, 'Lot ID is required'),
  startTime: z.date()
    .min(new Date(), 'Auction start time must be in the future'),
  endTime: z.date(),
  minimumBidCents: centavosSchema
    .min(1000, 'Minimum bid must be at least ₱10.00'), // ₱10 in centavos
  bidIncrementCents: centavosSchema
    .min(100, 'Bid increment must be at least ₱1.00') // ₱1 in centavos
    .max(10000, 'Bid increment cannot exceed ₱100.00'), // ₱100 in centavos
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime']
})

export type AuctionFormData = z.infer<typeof auctionSchema>

// Settlement validation schema
export const settlementSchema = z.object({
  transactionId: z.string()
    .min(1, 'Transaction ID is required'),
  supplierId: z.string()
    .min(1, 'Supplier ID is required'),
  grossAmount: centavosSchema,
  commissionCents: centavosSchema,
  laborFeeCents: centavosSchema,
  netToSupplierCents: centavosSchema,
  status: z.enum(['pending', 'processing', 'completed', 'failed'], {
    message: 'Status must be pending, processing, completed, or failed'
  }),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
}).refine(data => {
  const expectedNet = data.grossAmount - data.commissionCents - data.laborFeeCents
  return data.netToSupplierCents === expectedNet
}, {
  message: 'Net amount calculation is incorrect',
  path: ['netToSupplierCents']
})

export type SettlementFormData = z.infer<typeof settlementSchema>

// Helper functions for validation
export const validateSupplier = (data: unknown) => supplierSchema.safeParse(data)
export const validateBuyer = (data: unknown) => buyerSchema.safeParse(data)
export const validateLot = (data: unknown) => lotSchema.safeParse(data)
export const validateBid = (data: unknown) => bidSchema.safeParse(data)
export const validateAuction = (data: unknown) => auctionSchema.safeParse(data)
export const validateSettlement = (data: unknown) => settlementSchema.safeParse(data)

// Form field validation helpers
export const getFieldError = (errors: z.ZodError, fieldName: string): string | undefined => {
  return errors.issues.find(error => error.path.includes(fieldName))?.message
}

export const formatValidationErrors = (errors: z.ZodError): Record<string, string> => {
  const formatted: Record<string, string> = {}
  errors.issues.forEach(error => {
    if (error.path.length > 0) {
      formatted[error.path[0] as string] = error.message
    }
  })
  return formatted
}
