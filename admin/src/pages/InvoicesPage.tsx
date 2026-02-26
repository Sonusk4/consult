import React, { useEffect, useState } from "react";
import { Clock, CheckCircle2, DollarSign, ArrowUpRight } from "lucide-react";
import { invoices } from "../services/api";

interface InvoiceStats {
  totalAmount: number;
  totalCount: number;
  successAmount: number;
  successCount: number;
  pendingCount: number;
}

interface Invoice {
  id: number;
  razorpay_order_id: string;
  amount: number;
  credits: number;
  bonus: number;
  status: string;
  created_at: string;
  user?: { name: string; email: string };
}

const variantColors = {
  info: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
};

const statusStyles: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const InvoicesPage: React.FC = () => {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, invoicesData] = await Promise.all([
        invoices.getStats(),
        invoices.getAll(),
      ]);
      setStats(statsData);
      setInvoiceList(Array.isArray(invoicesData) ? invoicesData : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch invoice data:", err);
      setError("Failed to load invoice data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <h1 className="page-title">Invoice Management</h1>
          <p className="page-subtitle">Manage billing, invoices, and payment processing.</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <h1 className="page-title">Invoice Management</h1>
          <p className="page-subtitle">Manage billing, invoices, and payment processing.</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = stats
    ? [
      {
        label: "Pending Invoices",
        value: (stats.pendingCount || 0).toString(),
        icon: Clock,
        variant: "warning" as const,
      },
      {
        label: "Paid Invoices",
        value: (stats.successCount || 0).toString(),
        icon: CheckCircle2,
        variant: "success" as const,
      },
      {
        label: "Total Revenue",
        value: `₹${((stats.totalAmount || 0) / 1000).toFixed(1)}K`,
        icon: DollarSign,
        variant: "info" as const,
      },
    ]
    : [];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Invoice Management</h1>
        <p className="page-subtitle">Manage billing, invoices, and payment processing.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${variantColors[stat.variant]}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Order ID</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Credits</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoiceList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoiceList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.razorpay_order_id || `INV-${inv.id}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inv.user?.name || inv.user?.email || "N/A"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{(inv.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inv.credits || 0} {inv.bonus ? `(+${inv.bonus} bonus)` : ""}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[inv.status] || "bg-gray-100 text-gray-700"
                        }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
