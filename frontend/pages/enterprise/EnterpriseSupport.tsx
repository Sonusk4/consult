import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { HelpCircle, Ticket, Send, Clock, Building2 } from "lucide-react";

const EnterpriseSupport: React.FC = () => {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    subject: "",
    category: "Enterprise Technical Issue",
    description: "",
  });

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH TICKETS ================= */
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/support");

      if (Array.isArray(res.data)) {
        setTickets(res.data);
      } else if (Array.isArray(res.data.tickets)) {
        setTickets(res.data.tickets);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error("Failed to fetch tickets");
      setTickets([]);
    }
  };

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT TICKET ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.description) {
      addToast("Please fill all required fields", "error");
      return;
    }

    setLoading(true);

    try {
      await api.post("/support", {
        ...formData,
        type: "ENTERPRISE",
      });

      addToast("Enterprise support ticket submitted!", "success");

      setFormData({
        subject: "",
        category: "Enterprise Technical Issue",
        description: "",
      });

      fetchTickets();
    } catch (err) {
      addToast("Failed to submit ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Enterprise Support Center">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ================= HEADER ================= */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="text-blue-600" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Enterprise Support
          </h2>
          <p className="mt-2 text-gray-500">
            Dedicated support for enterprise accounts and team management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ================= OPEN TICKET ================= */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
            <div className="flex items-center gap-3">
              <Ticket className="text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Open Enterprise Ticket
              </h3>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <input
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                type="text"
                placeholder="Brief summary of your issue"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>Enterprise Technical Issue</option>
                <option>Enterprise Billing & Payout</option>
                <option>Team Management Issue</option>
                <option>Session Assignment Issue</option>
                <option>Enterprise Verification</option>
                <option>Other</option>
              </select>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide detailed information about the issue..."
                className="w-full px-4 py-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                <Send size={16} />
                {loading ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </div>

          {/* ================= ENTERPRISE TICKETS ================= */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              Enterprise Tickets
            </h3>

            {tickets.length === 0 && (
              <p className="text-gray-400 text-sm">
                No enterprise support tickets yet.
              </p>
            )}

            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 border rounded-2xl hover:shadow-sm transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">
                      {ticket.subject}
                    </h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ticket.status === "CLOSED"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{ticket.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default EnterpriseSupport;
