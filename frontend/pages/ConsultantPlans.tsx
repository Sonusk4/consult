import React, { useState } from "react";
import Layout from "../components/Layout";
import { Crown, X } from "lucide-react";

const BASE_PLATFORM_FEE = 20;
const Row = ({ label, value }: any) => (
  <div className="flex justify-between border-b pb-2">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);
const plans = [
  {
    name: "Free",
    reduction: 0,
    ranking: "Low",
    chat: "5 / Month",
    badge: "No Badge",
    placement: "No",
    payout: "T+7",
    manager: "No",
    highlight: false,
  },
  {
    name: "Professional",
    reduction: 2,
    ranking: "Medium",
    chat: "20 / Month",
    badge: "Verified Badge",
    placement: "Category Page",
    payout: "T+5",
    manager: "No",
    highlight: false,
  },
  {
    name: "Premium",
    reduction: 5,
    ranking: "High",
    chat: "50 / Month",
    badge: "Trusted Badge",
    placement: "Weekly Feature",
    payout: "T+3",
    manager: "No",
    highlight: true,
  },
  {
    name: "Elite",
    reduction: 10,
    ranking: "Top Priority",
    chat: "Unlimited",
    badge: "Elite Badge",
    placement: "Homepage Rotation",
    payout: "Instant",
    manager: "Yes",
    highlight: false,
  },
];

const ConsultantPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  return (
    <Layout title="Subscription Plans">
      <div className="max-w-7xl mx-auto py-10">

        <h1 className="text-3xl font-bold text-center mb-10">
          Consultant Subscription Plans
        </h1>

        {/* ================= PLAN CARDS ================= */}
        <div className="grid md:grid-cols-4 gap-6">
  {plans.map((plan) => {
    const finalFee = BASE_PLATFORM_FEE - plan.reduction;

    return (
      <div
        key={plan.name}
        className={`p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:scale-105
        ${plan.highlight ? "border-blue-600 shadow-md" : "border-gray-200"}`}
      >
        {plan.highlight && (
          <div className="text-center mb-4">
            <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>
        )}

        <h2 className="text-xl font-bold text-center mb-6">
          {plan.name}
        </h2>

        <div className="space-y-3 text-sm">

          <Row label="Search Ranking" value={plan.ranking} />
          <Row label="Inbound Chat Limit" value={plan.chat} />
          <Row label="Badge" value={plan.badge} />
          <Row label="Featured Placement" value={plan.placement} />
          <Row label="Platform Fee Reduction" value={`${plan.reduction}%`} />
          <Row label="Payout Frequency" value={plan.payout} />
          <Row label="Dedicated Manager" value={plan.manager} />

        </div>

        <button
          onClick={() => setSelectedPlan(plan)}
          className={`mt-6 w-full py-3 rounded-xl font-semibold transition
          ${
            plan.highlight
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "border border-gray-300 hover:bg-gray-100"
          }`}
        >
          Choose Plan
        </button>
      </div>
    );
  })}
</div>

        {/* ================= MODAL ================= */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-[750px] max-h-[90vh] overflow-y-auto rounded-3xl p-8 relative">

              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4"
              >
                <X />
              </button>

              <h2 className="text-2xl font-bold mb-6">
                {selectedPlan.name} Plan - Full Details
              </h2>

              <div className="space-y-6 text-sm">

                <Detail
                  title="Search Ranking"
                  description={`Your profile visibility level is "${selectedPlan.ranking}". Higher ranking increases exposure to potential clients.`}
                />

                <Detail
                  title="Inbound Chat Limit"
                  description={`You can receive ${selectedPlan.chat} inbound chat requests from clients per month.`}
                />

                <Detail
                  title="Badge"
                  description={`"${selectedPlan.badge}" will appear on your profile to improve credibility and trust.`}
                />

                <Detail
                  title="Featured Placement"
                  description={`Placement level: ${selectedPlan.placement}. Featured placement increases homepage/category visibility.`}
                />

                <Detail
                  title="Platform Fee Structure"
                  description={`Base platform fee is fixed at ${BASE_PLATFORM_FEE}%.
This plan provides a ${selectedPlan.reduction}% reduction.
Final platform fee = ${BASE_PLATFORM_FEE - selectedPlan.reduction}%.
${
  selectedPlan.reduction === 0
    ? "Free plan does not include fee reduction."
    : "Higher plans reduce platform commission."
}`}
                />

                <Detail
                  title="Payout Frequency"
                  description={`${selectedPlan.payout} means ${getPayoutExplanation(
                    selectedPlan.payout
                  )}. Faster payout improves liquidity.`}
                />

                <Detail
                  title="Dedicated Account Manager"
                  description={
                    selectedPlan.manager === "Yes"
                      ? "You receive a dedicated account manager for growth support and optimization."
                      : "No dedicated account manager included."
                  }
                />

                <Detail
                  title="Analytics Access (V2.0)"
                  description="Advanced analytics dashboard including booking trends, revenue breakdown and engagement insights. (Upcoming V2.0 Feature)"
                />

                <Detail
                  title="Lead Matching Priority (V2.0)"
                  description="AI-based priority matching with high-value enterprise leads. (Upcoming V2.0 Feature)"
                />

                <Detail
                  title="Case Study Publishing (V2.0)"
                  description="Ability to publish professional case studies to enhance credibility and visibility. (Upcoming V2.0 Feature)"
                />

                <Detail
                  title="Custom Pricing Packages"
                  description="Create bundled pricing packages beyond standard hourly billing."
                />

              </div>

              <button className="mt-8 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                Buy Now
              </button>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

const Detail = ({ title, description }: any) => (
  <div className="border rounded-xl p-4 bg-gray-50">
    <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
    <p className="text-gray-600 whitespace-pre-line">{description}</p>
  </div>
);

const getPayoutExplanation = (payout: string) => {
  if (payout === "T+7") return "paid after 7 days from session completion";
  if (payout === "T+5") return "paid after 5 days from session completion";
  if (payout === "T+3") return "paid after 3 days from session completion";
  if (payout === "Instant") return "paid instantly after session completion";
  return "";
};

export default ConsultantPlans;