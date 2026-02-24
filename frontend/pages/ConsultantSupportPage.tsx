import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { HelpCircle, Ticket, Send, Clock } from "lucide-react";

/* ================= TYPES ================= */

interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  created_at: string;
  updated_at: string;
}

/* ================= COMPONENT ================= */

const ConsultantSupportPage: React.FC = () => {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    subject: "",
    category: "Technical Issue",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  });

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  /* ================= FETCH TICKETS (ROBUST) ================= */

  const fetchTickets = async () => {
    try {
      setFetching(true);

      const res = await api.get("/consultant/support-tickets");
      console.log("API tickets response:", res.data);

      const extractedTickets =
        res.data?.tickets ||
        res.data?.data?.tickets ||
        (Array.isArray(res.data) ? res.data : []);

      setTickets(extractedTickets);
    } catch (error) {
      console.error(error);
      addToast("Failed to fetch tickets", "error");
      setTickets([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  /* ================= HANDLE INPUT ================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT (ROBUST) ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.description) {
      addToast("Please fill all required fields", "error");
      return;
    }

    try {
      setLoading(true);

      await api.post("/consultant/support-tickets", formData);

      addToast("Support ticket submitted successfully!", "success");

      setFormData({
        subject: "",
        category: "Technical Issue",
        description: "",
        priority: "MEDIUM",
      });

      fetchTickets();
    } catch (error) {
      console.error(error);
      addToast("Failed to submit ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STATUS BADGE ================= */

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-100 text-yellow-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "CLOSED":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  /* ================= RENDER ================= */

  return (
    <Layout title="Consultant Support Center">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* HEADER */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <HelpCircle className="text-blue-600" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Consultant Support Center</h2>
          <p className="mt-2 text-gray-500">Facing any issue? Open a support ticket below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* OPEN TICKET FORM */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
            <div className="flex items-center gap-3">
              <Ticket className="text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Open New Ticket</h3>
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
                <option>Technical Issue</option>
                <option>Billing & Payment</option>
                <option>Session Related</option>
                <option>Wallet Issue</option>
                <option>Other</option>
              </select>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your issue in detail..."
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

          {/* TICKETS LIST */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Your Tickets</h3>

            {fetching ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : tickets.length === 0 ? (
              <p className="text-gray-400 text-sm">No support tickets yet.</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-5 border rounded-2xl hover:shadow-sm transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">{ticket.subject}</h4>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>

                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{ticket.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultantSupportPage;
