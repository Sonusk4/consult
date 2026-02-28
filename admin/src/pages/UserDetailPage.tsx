import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { User, Wallet, Calendar, Clock, ArrowDownRight, ArrowUpRight, Loader } from "lucide-react";

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const s: Record<string, string> = { CREDIT: "bg-green-100 text-green-700", DEBIT: "bg-red-100 text-red-700", EARNING: "bg-blue-100 text-blue-700", COMMISSION: "bg-purple-100 text-purple-700" };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[type] || "bg-gray-100 text-gray-600"}`}>{type}</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700", COMPLETED: "bg-green-100 text-green-700", SUCCESS: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
};

const UserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"profile" | "transactions" | "bookings">("profile");

    useEffect(() => { fetchUser(); }, [id]);

    const fetchUser = async () => {
        try {
            const res = await api.get(`/admin/users/${id}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch user:", err);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    if (loading) return <div className="page-container flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
    if (!data) return <div className="page-container"><p className="text-red-600">User not found</p></div>;

    const { user, transactions, bookings } = data;
    const totalSpent = transactions.filter((t: any) => t.type === "DEBIT").reduce((s: number, t: any) => s + t.amount, 0);

    return (
        <div className="page-container">
            <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-6">← Back to Users</button>

            {/* Header */}
            <div className="bg-white rounded-2xl border p-6 mb-6">
                <div className="flex items-start gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {(user.name || user.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{user.name || "—"}</h1>
                        <p className="text-gray-500">{user.email}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{user.role}</span>
                            {user.is_verified && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Verified</span>}
                            {user.phone && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{user.phone}</span>}
                        </div>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div className="px-5 py-3 bg-blue-50 rounded-xl">
                            <p className="text-xl font-bold text-blue-700">₹{(user.wallet?.balance || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">Wallet Balance</p>
                        </div>
                        <div className="px-5 py-3 bg-red-50 rounded-xl">
                            <p className="text-xl font-bold text-red-600">₹{totalSpent.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Spent</p>
                        </div>
                        <div className="px-5 py-3 bg-gray-50 rounded-xl">
                            <p className="text-xl font-bold text-gray-800">{bookings.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Bookings</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="border-b flex">
                    {(["profile", "transactions", "bookings"] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-semibold capitalize transition ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
                            {tab === "profile" && "Profile"}
                            {tab === "transactions" && `Transactions (${transactions.length})`}
                            {tab === "bookings" && `Bookings (${bookings.length})`}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="p-6 grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Account Details</h3>
                            {[
                                ["User ID", `#${user.id}`],
                                ["Email", user.email],
                                ["Phone", user.phone || "—"],
                                ["Joined", fmtDate(user.created_at)],
                                ["Enterprise", user.enterprise?.name || "—"],
                                ["Bonus Balance", `₹${(data.usageStats?.bonusBalance || 0).toFixed(2)}`]
                            ].map(([label, val]) => (
                                <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{val}</span></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Subscription & Usage</h3>
                            {data.usageStats ? (
                                <>
                                    {[
                                        ["Current Plan", data.usageStats.plan],
                                        ["Plan Expiry", data.usageStats.expiry ? fmtDate(data.usageStats.expiry) : "No expiry"],
                                        ["Chat Limit", data.usageStats.chatLimit],
                                        ["Chats Used", data.usageStats.chatUsed],
                                        ["Chats Remaining", data.usageStats.chatRemaining],
                                        ["Bookings Made", data.usageStats.bookingsMade]
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{val}</span></div>
                                    ))}
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">No usage stats available</p>
                            )}
                        </div>
                        {user.profile && (
                            <div className="col-span-2 mt-4 space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Bio & Professional</h3>
                                {[["Bio", user.profile.bio || "—"], ["Location", user.profile.location || "—"], ["Languages", user.profile.languages || "—"], ["KYC Status", user.profile.kyc_status || "—"]].map(([label, val]) => (
                                    <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800 text-right max-w-xs">{val}</span></div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    {["ID", "Type", "Amount", "Description", "Method", "Date & Time", "Status"].map(h => (
                                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions.length === 0 ? (
                                    <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-500">No transactions yet</td></tr>
                                ) : transactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm text-gray-400">#{t.id}</td>
                                        <td className="px-5 py-3"><TypeBadge type={t.type} /></td>
                                        <td className="px-5 py-3">
                                            <span className={`font-bold text-sm flex items-center gap-1 ${t.type === "CREDIT" || t.type === "EARNING" ? "text-green-600" : "text-red-600"}`}>
                                                {t.type === "CREDIT" || t.type === "EARNING" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                                ₹{t.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate">{t.description || "—"}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{t.payment_method || "—"}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{fmt(t.created_at)}</td>
                                        <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Bookings Tab */}
                {activeTab === "bookings" && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    {["Booking", "Consultant", "Date", "Time", "Fee", "Status"].map(h => (
                                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {bookings.length === 0 ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-500">No bookings yet</td></tr>
                                ) : bookings.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm font-medium text-gray-900">#{b.id}</td>
                                        <td className="px-5 py-3">
                                            <p className="text-sm font-medium">{b.consultant?.user?.name || "—"}</p>
                                            <p className="text-xs text-blue-500">{b.consultant?.domain}</p>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{fmtDate(b.date)}</div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-400" />{b.time_slot}</div>
                                        </td>
                                        <td className="px-5 py-3 text-sm font-semibold text-gray-800">₹{(b.consultant_fee || 0).toFixed(2)}</td>
                                        <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetailPage;
