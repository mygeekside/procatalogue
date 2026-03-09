import Link from "next/link";
import { Package, ShoppingCart, BarChart3, Shield, Truck, Star, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/30 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Complete Procurement & Ordering Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your Business Supplies,
            <br />
            <span className="text-blue-200">Simplified</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Browse our full catalogue, place orders, track deliveries, and manage your inventory — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalogue">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8">
                Browse Catalogue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8">
                Register Your Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From browsing to delivery confirmation, we handle the entire procurement workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: "Full Product Catalogue",
                description: "Browse office supplies, cleaning materials, paper, stationery, and printing services with detailed product information.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: ShoppingCart,
                title: "Easy Ordering",
                description: "Add items to cart, request quotes, or place direct orders. Chat with admin for any adjustments.",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: Truck,
                title: "Delivery Tracking",
                description: "Track your orders from confirmation to delivery. Confirm receipt with one click.",
                color: "bg-orange-100 text-orange-600",
              },
              {
                icon: BarChart3,
                title: "Inventory Management",
                description: "Auto-track your stock levels after each delivery. Set minimum levels and get refill suggestions.",
                color: "bg-purple-100 text-purple-600",
              },
              {
                icon: Shield,
                title: "Secure & Approved Access",
                description: "Register your business and get approved by admin. Prices and ordering only for verified customers.",
                color: "bg-red-100 text-red-600",
              },
              {
                icon: Star,
                title: "Simple Admin Tools",
                description: "Extremely easy admin interface for managing products, orders, and customers without technical knowledge.",
                color: "bg-yellow-100 text-yellow-600",
              },
            ].map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">Get started in minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Browse Catalogue", desc: "Explore all products freely — no account needed" },
              { step: "2", title: "Register Business", desc: "Submit your business details for admin approval" },
              { step: "3", title: "Place Orders", desc: "View prices, add to cart, and submit orders" },
              { step: "4", title: "Track & Manage", desc: "Confirm deliveries and manage your inventory" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Office Supplies", emoji: "✏️", desc: "Pens, folders, staplers" },
              { name: "Cleaning Materials", emoji: "🧹", desc: "Cleaners, mops, supplies" },
              { name: "Paper & Stationery", emoji: "📄", desc: "A4, envelopes, notebooks" },
              { name: "Printing Services", emoji: "🖨️", desc: "Printing, binding, finishing" },
            ].map((cat) => (
              <Link key={cat.name} href={`/catalogue?category=${cat.name.toLowerCase().replace(/ /g, "-")}`}>
                <Card className="hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{cat.emoji}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                    <p className="text-gray-500 text-xs">{cat.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/catalogue">
              <Button size="lg">
                View All Products
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your procurement?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Register your business today and get access to pricing, ordering, and inventory management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold">
                Register Now — It&apos;s Free
              </Button>
            </Link>
            <Link href="/catalogue">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Browse First
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-blue-200 text-sm">
            {["No credit card required", "Admin approval within 24h", "Full access after approval"].map((item) => (
              <div key={item} className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">ProCatalogue</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/catalogue" className="hover:text-white transition-colors">Catalogue</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            </div>
            <p className="text-sm">© 2024 ProCatalogue. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
