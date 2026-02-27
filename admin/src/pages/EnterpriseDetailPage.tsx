import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Building2, Users, Calendar, Clock, Loader, Wallet } from "lucide-react";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s: Record<string, string> = { OPEN: "bg-green-100 text-green-700", VERIFIED: "bg-blue-100 text-blue-700", PENDING: "bg-yellow-100 text-yellow-700", REJECTED: "bg-red-100 text-red-700", CONFIRMED: "bg-blue-100 text-blue-700", COMPLETED: "bg-green-100 text-green-700" };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
};

const EnterpriseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "members" | "bookings" | "transactions">("overview");

    useEffect(() => { fetchEnterprise(); }, [id]);

    const fetchEnterprise = async () => {
        try {
            const res = await api.get(`/admin/enterprises/${id}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch enterprise:", err);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    if (loading) return <div className="page-container flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
    if (!data) return <div className="page-container"><p className="text-red-600">Enterprise not found</p></div>;

    const { enterprise, bookings, ownerWallet, transactions } = data;

    return (
        <div className="page-container">
            <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-6">← Back to Enterprises</button>

            {/* Header */}
            <div className="bg-white rounded-2xl border p-6 mb-6">
                <div className="flex items-start gap-5">
                    {enterprise.logo ? (
                        <img src={enterprise.logo} alt={enterprise.name} className="h-16 w-16 rounded-2xl object-cover border" />
                    ) : (
                        <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                            {enterprise.name[0].toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{enterprise.name}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <StatusBadge status={enterprise.status} />
                            {enterprise.registration_no && <span className="px-3 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">Reg: {enterprise.registration_no}</span>}
                            {enterprise.gst_number && <span className="px-3 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">GST: {enterprise.gst_number}</span>}
                        </div>
                        {enterprise.description && <p className="text-sm text-gray-500 mt-2 max-w-xl">{enterprise.description}</p>}
                    </div>
                    <div className="flex gap-3 text-center">
                        <div className="px-4 py-3 bg-purple-50 rounded-xl">
                            <p className="text-xl font-bold text-purple-700">{enterprise.members?.length || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Members</p>
                        </div>
                        <div className="px-4 py-3 bg-blue-50 rounded-xl">
                            <p className="text-xl font-bold text-blue-700">{bookings.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Bookings</p>
                        </div>
                        <div className="px-4 py-3 bg-green-50 rounded-xl">
                            <p className="text-xl font-bold text-green-700">₹{(ownerWallet?.balance || 0).toFixed(0)}</p>
                            <p className="text-xs text-gray-500 mt-1">Wallet</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="border-b flex">
                    {(["overview", "members", "bookings", "transactions"] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-semibold capitalize transition ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
                            {tab === "overview" && "Overview"}
                            {tab === "members" && `Members (${enterprise.members?.length || 0})`}
                            {tab === "bookings" && `Bookings (${bookings.length})`}
                            {tab === "transactions" && `Transactions (${transactions.length})`}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="p-6 grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Enterprise Details</h3>
                            {[["ID", `#${enterprise.id}`], ["Name", enterprise.name], ["Status", enterprise.status], ["Priority", enterprise.priority], ["Website", enterprise.website || "—"], ["Created", fmtDate(enterprise.created_at)]].map(([label, val]) => (
                                <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{val}</span></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Owner Details</h3>
                            {[["Name", enterprise.owner?.name || "—"], ["Email", enterprise.owner?.email || "—"], ["Phone", enterprise.owner?.phone || "—"], ["Registered", fmtDate(enterprise.owner?.created_at)]].map(([label, val]) => (
                                <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{val}</span></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === "members" && (
                    <table className="w-full">
                        <thead><tr className="border-b bg-gray-50 text-left">{["Member", "Role", "Joined"].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                        <tbody className="divide-y">
                            {enterprise.members?.length === 0 ? <tr><td colSpan={3} className="py-10 text-center text-sm text-gray-500">No members</td></tr> :
                                enterprise.members?.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">{(m.name || m.email || "?")[0].toUpperCase()}</div>
                                                <div><p className="text-sm font-medium">{m.name || "—"}</p><p className="text-xs text-gray-400">{m.email}</p></div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{m.role}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">{fmtDate(m.created_at)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}

                {/* Bookings Tab */}
                {activeTab === "bookings" && (
                    <table className="w-full">
                        <thead><tr className="border-b bg-gray-50 text-left">{["#", "User", "Member", "Date", "Time", "Status"].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                        <tbody className="divide-y">
                            {bookings.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-500">No bookings yet</td></tr> :
                                bookings.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm text-gray-400">#{b.id}</td>
                                        <td className="px-5 py-3"><p className="text-sm font-medium">{b.user?.name || "—"}</p><p className="text-xs text-gray-400">{b.user?.email}</p></td>
                                        <td className="px-5 py-3"><p className="text-sm">{b.enterpriseMember?.name || "—"}</p><p className="text-xs text-gray-400">{b.enterpriseMember?.email}</p></td>
                                        <td className="px-5 py-3 text-sm text-gray-600"><div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{fmtDate(b.date)}</div></td>
                                        <td className="px-5 py-3 text-sm text-gray-600"><div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-400" />{b.time_slot}</div></td>
                                        <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                    <table className="w-full">
                        <thead><tr className="border-b bg-gray-50 text-left">{["ID", "Type", "Amount", "Description", "Date"].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                        <tbody className="divide-y">
                            {transactions.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-500">No transactions</td></tr> :
                                transactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm text-gray-400">#{t.id}</td>
                                        <td className="px-5 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.type === "CREDIT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.type}</span></td>
                                        <td className="px-5 py-3 text-sm font-bold text-gray-800">₹{t.amount.toFixed(2)}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate">{t.description || "—"}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{fmt(t.created_at)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default EnterpriseDetailPage;
