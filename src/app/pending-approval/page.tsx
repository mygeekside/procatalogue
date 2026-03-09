import Link from "next/link";
import { Clock, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Awaiting Approval</h2>
          <p className="text-gray-500 mb-6">
            Your business registration is being reviewed by our admin team. 
            You&apos;ll receive access to pricing and ordering once approved — usually within 24 hours.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <div className="space-y-2">
              {[
                "Admin reviews your business details",
                "You get notified when approved",
                "Full access to prices and ordering",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-blue-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/catalogue">
              <Button className="w-full">
                <Package className="w-4 h-4" />
                Browse Catalogue (Public View)
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Sign In Again
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
