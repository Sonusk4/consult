import React from "react";

export default function UserPlans() {
  const plans = [
    {
      name: "Free",
      color: "gray",
      maxConsultants: "3",
      messages: "5",
      bookings: "Unlimited",
      duration: "Up to 30 mins",
      discount: "0%",
      walletBonus: "Nil",
      loyalty: "No",
      reschedule: "No",
      cancellation: "Strict",
      popular: false,
    },
    {
      name: "Starter",
      color: "blue",
      maxConsultants: "10",
      messages: "20",
      bookings: "Unlimited",
      duration: "Up to 60 mins",
      discount: "10%",
      walletBonus: "2% (cap ₹200)",
      loyalty: "1%",
      reschedule: "1 per month",
      cancellation: "Strict",
      popular: true,
    },
    {
      name: "Growth",
      color: "green",
      maxConsultants: "25",
      messages: "50",
      bookings: "Unlimited",
      duration: "Up to 60 mins",
      discount: "15%",
      walletBonus: "5% (cap ₹500)",
      loyalty: "3%",
      reschedule: "2 per month",
      cancellation: "Moderate",
      popular: true,
    },
    {
      name: "Enterprise",
      color: "purple",
      maxConsultants: "50",
      messages: "100",
      bookings: "Unlimited",
      duration: "Up to 120 mins",
      discount: "50%",
      walletBonus: "10% (cap ₹1500)",
      loyalty: "7%",
      reschedule: "5 per month",
      cancellation: "Flexible",
      popular: false,
    },
  ];

  const features = [
    { key: "maxConsultants", label: "Max Consultants Chat Access" },
    { key: "messages", label: "Total Chat Messages / Month" },
    { key: "bookings", label: "Bookings / Month" },
    { key: "duration", label: "Booking Duration Access" },
    { key: "discount", label: "Platform Fee Discount" },
    { key: "walletBonus", label: "Wallet Bonus on Recharge" },
    { key: "loyalty", label: "Loyalty Points" },
    { key: "reschedule", label: "Free Reschedule" },
    { key: "cancellation", label: "Cancellation Flexibility" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-black mb-10 text-gray-900 text-center">
        Compare Subscription Plans
      </h1>

      <div className="overflow-x-auto border rounded-2xl shadow-lg">
        <table className="min-w-full bg-white text-center">
          <thead>
            <tr>
              <th className="p-6 text-left text-gray-700 font-bold text-lg">
                Features
              </th>
              {plans.map((plan, index) => (
                <th key={index} className="p-6">
                  <div className="flex flex-col items-center">
                    {plan.popular && (
                      <span className="px-3 py-1 text-xs bg-yellow-300 text-yellow-900 rounded-full font-bold mb-2">
                        POPULAR
                      </span>
                    )}
                    <span
                      className={`text-2xl font-black capitalize text-${plan.color}-600`}
                    >
                      {plan.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {features.map((feature) => (
              <tr
                key={feature.key}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-4 text-left font-bold text-gray-700">
                  {feature.label}
                </td>

                {plans.map((plan, index) => (
                  <td key={index} className="p-4 text-gray-900 font-medium">
                    {plan[feature.key]}
                  </td>
                ))}
              </tr>
            ))}

            {/* Choose Plan Buttons */}
            <tr className="border-t bg-gray-50">
              <td></td>
              {plans.map((plan, index) => (
                <td key={index} className="p-6">
                  <button
                    className={`px-4 py-2 font-bold rounded-lg text-white bg-${plan.color}-600 hover:bg-${plan.color}-700 transition`}
                  >
                    Choose {plan.name}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}