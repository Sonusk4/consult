import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { Users, Plus, Trash2, Loader, Copy, CheckCircle, Pencil, Eye } from "lucide-react";

interface TeamMember {
  id: number;
  name?: string;
  email: string;
  status?: string;
  is_verified?: boolean;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [showMemberCredentialsModal, setShowMemberCredentialsModal] = useState(false);
  const [selectedMemberCredentials, setSelectedMemberCredentials] = useState<any>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

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
      console.log("📤 Sending invite request with:", { email: inviteEmail, name: inviteName });
      
      const res = await api.post("/enterprise/invite", {
        email: inviteEmail,
        name: inviteName || undefined
      });

      console.log("✅ Invite response:", res.data);
      console.log("🔑 Invite token:", res.data.invite_token);

      // Show credentials modal
      const inviteLink = `${window.location.origin}/#/enterprise/invite/${res.data.invite_token || 'token'}`;
      console.log("🔗 Invite link:", inviteLink);
      
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
      console.error("❌ Invite error:", err);
      console.error("Response data:", err.response?.data);
      console.error("Status:", err.response?.status);
      setError(err.response?.data?.error || err.message || "Failed to send invite");
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

  /* ================= EDIT MEMBER ================= */
  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.name || "");
    setEditEmail(member.email || "");
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editingMember) return;
    if (!editEmail.trim()) {
      setEditError("Email is required");
      return;
    }

    try {
      setSavingEdit(true);
      setEditError("");
      await api.patch(`/enterprise/team/${editingMember.id}`, {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      setShowEditModal(false);
      setEditingMember(null);
      fetchTeam();
    } catch (err: any) {
      console.error("Edit member failed:", err);
      setEditError(err.response?.data?.error || "Failed to update member");
    } finally {
      setSavingEdit(false);
    }
  };

  /* ================= VIEW MEMBER CREDENTIALS ================= */
  const viewMemberCredentials = async (member: TeamMember) => {
    try {
      setLoadingCredentials(true);
      const res = await api.get(`/enterprise/team/${member.id}/credentials`);
      setSelectedMemberCredentials(res.data);
      setShowMemberCredentialsModal(true);
    } catch (err: any) {
      console.error("Failed to fetch credentials:", err);
      alert("Failed to load member credentials");
    } finally {
      setLoadingCredentials(false);
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

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => viewMemberCredentials(member)}
                    className="px-4 py-2 bg-green-100 text-green-600 rounded-xl flex items-center gap-2"
                    title="View username and password"
                  >
                    <Eye size={16} /> View
                  </button>
                  <button
                    onClick={() => openEditModal(member)}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl flex items-center gap-2"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
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

        {/* EDIT MEMBER MODAL */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md space-y-5">
              <h2 className="text-xl font-bold">Edit Team Member</h2>

              {editError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200">
                  {editError}
                </div>
              )}

              <input
                type="text"
                placeholder="Full name"
                className="w-full border rounded-xl px-4 py-3"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email address"
                className="w-full border rounded-xl px-4 py-3"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setEditError("");
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={handleEditSave}
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MEMBER CREDENTIALS MODAL */}
        {showMemberCredentialsModal && selectedMemberCredentials && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl w-full max-w-lg space-y-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-600" size={28} />
                <h2 className="text-2xl font-bold">Member Credentials</h2>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  Member: <strong>{selectedMemberCredentials.name || selectedMemberCredentials.email}</strong>
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
                      value={selectedMemberCredentials.username || "N/A"}
                      readOnly
                      className="flex-1 bg-gray-50 border rounded-lg px-4 py-2 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMemberCredentials.username || "");
                        setCopiedField("username");
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
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
                    Password
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedMemberCredentials.password || "N/A"}
                      readOnly
                      className="flex-1 bg-gray-50 border rounded-lg px-4 py-2 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMemberCredentials.password || "");
                        setCopiedField("password");
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                    >
                      {copiedField === "password" ? (
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
              </div>

              <button
                onClick={() => {
                  setShowMemberCredentialsModal(false);
                  setSelectedMemberCredentials(null);
                }}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamManagement;