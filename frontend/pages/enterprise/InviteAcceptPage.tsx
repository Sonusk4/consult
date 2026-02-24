import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const InviteAcceptPage: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/enterprise/invite/${token}`);
        setValid(true);
      } catch {
        setValid(false);
      }
    };
    verify();
  }, [token]);

  const acceptInvite = async () => {
    await api.post("/enterprise/accept-invite", { token });
    navigate("/consultant/dashboard");
  };

  if (valid === null) return <div className="p-10">Checking invite...</div>;
  if (!valid) return <div className="p-10 text-red-500">Invalid or expired invite.</div>;

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center space-y-6">
        <h1 className="text-2xl font-bold">You’ve Been Invited 🎉</h1>
        <button
          onClick={acceptInvite}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          Accept Invite
        </button>
      </div>
    </div>
  );
};

export default InviteAcceptPage;