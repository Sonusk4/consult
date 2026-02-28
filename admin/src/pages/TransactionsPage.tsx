import React, { useEffect, useState } from "react";
import { transactions } from "../services/api";
import {
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    DollarSign,
    Users,
    Calendar,
    Clock,
    Filter,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader,
    Award,
    Download,
} from "lucide-react";

/* ===================== TYPES ===================== */

interface Transaction {
    id: number;
    userId: number;
    type: string;
    amount: number;
    description: string | null;
    bookingId: number | null;
    consultantId: number | null;
    payment_method: string | null;
    status: string;
    created_at: string;
    user: { id: number; name: string; email: string; role: string } | null;
    consultant: { id: number; name: string; domain: string } | null;
}

interface BookingRecord {
    id: number;
    date: string;
    time_slot: string;
    status: string;
    is_paid: boolean;
    call_completed: boolean;
    call_duration: number | null;
    created_at: string;
    completed_at: string | null;
    user: { id: number; name: string; email: string };
    consultant: { id: number; name: string; email: string; domain: string } | null;
    consultant_fee: number;
    amount_deducted_from_user: number;
    commission_fee: number;
    consultant_earning: number;
}

interface Stats {
    totalCreditsAdded: number;
    totalCreditTransactions: number;
    totalDebits: number;
    totalDebitTransactions: number;
    totalEarnings: number;
    totalEarningTransactions: number;
    totalCommissions: number;
    totalCommissionTransactions: number;
    totalBookings: number;
    completedBookings: number;
    topSpenders: Array<{ userId: number; _sum: { amount: number }; user: { name: string; email: string } }>;
    topEarners: Array<{ consultantId: number; totalEarned: number; name: string; domain: string }>;
}

