import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { Users, Plus, Trash2, Loader, Copy, CheckCircle } from "lucide-react";

interface TeamMember {
  id: number;
  name?: string;
  email: string;
  status?: string;
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
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get("/enterprise/team");

      // Ensure always array
      const safeData = Array.isArray(res.data) ? res.data : [];
      setTeam(safeData);
      setError("");
    } catch (err: any) {
      console.error("Fetch team failed:", err);
      setTeam([]);
      setError("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
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
      const inviteLink = `${window.location.origin}/invite/${res.data.invite_token || 'token'}`;
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
      fetchTeam();
    } catch (err: any) {
      console.error("Remove failed:", err);
      alert("Failed to remove member");
    }
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
            <Plus size={18} /> Invite Consultant
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
            team.map((member) => (
              <div
                key={member.id}
                className="border-b p-6 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">
                    {member.name || "Unnamed Member"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {member.email}
                  </p>
                  {member.status && (
                    <span className="text-xs font-semibold text-blue-600">
                      {member.status}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleRemove(member.id)}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-xl flex items-center gap-2"
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            ))
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