'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Fish,
  Weight,
  DollarSign,
  Calendar,
  MapPin,
  Star,
  Save,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { validateLot, type LotFormData, formatValidationErrors } from '@/lib/validation'
import { pesosTocentavos, centavosToPesos, formatMoney } from '@/lib/money-utils'
import { showFormSuccess, showValidationError, showFormLoading, dismissToast, showNetworkError } from '@/lib/toast'

interface LotFormProps {
  initialData?: Partial<LotFormData>
  userRole: string
  userEmail: string
  isEditing?: boolean
  onSubmit?: (data: LotFormData) => Promise<void>
}

const fishTypes = [
  'Atlantic Salmon',
  'Red Snapper',
  'Yellowfin Tuna',
  'Pacific Halibut',
  'King Crab',
  'Mahi-Mahi',
  'Striped Bass',
  'Pacific Cod',
  'Albacore Tuna',
  'Dungeness Crab'
]

export function ValidatedLotForm({ 
  initialData = {}, 
  userRole, 
  userEmail, 
  isEditing = false,
  onSubmit
}: LotFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form state
  const [formData, setFormData] = useState<Partial<LotFormData>>({
    supplierId: initialData.supplierId || '',
    fishType: initialData.fishType || '',
    weightKg: initialData.weightKg || undefined,
    pricePerKgCents: initialData.pricePerKgCents || undefined,
    catchDate: initialData.catchDate || new Date(),
    location: initialData.location || '',
    grade: initialData.grade || undefined,
    description: initialData.description || '',
    minimumBidCents: initialData.minimumBidCents || undefined,
  })

  // Mock suppliers for demo
  const mockSuppliers = [
    { id: 'sup1', name: 'Atlantic Fisheries' },
    { id: 'sup2', name: 'Gulf Coast Fishing' },
    { id: 'sup3', name: 'Pacific Tuna Co.' },
    { id: 'sup4', name: 'Coastal Fisheries' }
  ]

  const handleInputChange = (field: keyof LotFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePriceChange = (value: string) => {
    const pesoAmount = parseFloat(value)
    if (!isNaN(pesoAmount)) {
      handleInputChange('pricePerKgCents', pesosTocentavos(pesoAmount))
    } else {
      handleInputChange('pricePerKgCents', undefined)
    }
  }

  const handleMinimumBidChange = (value: string) => {
    const pesoAmount = parseFloat(value)
    if (!isNaN(pesoAmount)) {
      handleInputChange('minimumBidCents', pesosTocentavos(pesoAmount))
    } else {
      handleInputChange('minimumBidCents', undefined)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate the form data
    const validation = validateLot(formData)
    
    if (!validation.success) {
      const formattedErrors = formatValidationErrors(validation.error)
      setErrors(formattedErrors)
      showValidationError('Please correct the errors below')
      return
    }

    setIsSubmitting(true)
    const loadingToast = showFormLoading(isEditing ? 'Updating lot' : 'Creating lot')

    try {
      // Call the provided onSubmit function or default behavior
      if (onSubmit) {
        await onSubmit(validation.data)
      } else {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      dismissToast(loadingToast)
      showFormSuccess(isEditing ? 'Lot updated' : 'Lot created')
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          supplierId: '',
          fishType: '',
          weightKg: undefined,
          pricePerKgCents: undefined,
          catchDate: new Date(),
          location: '',
          grade: undefined,
          description: '',
          minimumBidCents: undefined,
        })
      }
      
      // Navigate back or to lot detail
      router.push('/lots')
    } catch (error) {
      dismissToast(loadingToast)
      showNetworkError(isEditing ? 'update lot' : 'create lot')
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lots">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lots
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Lot' : 'Create New Lot'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            Lot Information
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update the lot details below' 
              : 'Enter the fish lot details to create a new auction listing'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Supplier Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier *</Label>
                <Select 
                  value={formData.supplierId || ''} 
                  onValueChange={(value) => handleInputChange('supplierId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierId && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.supplierId}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fishType">Fish Type *</Label>
                <Select 
                  value={formData.fishType || ''} 
                  onValueChange={(value) => handleInputChange('fishType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fish type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fishTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fishType && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.fishType}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Weight and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weightKg" className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Weight (kg) *
                </Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={formData.weightKg || ''}
                  onChange={(e) => handleInputChange('weightKg', parseFloat(e.target.value) || undefined)}
                  placeholder="Enter weight in kg"
                />
                {errors.weightKg && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.weightKg}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerKg" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price per kg (₱) *
                </Label>
                <Input
                  id="pricePerKg"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.pricePerKgCents ? centavosToPesos(formData.pricePerKgCents) : ''}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="Enter price per kg in pesos"
                />
                {formData.pricePerKgCents && (
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(formData.pricePerKgCents)} per kg
                  </p>
                )}
                {errors.pricePerKgCents && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.pricePerKgCents}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Catch Date and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="catchDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Catch Date *
                </Label>
                <Input
                  id="catchDate"
                  type="date"
                  value={formData.catchDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleInputChange('catchDate', new Date(e.target.value))}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.catchDate && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.catchDate}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Catch Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter catch location"
                />
                {errors.location && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.location}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Grade and Minimum Bid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Grade *
                </Label>
                <Select 
                  value={formData.grade || ''} 
                  onValueChange={(value) => handleInputChange('grade', value as 'A' | 'B' | 'C')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A - Premium Quality</SelectItem>
                    <SelectItem value="B">Grade B - Good Quality</SelectItem>
                    <SelectItem value="C">Grade C - Standard Quality</SelectItem>
                  </SelectContent>
                </Select>
                {errors.grade && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.grade}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumBid">Minimum Bid (₱) (Optional)</Label>
                <Input
                  id="minimumBid"
                  type="number"
                  step="0.01"
                  min="10"
                  value={formData.minimumBidCents ? centavosToPesos(formData.minimumBidCents) : ''}
                  onChange={(e) => handleMinimumBidChange(e.target.value)}
                  placeholder="Enter minimum bid amount in pesos"
                />
                {formData.minimumBidCents && (
                  <p className="text-sm text-muted-foreground">
                    Minimum bid: {formatMoney(formData.minimumBidCents)}
                  </p>
                )}
                {errors.minimumBidCents && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.minimumBidCents}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add any additional details about the fish lot..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground text-right">
                {(formData.description || '').length}/500 characters
              </p>
              {errors.description && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.description}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/lots">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-32">
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Lot' : 'Create Lot'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
