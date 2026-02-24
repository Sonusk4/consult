import React from "react";
import Layout from "../../../components/Layout";
import { useAuth } from "../../../App";

const MemberProfile: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading profile...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="p-8 text-red-500">User not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* 🔹 Header Section */}
          <div className="bg-gray-100 p-6 flex items-center gap-6">
            <img
              src={user.profile_photo || "https://via.placeholder.com/120"}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border"
            />
            <div>
              <h2 className="text-2xl font-bold">{user.name || "Your Name"}</h2>
              <p className="text-gray-600">
                {user.designation || "Enterprise Consultant"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {user.enterprise_name && `Part of ${user.enterprise_name}`}
              </p>

              <div className="mt-2">
                {user.is_verified ? (
                  <span className="text-green-600 font-medium">
                    Verified Consultant ✅
                  </span>
                ) : (
                  <span className="text-red-500 font-medium">
                    Not Verified ❌
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 🔹 Profile Details */}
          <div className="p-6 space-y-6">

            {/* About */}
            <div>
              <h3 className="font-semibold text-lg mb-2">About</h3>
              <p className="text-gray-700">
                {user.bio || "Add your professional bio here."}
              </p>
            </div>

            {/* Expertise */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {user.expertise?.length > 0 ? (
                  user.expertise.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No expertise added yet.
                  </p>
                )}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Availability</h3>
              <p className="text-gray-700">
                {user.availability || "Set your availability schedule."}
              </p>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Session Pricing</h3>
              <p className="text-gray-700">
                {user.pricing
                  ? `₹${user.pricing} per session`
                  : "Pricing managed by enterprise"}
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Contact</h3>
              <p className="text-gray-700">{user.email}</p>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MemberProfile;