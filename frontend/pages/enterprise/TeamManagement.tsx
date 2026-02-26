import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { Users, Plus, Trash2, Loader, Copy, CheckCircle } from "lucide-react";

interface TeamMember {
  id: number;
  name?: string;
  email: string;
  status?: string;
  totalEarnings?: number;
  sessionsCompleted?: number;
  lastSessionAt?: string | null;
  rating?: number;
  totalReviews?: number;
}

interface Credentials {
  username: string;
  password: string;
  email: string;
  inviteLink: string;
}

const TeamManagement: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /* ================= FETCH TEAM ================= */
  const fetchTeam = async (options?: { silent?: boolean }) => {
    try {
      setLoading(true);
      // Add cache-busting parameter to force fresh data
      const res = await api.get("/enterprise/team", {
        params: { _t: Date.now() }
      });

      // Ensure always array
      const safeData = Array.isArray(res.data) ? res.data : [];
      setTeam(safeData);
      setError("");
      console.log("✓ Team fetched:", safeData);
    } catch (err: any) {
      console.error("Fetch team failed:", err);
      if (!options?.silent && team.length === 0) {
        setError("Failed to load team members.");
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTeam();
    
    // Set up auto-refresh polling every 10 seconds
    const pollInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing team list...");
      fetchTeam();
    }, 10000);

    // Also refresh when page becomes visible (tab switched back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("📄 Page became visible, refreshing team...");
        fetchTeam();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /* ================= COPY TO CLIPBOARD ================= */
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /* ================= INVITE MEMBER ================= */
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setInviting(true);
      setError("");
      const res = await api.post("/enterprise/invite", {
        email: inviteEmail,
        name: inviteName || undefined
      });

      // Show credentials modal
      const inviteLink = `${window.location.origin}/#/invite/${res.data.invite_token}`;
      setCredentials({
        username: res.data.member.username,
        password: "Check email for temporary password",
        email: res.data.member.email,
        inviteLink
      });

      setShowCredentialsModal(true);
      setInviteEmail("");
      setInviteName("");
      setShowInviteModal(false);
      
      // Refresh team list
      setTimeout(() => fetchTeam(), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  /* ================= REMOVE MEMBER ================= */
  const handleRemove = async (id: number) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      await api.delete(`/enterprise/team/${id}`);
      setTeam((prev) => prev.filter((member) => member.id !== id));
      fetchTeam({ silent: true });
    } catch (err: any) {
      console.error("Remove failed:", err);
      alert("Failed to remove member");
    }
  };

  const handleAssignSession = (member: TeamMember) => {
    alert(`Assign Session: ${member.name || member.email}`);
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <Layout title="Team Management">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Team Management">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold">Enterprise Team</h1>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={18} /> Add Member
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* TEAM LIST */}
        <div className="bg-white rounded-3xl shadow border">
          {team.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No team members yet.
            </div>
          ) : (
            <div className="divide-y">
              <div className="grid grid-cols-5 gap-4 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Member</span>
                <span>Status</span>
                <span>Earnings</span>
                <span>Performance</span>
                <span className="text-right">Actions</span>
              </div>

              {team.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-5 gap-4 px-6 py-5 items-center"
                >
                  <div>
                    <h3 className="font-bold">
                      {member.name || "Unnamed Member"}
                    </h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>

                  <div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      member.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : member.status === "Inactive"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {member.status || "Pending Invitation"}
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold">₹{(member.totalEarnings || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {member.sessionsCompleted || 0} sessions
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {member.rating ? `${member.rating.toFixed(1)}★` : "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.totalReviews ? `${member.totalReviews} reviews` : "No reviews"}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleAssignSession(member)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm"
                    >
                      Assign Session
                    </button>
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INVITE MODAL */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md space-y-5">
              <h2 className="text-xl font-bold">Invite Team Member</h2>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200">
                  {error}
                </div>
              )}

              <input
                type="email"
                placeholder="Email address"
                className="w-full border rounded-xl px-4 py-3"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />

              <input
                type="text"
                placeholder="Full name (optional)"
                className="w-full border rounded-xl px-4 py-3"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREDENTIALS MODAL */}
        {showCredentialsModal && credentials && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl w-full max-w-lg space-y-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-600" size={28} />
                <h2 className="text-2xl font-bold">Invitation Sent! 🎉</h2>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-blue-900">
                  A confirmation email has been sent to <strong>{credentials.email}</strong> with the credentials below.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={credentials.username}
                      readOnly
                      className="flex-1 bg-gray-50 border rounded-lg px-4 py-2 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(credentials.username, "username")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                    >
                      {copiedField === "username" ? (
                        <>
                          <CheckCircle size={16} className="text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={credentials.email}
                      readOnly
                      className="flex-1 bg-gray-50 border rounded-lg px-4 py-2 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(credentials.email, "email")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                    >
                      {copiedField === "email" ? (
                        <>
                          <CheckCircle size={16} className="text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Temporary Password
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-yellow-900">
                      Check the email sent to <strong>{credentials.email}</strong> for the temporary password.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  💡 <strong>Tip:</strong> Share the username and ask them to check their email for the password. 
                  They can change the password after their first login.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentials(null);
                }}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default TeamManagement;