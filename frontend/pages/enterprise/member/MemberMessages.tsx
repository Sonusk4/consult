import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import api from "../../../services/api";
import { useAuth } from "../../../App";

interface Message {
  id: number;
  sender_email: string;
  content: string;
  created_at: string;
}

const MemberMessages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get("/messages/member");

        console.log("Messages API response:", response.data);

        // 🔥 Ensure we always store an array
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        } else if (Array.isArray(response.data.messages)) {
          setMessages(response.data.messages);
        } else if (Array.isArray(response.data.data)) {
          setMessages(response.data.data);
        } else {
          setMessages([]);
        }

      } catch (error) {
        console.error("Failed to fetch messages", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {loading ? (
          <p className="text-gray-500">Loading messages...</p>
        ) : !Array.isArray(messages) || messages.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow">
            <p>No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwnMessage = msg.sender_email === user?.email;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-md p-4 rounded-xl shadow ${
                      isOwnMessage
                        ? "bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1">
                        {msg.sender_email}
                      </p>
                    )}

                    <p>{msg.content}</p>

                    <p
                      className={`text-xs mt-2 ${
                        isOwnMessage
                          ? "text-blue-100"
                          : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MemberMessages;