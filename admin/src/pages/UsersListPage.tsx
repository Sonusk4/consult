import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Users, Search, ChevronRight, Loader, Wallet, Calendar } from "lucide-react";

const UsersListPage: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        let result = users;
        if (search) result = result.filter(u => (u.name || "").toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
        if (roleFilter) result = result.filter(u => u.role === roleFilter);
        setFiltered(result);
    }, [search, roleFilter, users]);

    const fetchUsers = async () => {
        try {
            const data = await api.get("/admin/users");
            setUsers(data.data);
            setFiltered(data.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    const roleBadge = (role: string) => {
        const styles: Record<string, string> = {
            USER: "bg-blue-100 text-blue-700",
            CONSULTANT: "bg-green-100 text-green-700",
            ENTERPRISE_ADMIN: "bg-purple-100 text-purple-700",
            ENTERPRISE_MEMBER: "bg-indigo-100 text-indigo-700",
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[role] || "bg-gray-100 text-gray-700"}`}>{role}</span>;
    };

    return (
        <div className="page-container">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition text-sm">← Back</button>
                <div>
                    <h1 className="page-title flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" />All Users</h1>
                    <p className="page-subtitle">{users.length} users registered on the platform</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border rounded-xl p-4 mb-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 flex items-center gap-2 border rounded-lg px-3 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm outline-none" />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Roles</option>
                    <option value="USER">User</option>
                    <option value="CONSULTANT">Consultant</option>
                    <option value="ENTERPRISE_ADMIN">Enterprise Admin</option>
                    <option value="ENTERPRISE_MEMBER">Enterprise Member</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50 text-left">
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Wallet Balance</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Bookings</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">No users found</td></tr>
                            ) : filtered.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/users/${user.id}`)}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                                                {(user.name || user.email || "?")[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name || "—"}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">{roleBadge(user.role)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                            <Wallet className="h-3.5 w-3.5 text-gray-400" />
                                            ₹{(user.wallet?.balance || 0).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            {user._count?.bookings || 0}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                    </td>
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

export default UsersListPage;
