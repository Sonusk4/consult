import React, { useEffect, useState } from "react";
import { Building2, Package, TrendingUp, ArrowUpRight } from "lucide-react";
import { enterprises } from "../services/api";

interface EnterpriseStats {
  totalEnterprises?: number;
  activeEnterprises?: number;
  totalMembers?: number;
  totalBookings?: number;
  total?: number;
  active?: number;
  pending?: number;
}

interface EnterpriseClient {
  id: number;
  name: string;
  registration_no?: string;
  status: string;
  owner?: {
    name?: string;
    email?: string;
  };
  members?: Array<{
    id: number;
    name?: string;
    email?: string;
  }>;
}

const variantColors = {
  info: "bg-info-muted text-info-muted-foreground",
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
};

const EnterprisePage: React.FC = () => {
  const [stats, setStats] = useState<EnterpriseStats | null>(null);
  const [clients, setClients] = useState<EnterpriseClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, clientsData] = await Promise.all([
        enterprises.getStats(),
        enterprises.getAll(),
      ]);
      setStats(statsData);
      setClients(clientsData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch enterprise data:", err);
      setError("Failed to load enterprise data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <h1 className="page-title">Enterprise Management</h1>
          <p className="page-subtitle">Manage enterprise clients and corporate consultation packages.</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading enterprise data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <h1 className="page-title">Enterprise Management</h1>
          <p className="page-subtitle">Manage enterprise clients and corporate consultation packages.</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    {
      label: "Enterprise Clients",
      value: (stats.totalEnterprises || stats.total || 0).toString(),
      change: "+8%",
      icon: Building2,
      variant: "info" as const
    },
    {
      label: "Active Enterprises",
      value: (stats.activeEnterprises || stats.active || 0).toString(),
      change: "+12%",
      icon: Package,
      variant: "warning" as const
    },
    {
      label: "Pending",
      value: (stats.totalMembers || stats.pending || 0).toString(),
      change: "+18%",
      icon: TrendingUp,
      variant: "success" as const
    },
  ] : [];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Enterprise Management</h1>
        <p className="page-subtitle">Manage enterprise clients and corporate consultation packages.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${variantColors[stat.variant]}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-success-muted-foreground">
                {stat.change} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Clients Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Enterprise Clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Company</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Owner</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Members</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    No enterprises found
                  </td>
                </tr>
              ) : (
                clients.map((client, i) => (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{client.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{client.owner?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{client.members?.length || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.status === "OPEN"
                        ? "bg-success-muted text-success-muted-foreground"
                        : "bg-warning-muted text-warning-muted-foreground"
                        }`}>
                        {client.status === "OPEN" ? "Active" : client.status}
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

export default EnterprisePage;
