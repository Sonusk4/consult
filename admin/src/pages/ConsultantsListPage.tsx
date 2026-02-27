import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Users, Search, ChevronRight, Loader, TrendingUp, AlertCircle } from "lucide-react";

const ConsultantsListPage: React.FC = () => {
    const navigate = useNavigate();
    const [consultants, setConsultants] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetchConsultants(); }, []);
    useEffect(() => {
        if (!search) { setFiltered(consultants); return; }
        setFiltered(consultants.filter(c =>
            (c.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.domain || "").toLowerCase().includes(search.toLowerCase())
        ));
    }, [search, consultants]);

    const fetchConsultants = async () => {
        try {
            const data = await api.get("/admin/consultants-list");
            setConsultants(data.data);
            setFiltered(data.data);
        } catch (err) {
            console.error("Failed to fetch consultants:", err);
        } finally {
            setLoading(false);
        }
    };

    const kycBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-700",
            SUBMITTED: "bg-blue-100 text-blue-700",
            APPROVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>{status || "PENDING"}</span>;
    };

    return (
        <div className="page-container">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
                <div>
                    <h1 className="page-title flex items-center gap-2"><Users className="h-6 w-6 text-green-600" />All Consultants</h1>
                    <p className="page-subtitle">{consultants.length} consultants — click to view full profile & payout details</p>
                </div>
            </div>

            <div className="bg-white border rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2 max-w-md">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input placeholder="Search by name, email, or domain..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm outline-none" />
                </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50 text-left">
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Consultant</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Domain</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">KYC Status</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total Earned</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Outstanding Payout</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Bookings</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No consultants found</td></tr>
                            ) : filtered.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/consultants-list/${c.id}`)}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
                                                {(c.user?.name || c.user?.email || "?")[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{c.user?.name || "—"}</p>
                                                <p className="text-xs text-gray-400">{c.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-blue-600 font-medium">{c.domain || "—"}</td>
                                    <td className="px-5 py-4">{kycBadge(c.kyc_status)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1 text-sm font-semibold text-blue-700">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            ₹{(c.totalEarned || 0).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className={`flex items-center gap-1 text-sm font-bold ${c.outstanding > 0 ? "text-red-600" : "text-gray-400"}`}>
                                            {c.outstanding > 0 && <AlertCircle className="h-3.5 w-3.5" />}
                                            {c.outstanding > 0 ? `₹${c.outstanding.toFixed(2)}` : "All paid"}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-600">{c._count?.bookings || 0}</td>
                                    <td className="px-5 py-4"><ChevronRight className="h-4 w-4 text-gray-300" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ConsultantsListPage;
