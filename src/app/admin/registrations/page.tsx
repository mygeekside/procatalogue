"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, User, Building2, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Customer {
  id: number;
  email: string;
  status: string;
  businessName: string | null;
  contactPerson: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

export default function RegistrationsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?status=${filter}`);
    const data = await res.json();
    setCustomers(data.users?.filter((u: Customer) => u.status !== "admin") || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

  const handleAction = async (userId: number, status: "approved" | "rejected") => {
    setProcessing(userId);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      fetchCustomers();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Registrations</h1>
        <p className="text-gray-500 mt-1">Review and approve business registrations</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No {filter} registrations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Status indicator */}
                  <div className={`w-full md:w-2 flex-shrink-0 ${
                    customer.status === "pending" ? "bg-orange-400" :
                    customer.status === "approved" ? "bg-green-400" : "bg-red-400"
                  }`} />
                  
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{customer.businessName}</h3>
                            <Badge variant={
                              customer.status === "pending" ? "warning" :
                              customer.status === "approved" ? "success" : "destructive"
                            }>
                              {customer.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            {customer.contactPerson}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="line-clamp-1">{customer.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            Registered {formatDate(customer.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {customer.status === "pending" && (
                        <div className="flex gap-3 flex-shrink-0">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleAction(customer.id, "rejected")}
                            disabled={processing === customer.id}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction(customer.id, "approved")}
                            disabled={processing === customer.id}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                        </div>
                      )}
                      {customer.status === "approved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(customer.id, "rejected")}
                          disabled={processing === customer.id}
                        >
                          Revoke Access
                        </Button>
                      )}
                      {customer.status === "rejected" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction(customer.id, "approved")}
                          disabled={processing === customer.id}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
