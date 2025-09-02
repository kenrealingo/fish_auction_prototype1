"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Fish,
  Weight,
  DollarSign,
  Calendar,
  MapPin,
  Star,
  Thermometer,
  AlertCircle,
  CheckCircle,
  Save,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface LotData {
  id?: string
  lotNumber?: string
  fishType?: string
  fishSpecies?: string
  weight?: number
  grade?: string
  freshness?: string
  origin?: string
  reservePrice?: number
  description?: string
  caughtAt?: string
}

interface LotFormProps {
  initialData?: LotData
  userRole: string
  userEmail: string
  isEditing?: boolean
}

const fishTypes = [
  { value: "Atlantic Salmon", species: "Salmo salar" },
  { value: "Red Snapper", species: "Lutjanus campechanus" },
  { value: "Yellowfin Tuna", species: "Thunnus albacares" },
  { value: "Sea Bass", species: "Dicentrarchus labrax" },
  { value: "Cod", species: "Gadus morhua" },
  { value: "Halibut", species: "Hippoglossus hippoglossus" },
  { value: "Mackerel", species: "Scomber scombrus" },
  { value: "Mahi-Mahi", species: "Coryphaena hippurus" }
]

const grades = ["A+", "A", "B", "C"]
const freshnessOptions = ["Fresh", "Ice Fresh", "Frozen"]
const origins = [
  "Atlantic Ocean",
  "Pacific Ocean", 
  "Gulf Waters",
  "North Sea",
  "Mediterranean Sea",
  "Gulf of Mexico",
  "Pacific Coast",
  "Atlantic Coast"
]

export function LotForm({ initialData, userRole, userEmail, isEditing = false }: LotFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Suppress unused variable warnings for now
  console.log('User role:', userRole, 'Email:', userEmail)

  // Form state
  const [formData, setFormData] = useState({
    fishType: initialData?.fishType || "",
    fishSpecies: initialData?.fishSpecies || "",
    weight: initialData?.weight?.toString() || "",
    grade: initialData?.grade || "",
    freshness: initialData?.freshness || "",
    origin: initialData?.origin || "",
    reservePrice: initialData?.reservePrice ? (initialData.reservePrice / 100).toString() : "",
    description: initialData?.description || "",
    caughtAt: initialData?.caughtAt ? initialData.caughtAt.slice(0, 16) : ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-populate species when fish type is selected
    if (field === "fishType") {
      const fishInfo = fishTypes.find(f => f.value === value)
      if (fishInfo) {
        setFormData(prev => ({ ...prev, fishSpecies: fishInfo.species }))
      }
    }
  }

  const calculateEstimatedPrice = () => {
    const weight = parseFloat(formData.weight)
    const reservePrice = parseFloat(formData.reservePrice)
    
    if (weight && reservePrice) {
      return (reservePrice / weight).toFixed(2)
    }
    return "0.00"
  }

  const validateForm = () => {
    const required = ["fishType", "weight", "grade", "freshness", "origin", "caughtAt"]
    const missing = required.filter(field => !formData[field as keyof typeof formData])
    
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(", ")}`)
      return false
    }

    const weight = parseFloat(formData.weight)
    if (isNaN(weight) || weight <= 0) {
      setError("Weight must be a positive number")
      return false
    }

    const reservePrice = parseFloat(formData.reservePrice)
    if (formData.reservePrice && (isNaN(reservePrice) || reservePrice < 0)) {
      setError("Reserve price must be a valid number")
      return false
    }

    const caughtDate = new Date(formData.caughtAt)
    const now = new Date()
    if (caughtDate > now) {
      setError("Caught date cannot be in the future")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")
    
    try {
      // Simulate API call - in real app, this would call server actions
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock success
      setSuccess(isEditing ? "Lot updated successfully!" : "Lot created successfully!")
      
      // Redirect after short delay
      setTimeout(() => {
        router.push("/lots")
      }, 2000)
      
    } catch (err) {
      console.error('Form submission error:', err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            Fish Information
          </CardTitle>
          <CardDescription>
            Basic details about the fish lot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fishType">Fish Type *</Label>
              <Select value={formData.fishType} onValueChange={(value: string) => handleInputChange("fishType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fish type" />
                </SelectTrigger>
                <SelectContent>
                  {fishTypes.map((fish) => (
                    <SelectItem key={fish.value} value={fish.value}>
                      {fish.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fishSpecies">Species</Label>
              <Input
                id="fishSpecies"
                value={formData.fishSpecies}
                onChange={(e) => handleInputChange("fishSpecies", e.target.value)}
                placeholder="Scientific name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                Weight (kg) *
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Grade *
              </Label>
              <Select value={formData.grade} onValueChange={(value: string) => handleInputChange("grade", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freshness" className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Freshness *
              </Label>
              <Select value={formData.freshness} onValueChange={(value: string) => handleInputChange("freshness", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select freshness" />
                </SelectTrigger>
                <SelectContent>
                  {freshnessOptions.map((freshness) => (
                    <SelectItem key={freshness} value={freshness}>
                      {freshness}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Origin *
            </Label>
            <Select value={formData.origin} onValueChange={(value: string) => handleInputChange("origin", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                {origins.map((origin) => (
                  <SelectItem key={origin} value={origin}>
                    {origin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
              placeholder="Additional details about the fish lot..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Timing
          </CardTitle>
          <CardDescription>
            Set reserve price and catch information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reservePrice">Reserve Price ($)</Label>
              <Input
                id="reservePrice"
                type="number"
                step="1"
                min="0"
                value={formData.reservePrice}
                onChange={(e) => handleInputChange("reservePrice", e.target.value)}
                placeholder="Minimum acceptable price"
              />
              {formData.weight && formData.reservePrice && (
                <p className="text-sm text-gray-500">
                  ≈ ${calculateEstimatedPrice()}/kg
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="caughtAt" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Caught Date & Time *
              </Label>
              <Input
                id="caughtAt"
                type="datetime-local"
                value={formData.caughtAt}
                onChange={(e) => handleInputChange("caughtAt", e.target.value)}
                max={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between items-center">
        <Link href="/lots">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lots
          </Button>
        </Link>

        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : isEditing ? "Update Lot" : "Create Lot"}
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
