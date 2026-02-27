import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import {
    Loader, Calendar, Clock, TrendingUp, DollarSign, AlertCircle, CheckCircle2,
    ArrowDownRight, ArrowUpRight, Send
} from "lucide-react";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700", COMPLETED: "bg-green-100 text-green-700", SUCCESS: "bg-green-100 text-green-700", PAID: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
};
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const s: Record<string, string> = { CREDIT: "bg-green-100 text-green-700", DEBIT: "bg-red-100 text-red-700", EARNING: "bg-blue-100 text-blue-700", COMMISSION: "bg-purple-100 text-purple-700" };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[type] || "bg-gray-100 text-gray-600"}`}>{type}</span>;
};

const ConsultantDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"profile" | "bookings" | "transactions" | "payouts" | "availability">("profile");

    // Commission State
    const [commConsultant, setCommConsultant] = useState<string>("");
    const [commUser, setCommUser] = useState<string>("");
    const [commLoading, setCommLoading] = useState(false);
    const [commMsg, setCommMsg] = useState("");

    // Availability tab state
    const [availDate, setAvailDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [availSlots, setAvailSlots] = useState<any[]>([]);
    const [availLoading, setAvailLoading] = useState(false);

    // Payout modal state
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutNotes, setPayoutNotes] = useState("");
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutSuccess, setPayoutSuccess] = useState("");
    const [payoutError, setPayoutError] = useState("");

    useEffect(() => { fetchConsultant(); }, [id]);

    const fetchConsultant = async () => {
        try {
            const res = await api.get(`/admin/consultants-list/${id}`);
            setData(res.data);
            if (res.data.payoutSummary?.outstanding > 0) {
                setPayoutAmount(res.data.payoutSummary.outstanding.toFixed(2));
            }
            if (res.data.consultant) {
                setCommConsultant(res.data.consultant.consultant_commission_pct?.toString() || "");
                setCommUser(res.data.consultant.user_commission_pct?.toString() || "");
            }
        } catch (err) {
            console.error("Failed to fetch consultant:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async (date: string) => {
        setAvailLoading(true);
        try {
            const res = await api.get(`/admin/consultant-availability/${id}?date=${date}`);
            setAvailSlots(res.data.slots || []);
        } catch (err) {
            console.error("Failed to fetch availability:", err);
            setAvailSlots([]);
        } finally {
            setAvailLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!payoutAmount || parseFloat(payoutAmount) <= 0) { setPayoutError("Enter a valid amount"); return; }
        setPayoutLoading(true); setPayoutError(""); setPayoutSuccess("");
        try {
            await api.post(`/admin/payouts/${id}/mark-paid`, { amount: parseFloat(payoutAmount), notes: payoutNotes });
            setPayoutSuccess(`₹${parseFloat(payoutAmount).toFixed(2)} payout recorded & email sent to consultant!`);
            setShowPayoutModal(false);
            setPayoutNotes("");
            await fetchConsultant(); // Refresh data
        } catch (err: any) {
            setPayoutError(err?.response?.data?.error || "Failed to record payout");
        } finally {
            setPayoutLoading(false);
        }
    };

    const handleSaveCommission = async () => {
        setCommLoading(true); setCommMsg("");
        try {
            const payload = {
                consultant_commission_pct: commConsultant === "" ? null : parseFloat(commConsultant),
                user_commission_pct: commUser === "" ? null : parseFloat(commUser),
            };
            await api.put(`/admin/consultants/${id}/commission`, payload);
            setCommMsg("Commissions updated!");
            setTimeout(() => setCommMsg(""), 3000);
            await fetchConsultant();
        } catch (err: any) {
            setCommMsg("Error saving commissions.");
        } finally {
            setCommLoading(false);
        }
    };

    const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    if (loading) return <div className="page-container flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
    if (!data) return <div className="page-container"><p className="text-red-600">Consultant not found</p></div>;

    const { consultant, bookings, transactions, payoutSummary } = data;

    return (
        <div className="page-container">
            <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-6">← Back to Consultants</button>

            {/* Header */}
            <div className="bg-white rounded-2xl border p-6 mb-6">
                <div className="flex items-start gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-green-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {(consultant.user?.name || consultant.user?.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{consultant.user?.name || "—"}</h1>
                        <p className="text-gray-500">{consultant.user?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{consultant.domain || "No domain"}</span>
                            {consultant.is_verified && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">✓ Verified</span>}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${consultant.kyc_status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>KYC: {consultant.kyc_status}</span>
                            {consultant.hourly_price && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">₹{consultant.hourly_price}/session</span>}
                        </div>
                    </div>
                    <div className="flex gap-3 text-center">
                        <div className="px-4 py-3 bg-blue-50 rounded-xl min-w-[100px]">
                            <p className="text-xl font-bold text-blue-700">₹{payoutSummary.totalEarned.toFixed(0)}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Earned</p>
                        </div>
                        <div className="px-4 py-3 bg-green-50 rounded-xl min-w-[100px]">
                            <p className="text-xl font-bold text-green-600">₹{payoutSummary.totalPaid.toFixed(0)}</p>
                            <p className="text-xs text-gray-500 mt-1">Paid Out</p>
                        </div>
                        <div className={`px-4 py-3 rounded-xl min-w-[100px] ${payoutSummary.outstanding > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                            <p className={`text-xl font-bold ${payoutSummary.outstanding > 0 ? "text-red-600" : "text-gray-500"}`}>₹{payoutSummary.outstanding.toFixed(0)}</p>
                            <p className="text-xs text-gray-500 mt-1">Outstanding</p>
                        </div>
                    </div>
                </div>

                {/* Outstanding Alert */}
                {payoutSummary.outstanding > 0 && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-orange-700">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-semibold">₹{payoutSummary.outstanding.toFixed(2)} pending payment to this consultant</span>
                        </div>
                        <button
                            onClick={() => { setShowPayoutModal(true); setPayoutSuccess(""); setPayoutError(""); }}
                            className="flex items-center gap-2 px-5 py-2 bg-orange-600 text-white rounded-xl font-semibold text-sm hover:bg-orange-700 transition"
                        >
                            <Send className="h-4 w-4" /> Mark as Paid
                        </button>
                    </div>
                )}

                {payoutSuccess && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />{payoutSuccess}
                    </div>
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Record Payout to Consultant</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Amount (₹)</label>
                                <input
                                    type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                                    className="w-full border rounded-xl px-4 py-3 text-lg font-bold text-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter amount to pay"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optional)</label>
                                <textarea
                                    value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)}
                                    rows={3} className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    placeholder="e.g. Bank transfer reference, UPI ID, etc."
                                />
                            </div>
                            {payoutError && <p className="text-red-600 text-sm">{payoutError}</p>}
                            <p className="text-xs text-gray-400">An email notification will be sent to {consultant.user?.email} confirming the payment.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowPayoutModal(false)} disabled={payoutLoading} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleMarkPaid} disabled={payoutLoading} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
                                {payoutLoading ? <><Loader className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Confirm & Send Email</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="border-b flex">
                    {(["profile", "bookings", "transactions", "payouts", "availability"] as const).map(tab => (
                        <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'availability') fetchAvailability(availDate); }}
                            className={`flex-1 py-4 text-sm font-semibold capitalize transition ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
                            {tab === "profile" && "Profile"}
                            {tab === "bookings" && `Bookings (${bookings.length})`}
                            {tab === "transactions" && `Transactions (${transactions.length})`}
                            {tab === "payouts" && `Payouts (${consultant.payouts?.length || 0})`}
                            {tab === "availability" && "Availability"}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="p-6 grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Consultant Info</h3>
                            {[["ID", `#${consultant.id}`], ["Domain", consultant.domain || "—"], ["Type", consultant.type || "—"], ["Hourly Price", consultant.hourly_price ? `₹${consultant.hourly_price}` : "—"], ["Rating", `${consultant.rating} ⭐ (${consultant.total_reviews} reviews)`], ["Experience", consultant.years_experience ? `${consultant.years_experience} years` : "—"], ["Education", consultant.education || "—"]].map(([label, val]) => (
                                <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800 text-right max-w-xs">{val}</span></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Earning Summary</h3>
                            {[["Total Earned", `₹${payoutSummary.totalEarned.toFixed(2)}`], ["Total Paid Out", `₹${payoutSummary.totalPaid.toFixed(2)}`], ["Outstanding", `₹${payoutSummary.outstanding.toFixed(2)}`], ["Platform Commission", `₹${payoutSummary.totalCommission.toFixed(2)}`], ["Completed Sessions", String(payoutSummary.completedBookings)]].map(([label, val]) => (
                                <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className={`font-bold ${label === "Outstanding" && payoutSummary.outstanding > 0 ? "text-red-600" : "text-gray-800"}`}>{val}</span></div>
                            ))}
                        </div>

                        {/* Commission Settings Panel */}
                        <div className="col-span-2 mt-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">Commission Settings</h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 space-y-4 min-w-[200px]">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-1">Consultant Commission (%)</label>
                                        <input type="number" step="0.1" value={commConsultant} onChange={e => setCommConsultant(e.target.value)} placeholder="e.g. 15" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        <p className="text-xs text-gray-500 mt-1">Deducted from consultant's earnings.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-1">User Markup (%)</label>
                                        <input type="number" step="0.1" value={commUser} onChange={e => setCommUser(e.target.value)} placeholder="e.g. 10" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        <p className="text-xs text-gray-500 mt-1">Added to base price for user to pay.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleSaveCommission} disabled={commLoading} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center gap-2">
                                            {commLoading && <Loader className="h-4 w-4 animate-spin" />} Save Settings
                                        </button>
                                        {commMsg && <span className={`text-sm ${commMsg.includes("Error") ? "text-red-600" : "text-green-600"} font-medium`}>{commMsg}</span>}
                                    </div>
                                </div>
                                <div className="flex-1 bg-white border border-blue-100 rounded-lg p-4 w-full">
                                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Live Preview Math</h4>
                                    {(() => {
                                        const basePrice = consultant.hourly_price || 0;
                                        const cc = parseFloat(commConsultant) || 0;
                                        const uc = parseFloat(commUser) || 0;
                                        const userPays = basePrice * (1 + uc / 100);
                                        const consEarns = basePrice * (1 - cc / 100);
                                        const platKeeps = userPays - consEarns;
                                        if (basePrice === 0) return <p className="text-sm text-gray-500">Consultant hasn't set an hourly price yet.</p>;
                                        return (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                                    <span className="text-gray-500">Base Price (Consultant target)</span><span className="font-semibold text-gray-800 text-right">₹{basePrice.toFixed(0)}/hr</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                                    <span className="text-gray-500">User sees &amp; pays <span className="text-[10px] ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full">+{uc}%</span></span><span className="font-bold text-blue-600 text-right">₹{userPays.toFixed(0)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                                    <span className="text-gray-500">Consultant actually earns <span className="text-[10px] ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full">-{cc}%</span></span><span className="font-bold text-green-600 text-right">₹{consEarns.toFixed(0)}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-1">
                                                    <span className="text-xs font-bold text-gray-700 uppercase">Platform Revenue per hr</span>
                                                    <span className="font-black text-purple-600 text-lg decoration-purple-200 underline underline-offset-4">₹{platKeeps.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bookings Tab */}
                {activeTab === "bookings" && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    {["#", "User", "Date", "Time", "Fee", "Net Earning", "Completed", "Status"].map(h => (
                                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {bookings.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-500">No bookings yet</td></tr> :
                                    bookings.map((b: any) => (
                                        <tr key={b.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm text-gray-400">#{b.id}</td>
                                            <td className="px-5 py-3"><p className="text-sm font-medium">{b.user?.name || "—"}</p><p className="text-xs text-gray-400">{b.user?.email}</p></td>
                                            <td className="px-5 py-3 text-sm text-gray-600"><div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{fmtDate(b.date)}</div></td>
                                            <td className="px-5 py-3 text-sm text-gray-600"><div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-400" />{b.time_slot}</div></td>
                                            <td className="px-5 py-3 text-sm font-semibold">₹{(b.consultant_fee || 0).toFixed(2)}</td>
                                            <td className="px-5 py-3 text-sm font-bold text-blue-600">₹{(b.net_earning || 0).toFixed(2)}</td>
                                            <td className="px-5 py-3">{b.call_completed ? <span className="text-green-600 text-xs font-semibold">✓ Yes</span> : <span className="text-gray-400 text-xs">No</span>}</td>
                                            <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    {["ID", "User", "Type", "Amount", "Date & Time", "Status"].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-500">No transactions</td></tr> :
                                    transactions.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm text-gray-400">#{t.id}</td>
                                            <td className="px-5 py-3"><p className="text-sm font-medium">{t.user?.name || "—"}</p><p className="text-xs text-gray-400">{t.user?.email}</p></td>
                                            <td className="px-5 py-3"><TypeBadge type={t.type} /></td>
                                            <td className="px-5 py-3"><span className={`font-bold text-sm flex items-center gap-1 ${t.type === "EARNING" ? "text-green-600" : "text-red-600"}`}>{t.type === "EARNING" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}₹{t.amount.toFixed(2)}</span></td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{fmt(t.created_at)}</td>
                                            <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Payouts Tab */}
                {activeTab === "payouts" && (
                    <div>
                        <div className="p-4 flex justify-end border-b">
                            <button
                                onClick={() => { setShowPayoutModal(true); setPayoutSuccess(""); setPayoutError(""); }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                            >
                                <Send className="h-4 w-4" /> Record New Payout
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left">
                                        {["Payout #", "Amount", "Status", "Date Paid", "Notes"].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(!consultant.payouts || consultant.payouts.length === 0) ? (
                                        <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-500">No payouts recorded yet</td></tr>
                                    ) : consultant.payouts.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm text-gray-500">#{p.id}</td>
                                            <td className="px-5 py-3 text-lg font-bold text-green-600">₹{p.amount.toFixed(2)}</td>
                                            <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.paid_at ? fmt(p.paid_at) : "—"}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.notes || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* Availability Tab */}
                {activeTab === "availability" && (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <label className="text-sm font-semibold text-gray-600">Select Date:</label>
                            <input
                                type="date" value={availDate}
                                onChange={e => { setAvailDate(e.target.value); fetchAvailability(e.target.value); }}
                                className="border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-500">
                                {availSlots.length} total · {availSlots.filter(s => !s.is_booked).length} free · {availSlots.filter(s => s.is_booked).length} booked
                            </span>
                        </div>
                        {availLoading ? (
                            <div className="flex justify-center py-10"><Loader className="h-7 w-7 animate-spin text-blue-600" /></div>
                        ) : availSlots.length === 0 ? (
                            <div className="py-12 text-center">
                                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400">No availability slots set for this date</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {availSlots.map((slot: any) => {
                                    const startH = parseInt(slot.available_time);
                                    const endHH = String(startH + 1).padStart(2, '0');
                                    return (
                                        <div key={slot.id} className={`rounded-xl border-2 p-4 ${slot.is_booked ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                                            }`}>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full block mb-2 text-center ${slot.is_booked ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {slot.is_booked ? '🔵 Booked' : '🟢 Free'}
                                            </span>
                                            <p className="text-center font-black text-gray-800 text-sm">{slot.available_time}</p>
                                            <p className="text-center text-xs text-gray-500">to {endHH}:00</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultantDetailPage;
