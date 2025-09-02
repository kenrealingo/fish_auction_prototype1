import { formatMoney } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UtilitiesTestPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>formatMoney() Utility Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Input (centavos)</strong>
            </div>
            <div>
              <strong>Output (formatted)</strong>
            </div>
            
            <div>12345 centavos</div>
            <div>{formatMoney(12345)}</div>
            
            <div>567890 centavos</div>
            <div>{formatMoney(567890)}</div>
            
            <div>1000000 centavos</div>
            <div>{formatMoney(1000000)}</div>
            
            <div>50 centavos</div>
            <div>{formatMoney(50)}</div>
            
            <div>0 centavos</div>
            <div>{formatMoney(0)}</div>
            
            <div>-12345 centavos</div>
            <div>{formatMoney(-12345)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
