import { approveLotSale, rejectLotSale } from '@/lib/auction-actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from 'next/navigation'

export default function TestApprovalPage() {
  
  async function handleApprove() {
    'use server'
    const result = await approveLotSale('lot3')
    console.log('Approve result:', result)
    if (result.success) {
      redirect('/lots/lot3')
    }
  }

  async function handleReject() {
    'use server'
    const result = await rejectLotSale('lot3')
    console.log('Reject result:', result)
    if (result.success) {
      redirect('/lots/lot3')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Approval Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={handleApprove}>
            <Button type="submit" className="w-full bg-green-600">
              Test Approve Lot3
            </Button>
          </form>
          <form action={handleReject}>
            <Button type="submit" variant="destructive" className="w-full">
              Test Reject Lot3
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