/* ===================== BADGE ===================== */
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const styles: Record<string, string> = {
        CREDIT: "bg-green-100 text-green-700",
        DEBIT: "bg-red-100 text-red-700",
        EARNING: "bg-blue-100 text-blue-700",
        COMMISSION: "bg-purple-100 text-purple-700",
        SUBSCRIPTION: "bg-indigo-100 text-indigo-700",
        CHAT_CREDIT: "bg-orange-100 text-orange-700",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[type] || "bg-gray-100 text-gray-700"}`}>
            {type}
        </span>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-700",
        CONFIRMED: "bg-blue-100 text-blue-700",
        COMPLETED: "bg-green-100 text-green-700",
        CANCELLED: "bg-red-100 text-red-700",
        REJECTED: "bg-red-100 text-red-700",
        SUCCESS: "bg-green-100 text-green-700",
        FAILED: "bg-red-100 text-red-700",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
        </span>
    );
};

/* ===================== MAIN ===================== */
const TransactionsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"all" | "bookings" | "credits">("all");
    const [stats, setStats] = useState<Stats | null>(null);
    const [txList, setTxList] = useState<Transaction[]>([]);
    const [bookingList, setBookingList] = useState<BookingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters - All Transactions
    const [txTypeFilter, setTxTypeFilter] = useState("");
    const [txStartDate, setTxStartDate] = useState("");
    const [txEndDate, setTxEndDate] = useState("");

    // Filters - Bookings
    const [bStatusFilter, setBStatusFilter] = useState("");
    const [bStartDate, setBStartDate] = useState("");
    const [bEndDate, setBEndDate] = useState("");

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, txData, bookData] = await Promise.all([
                transactions.getStats(),
                transactions.getAll({ limit: 200 }),
                transactions.getBookings({ limit: 200 }),
            ]);
            setStats(statsData);
            setTxList(Array.isArray(txData.transactions) ? txData.transactions : []);
            setBookingList(Array.isArray(bookData.bookings) ? bookData.bookings : []);
        } catch (err) {
            console.error("Failed to load transaction data:", err);
            setError("Failed to load transaction data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchFiltered = async () => {
        setLoading(true);
        try {
            if (activeTab === "all") {
                const data = await transactions.getAll({
                    type: txTypeFilter || undefined,
                    startDate: txStartDate || undefined,
                    endDate: txEndDate || undefined,
                    limit: 200,
                });
                setTxList(Array.isArray(data.transactions) ? data.transactions : []);
            } else if (activeTab === "bookings") {
                const data = await transactions.getBookings({
                    status: bStatusFilter || undefined,
                    startDate: bStartDate || undefined,
                    endDate: bEndDate || undefined,
                    limit: 200,
                });
                setBookingList(Array.isArray(data.bookings) ? data.bookings : []);
            }
        } catch {
            setError("Failed to apply filters.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const formatDateTime = (dateStr: string) =>
        new Date(dateStr).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const handleExportCSV = () => {
        let headers = [];
        let rows = [];
        let filename = `export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

        if (activeTab === "all") {
            headers = ["ID", "User Name", "User Email", "Type", "Amount", "Consultant", "Payment Method", "Date & Time", "Status"];
            rows = txList.map(t => [
                t.id,
                t.user?.name || "Unknown",
                t.user?.email || "",
                t.type,
                t.amount.toFixed(2),
                t.consultant?.name || "",
                t.payment_method || "",
                formatDateTime(t.created_at).replace(/,/g, ''),
                t.status
            ]);
        } else if (activeTab === "bookings") {
            headers = ["Booking ID", "User Name", "User Email", "Consultant", "Domain", "Date", "Time Slot", "Fee", "Deducted", "Consultant Got", "Commission", "Status"];
            rows = bookingList.map(b => [
                b.id,
                b.user?.name || "Unknown",
                b.user?.email || "",
                b.consultant?.name || "Unknown",
                b.consultant?.domain || "",
                formatDate(b.date).replace(/,/g, ''),
                b.time_slot,
                b.consultant_fee.toFixed(2),
                b.amount_deducted_from_user.toFixed(2),
                b.consultant_earning.toFixed(2),
                b.commission_fee.toFixed(2),
                b.status
            ]);
        } else if (activeTab === "credits") {
            headers = ["ID", "User Name", "User Email", "Credits Added", "Payment Method", "Description", "Date & Time", "Status"];
            rows = creditTopUps.map(t => [
                t.id,
                t.user?.name || "Unknown",
                t.user?.email || "",
                t.amount.toFixed(2),
                t.payment_method || "RAZORPAY",
                (t.description || "").replace(/,/g, ';'), // avoid breaking CSV
                formatDateTime(t.created_at).replace(/,/g, ''),
                t.status
            ]);
        }

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Credits are CREDIT-type transactions
    const creditTopUps = txList.filter((t) => t.type === "CREDIT");

    if (loading && !stats) {
        return (
            <div className="page-container flex items-center justify-center h-64">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="page-title">Transaction Tracking</h1>
                    <p className="page-subtitle">Full financial overview — credits, bookings, earnings, and commissions.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={fetchAll}
                        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* ── Stats Cards ── */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <ArrowUpRight className="h-5 w-5 text-green-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{(stats.totalCreditsAdded || 0).toFixed(0)}</p>
                        <p className="text-sm text-gray-500 mt-1">Credits Added ({stats.totalCreditTransactions})</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <ArrowDownRight className="h-5 w-5 text-red-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{(stats.totalDebits || 0).toFixed(0)}</p>
                        <p className="text-sm text-gray-500 mt-1">User Spend ({stats.totalDebitTransactions})</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-blue-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{(stats.totalEarnings || 0).toFixed(0)}</p>
                        <p className="text-sm text-gray-500 mt-1">Consultant Payouts</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-purple-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{(stats.totalCommissions || 0).toFixed(0)}</p>
                        <p className="text-sm text-gray-500 mt-1">Platform Commission</p>
                    </div>
                </div>
            )}

            {/* ── Booking Stats ── */}
            {stats && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="stat-card flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-6 w-6 text-indigo-700" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                            <p className="text-sm text-gray-500">Total Bookings</p>
                        </div>
                    </div>
                    <div className="stat-card flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
                            <p className="text-sm text-gray-500">Completed Sessions</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Top Earners / Spenders ── */}
            {stats && (stats.topSpenders?.length > 0 || stats.topEarners?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {stats.topSpenders?.length > 0 && (
                        <div className="bg-white rounded-xl border p-5">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Users className="h-4 w-4 text-red-500" />
                                Top Spending Users
                            </h3>
                            <div className="space-y-3">
                                {stats.topSpenders.map((s, i) => (
                                    <div key={s.userId} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{s.user?.name || s.user?.email || "Unknown"}</p>
                                                <p className="text-xs text-gray-400">{s.user?.email}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-red-600 text-sm">₹{(s._sum?.amount || 0).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {stats.topEarners?.length > 0 && (
                        <div className="bg-white rounded-xl border p-5">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Award className="h-4 w-4 text-blue-500" />
                                Top Earning Consultants
                            </h3>
                            <div className="space-y-3">
                                {stats.topEarners.map((e, i) => (
                                    <div key={e.consultantId} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{e.name}</p>
                                                <p className="text-xs text-gray-400">{e.domain}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-blue-600 text-sm">₹{e.totalEarned.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="border-b flex">
                    {(["all", "bookings", "credits"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === tab
                                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab === "all" && "All Transactions"}
                            {tab === "bookings" && `Bookings (${bookingList.length})`}
                            {tab === "credits" && `Credit Top-ups (${creditTopUps.length})`}
                        </button>
                    ))}
                </div>

                {/* ── Filters ── */}
                <div className="px-6 py-4 border-b bg-gray-50 flex flex-wrap gap-3 items-end">
                    {activeTab === "all" && (
                        <>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Type</label>
                                <select
                                    value={txTypeFilter}
                                    onChange={(e) => setTxTypeFilter(e.target.value)}
                                    className="text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="CREDIT">WALLET TOPUP</option>
                                    <option value="DEBIT">BOOKING FEE</option>
                                    <option value="EARNING">CONSULTANT EARNING</option>
                                    <option value="COMMISSION">PLATFORM COMMISSION</option>
                                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                                    <option value="CHAT_CREDIT">CHAT CREDITS</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">From</label>
                                <input type="date" value={txStartDate} onChange={(e) => setTxStartDate(e.target.value)}
                                    className="text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">To</label>
                                <input type="date" value={txEndDate} onChange={(e) => setTxEndDate(e.target.value)}
                                    className="text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </>
                    )}
                    {activeTab === "bookings" && (
                        <>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Status</label>
                                <select
                                    value={bStatusFilter}
                                    onChange={(e) => setBStatusFilter(e.target.value)}
                                    className="text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="CONFIRMED">CONFIRMED</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">From</label>
                                <input type="date" value={bStartDate} onChange={(e) => setBStartDate(e.target.value)}
                                    className="text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">To</label>
                                <input type="date" value={bEndDate} onChange={(e) => setBEndDate(e.target.value)}
                                    className="text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </>
                    )}
                    <button
                        onClick={fetchFiltered}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                    >
                        <Filter className="h-3.5 w-3.5" />
                        Apply
                    </button>
                </div>

                {/* ── Tab Content ── */}
                <div className="overflow-x-auto">

                    {/* ALL TRANSACTIONS TAB */}
                    {activeTab === "all" && (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Consultant</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={8} className="py-12 text-center"><Loader className="h-6 w-6 animate-spin text-blue-600 mx-auto" /></td></tr>
                                ) : txList.length === 0 ? (
                                    <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">No transactions found</td></tr>
                                ) : (
                                    txList.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 text-sm text-gray-500">#{txn.id}</td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-gray-900">{txn.user?.name || "Unknown"}</p>
                                                <p className="text-xs text-gray-400">{txn.user?.email}</p>
                                            </td>
                                            <td className="px-5 py-4"><TypeBadge type={txn.type} /></td>
                                            <td className="px-5 py-4">
                                                <span className={`font-bold text-sm ${txn.type === "CREDIT" || txn.type === "EARNING" || txn.type === "SUBSCRIPTION" || txn.type === "CHAT_CREDIT" ? "text-green-600" : "text-red-600"}`}>
                                                    {txn.type === "CREDIT" || txn.type === "EARNING" || txn.type === "SUBSCRIPTION" || txn.type === "CHAT_CREDIT" ? "+" : "-"}₹{txn.amount.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{txn.consultant?.name || "—"}</td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{txn.payment_method || "—"}</td>
                                            <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(txn.created_at)}</td>
                                            <td className="px-5 py-4"><StatusBadge status={txn.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* BOOKINGS TAB */}
                    {activeTab === "bookings" && (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Consultant</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Slot</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deducted</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Consultant Got</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={10} className="py-12 text-center"><Loader className="h-6 w-6 animate-spin text-blue-600 mx-auto" /></td></tr>
                                ) : bookingList.length === 0 ? (
                                    <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">No bookings found</td></tr>
                                ) : (
                                    bookingList.map((b) => (
                                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">#{b.id}</span>
                                                    {b.call_completed && (
                                                        <span title="Call completed">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400">Booked: {formatDate(b.created_at)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-gray-900">{b.user?.name || "Unknown"}</p>
                                                <p className="text-xs text-gray-400">{b.user?.email}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-gray-900">{b.consultant?.name || "Unknown"}</p>
                                                <p className="text-xs text-blue-500">{b.consultant?.domain}</p>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {formatDate(b.date)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    {b.time_slot}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-medium text-gray-900">₹{b.consultant_fee.toFixed(2)}</td>
                                            <td className="px-5 py-4 text-sm font-medium text-red-600">-₹{b.amount_deducted_from_user.toFixed(2)}</td>
                                            <td className="px-5 py-4 text-sm font-medium text-blue-600">+₹{b.consultant_earning.toFixed(2)}</td>
                                            <td className="px-5 py-4 text-sm font-medium text-purple-600">₹{b.commission_fee.toFixed(2)}</td>
                                            <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* CREDIT TOP-UPS TAB */}
                    {activeTab === "credits" && (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits Added</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Method</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={7} className="py-12 text-center"><Loader className="h-6 w-6 animate-spin text-blue-600 mx-auto" /></td></tr>
                                ) : creditTopUps.length === 0 ? (
                                    <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No credit top-ups found</td></tr>
                                ) : (
                                    creditTopUps.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 text-sm text-gray-500">#{txn.id}</td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-gray-900">{txn.user?.name || "Unknown"}</p>
                                                <p className="text-xs text-gray-400">{txn.user?.email}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-green-600 text-sm">+₹{txn.amount.toFixed(2)}</span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{txn.payment_method || "RAZORPAY"}</td>
                                            <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">{txn.description || "—"}</td>
                                            <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(txn.created_at)}</td>
                                            <td className="px-5 py-4"><StatusBadge status={txn.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionsPage;
