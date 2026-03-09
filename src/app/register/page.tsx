"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, CheckCircle, Building2, User, MapPin, Phone, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.businessName || !form.contactPerson || !form.email) {
        setError("Please fill in all required fields");
        return;
      }
    }
    if (step === 2) {
      if (!form.address) {
        setError("Please provide your address");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
            <p className="text-gray-500 mb-6">
              Your business registration has been submitted for review. Our admin will approve your account within 24 hours.
              You&apos;ll be able to view prices and place orders once approved.
            </p>
            <div className="space-y-3">
              <Link href="/catalogue">
                <Button className="w-full">Browse Catalogue</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">ProCatalogue</span>
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s < step ? "bg-green-500 text-white" : s === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 rounded ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Business Information"}
              {step === 2 && "Location & Contact"}
              {step === 3 && "Create Password"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your business"}
              {step === 2 && "Where should we deliver?"}
              {step === 3 && "Secure your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Business Name *
                  </label>
                  <Input
                    placeholder="Your Company Ltd."
                    value={form.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Person *
                  </label>
                  <Input
                    placeholder="John Smith"
                    value={form.contactPerson}
                    onChange={(e) => update("contactPerson", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="contact@company.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full" onClick={handleNext}>
                  Continue →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Business Address *
                  </label>
                  <Textarea
                    placeholder="123 Business Street, City, State, ZIP"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button className="flex-1" onClick={handleNext}>
                    Continue →
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password *
                  </label>
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirm Password *</label>
                  <Input
                    type="password"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <strong>What happens next?</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Admin reviews your registration</li>
                    <li>Approval within 24 hours</li>
                    <li>Full access to pricing & ordering</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    ← Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Registration"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-4 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
