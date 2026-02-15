"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Mail,
  Plus,
  Trash2,
  Send,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type {
  Location,
  Customer,
  ReviewRequest,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReviewRequestWithCustomer extends ReviewRequest {
  customers: { name: string; email: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  opened: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export default function ReviewRequestsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    new Set(),
  );
  const [requests, setRequests] = useState<ReviewRequestWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);

  // Add customer form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Load locations on mount
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch("/api/locations");
        if (!res.ok) throw new Error("Failed to load locations");
        const json = await res.json();
        setLocations(json.locations || []);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load locations",
        );
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, []);

  // Load customers and requests when location changes
  const loadCustomers = useCallback(async (locationId: string) => {
    setCustomersLoading(true);
    setSelectedCustomerIds(new Set());
    try {
      const res = await fetch(
        `/api/customers?location_id=${encodeURIComponent(locationId)}`,
      );
      if (!res.ok) throw new Error("Failed to load customers");
      const json = await res.json();
      setCustomers(json.customers || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load customers",
      );
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async (locationId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("review_requests")
        .select("*, customers(name, email)")
        .eq("location_id", locationId)
        .order("sent_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRequests((data as unknown as ReviewRequestWithCustomer[]) || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load request history",
      );
    }
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      loadCustomers(selectedLocationId);
      loadRequests(selectedLocationId);
    } else {
      setCustomers([]);
      setRequests([]);
      setSelectedCustomerIds(new Set());
    }
  }, [selectedLocationId, loadCustomers, loadRequests]);

  // Toggle customer selection
  function toggleCustomer(id: string) {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedCustomerIds.size === customers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(customers.map((c) => c.id)));
    }
  }

  // Add customer
  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLocationId) return;
    setAddingCustomer(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: selectedLocationId,
          name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "Failed to add customer",
        );
      }

      const json = await res.json();
      setCustomers((prev) => [json.customer, ...prev]);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setAddDialogOpen(false);
      toast.success("Customer added successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add customer",
      );
    } finally {
      setAddingCustomer(false);
    }
  }

  // Delete customer
  async function handleDeleteCustomer(id: string) {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setSelectedCustomerIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Customer removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete customer",
      );
    }
  }

  // Send review requests
  async function handleSendRequests() {
    if (selectedCustomerIds.size === 0 || !selectedLocationId) return;
    setSending(true);

    try {
      const res = await fetch("/api/review-requests/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: selectedLocationId,
          customer_ids: Array.from(selectedCustomerIds),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "Failed to send requests",
        );
      }

      const json = await res.json();
      toast.success(`Review requests sent to ${json.sent} customer(s)`);
      setSelectedCustomerIds(new Set());

      // Reload data
      await Promise.all([
        loadCustomers(selectedLocationId),
        loadRequests(selectedLocationId),
      ]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send requests",
      );
    } finally {
      setSending(false);
    }
  }

  // Mark request as completed
  async function handleMarkCompleted(requestId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("review_requests")
        .update({ status: "completed" })
        .eq("id", requestId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "completed" as const } : r,
        ),
      );
      toast.success("Request marked as completed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update request",
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Review Requests</h1>
        <p className="mt-1 text-muted-foreground">
          Send review requests to your customers via email
        </p>
      </div>

      {/* Location selector */}
      <div className="flex items-center gap-4">
        <Label htmlFor="location-select" className="font-medium">
          Location
        </Label>
        <Select
          value={selectedLocationId}
          onValueChange={setSelectedLocationId}
        >
          <SelectTrigger className="w-[300px]" id="location-select">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* No location selected state */}
      {!selectedLocationId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Select a location</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              Choose a location above to manage customers and send review
              requests.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Location selected — show tabs */}
      {selectedLocationId && (
        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customers">
              <Users className="mr-2 h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="mr-2 h-4 w-4" />
              Request History
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>
                      {customers.length} customer(s) for this location
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSendRequests}
                      disabled={selectedCustomerIds.size === 0 || sending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sending
                        ? "Sending..."
                        : `Send Request (${selectedCustomerIds.size})`}
                    </Button>
                    <Dialog
                      open={addDialogOpen}
                      onOpenChange={setAddDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Customer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Customer</DialogTitle>
                          <DialogDescription>
                            Add a customer to send review requests to.
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleAddCustomer}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="customer-name">Name</Label>
                            <Input
                              id="customer-name"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-email">Email</Label>
                            <Input
                              id="customer-email"
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="john@example.com"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-phone">
                              Phone (optional)
                            </Label>
                            <Input
                              id="customer-phone"
                              type="tel"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              placeholder="+1 555-123-4567"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={addingCustomer}>
                              {addingCustomer ? "Adding..." : "Add Customer"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : customers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No customers yet. Add your first customer to start sending
                      review requests.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              customers.length > 0 &&
                              selectedCustomerIds.size === customers.length
                            }
                            onCheckedChange={toggleAll}
                            aria-label="Select all customers"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Last Request</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomerIds.has(customer.id)}
                              onCheckedChange={() =>
                                toggleCustomer(customer.id)
                              }
                              aria-label={`Select ${customer.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {customer.name}
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || "—"}</TableCell>
                          <TableCell>
                            {customer.last_request_sent
                              ? new Date(
                                  customer.last_request_sent,
                                ).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              aria-label={`Delete ${customer.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Request History</CardTitle>
                <CardDescription>
                  Recent review requests sent from this location
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No review requests sent yet. Select customers and send
                      your first request.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.customers?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {request.customers?.email || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={STATUS_STYLES[request.status] || ""}
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(request.sent_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {request.status !== "completed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleMarkCompleted(request.id)
                                }
                                title="Mark as completed"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
