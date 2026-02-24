import React, { useState } from "react";
import Layout from "../../components/Layout";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  CheckCheck,
} from "lucide-react";

const ENTERPRISE_CONTACTS = [
  {
    id: 1,
    name: "John Carter (Client)",
    lastMsg: "We need to finalize the contract.",
    time: "10:30 AM",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Emma Watson (Client)",
    lastMsg: "Thanks for the consultation!",
    time: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Internal Team - Finance",
    lastMsg: "Revenue report updated.",
    time: "Monday",
    unread: 1,
    online: true,
  },
];

const EnterpriseMessages: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState(
    ENTERPRISE_CONTACTS[0]
  );

  return (
    <Layout title="Enterprise Messages">
      <div className="max-w-7xl mx-auto h-[calc(100vh-12rem)] flex bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">

        {/* ================= SIDEBAR ================= */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {ENTERPRISE_CONTACTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className={`w-full p-6 flex items-start space-x-4 border-b border-gray-50 transition ${
                  selectedContact.id === c.id
                    ? "bg-blue-50/50"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                    {c.name[0]}
                  </div>
                  {c.online && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-gray-900 truncate">
                      {c.name}
                    </p>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {c.time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">
                      {c.lastMsg}
                    </p>

                    {c.unread > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0 ml-2">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================= CHAT AREA ================= */}
        <div className="flex-1 flex flex-col bg-gray-50/30">

          {/* Header */}
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                {selectedContact.name[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {selectedContact.name}
                </p>
                <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">
                  {selectedContact.online ? "Online Now" : "Away"}
                </p>
              </div>
            </div>

            <button className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 transition">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex justify-center">
              <span className="bg-white border px-3 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Today
              </span>
            </div>

            {/* Client Message */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-lg bg-gray-100"></div>
              <div className="max-w-md bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border">
                <p className="text-sm text-gray-700">
                  Hello, can we discuss the enterprise billing process?
                </p>
                <p className="text-[10px] text-gray-400 mt-2 text-right">
                  10:20 AM
                </p>
              </div>
            </div>

            {/* Enterprise Reply */}
            <div className="flex items-start flex-row-reverse space-x-4 space-x-reverse">
              <div className="w-8 h-8 rounded-lg bg-blue-600"></div>
              <div className="max-w-md bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg">
                <p className="text-sm">
                  Yes, absolutely. We can review it in detail during today's session.
                </p>
                <div className="flex items-center justify-end space-x-1 mt-2">
                  <p className="text-[10px] text-blue-200">10:25 AM</p>
                  <CheckCheck size={12} className="text-blue-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                <Paperclip size={20} />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm outline-none"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500">
                  <Smile size={20} />
                </button>
              </div>

              <button className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnterpriseMessages;
