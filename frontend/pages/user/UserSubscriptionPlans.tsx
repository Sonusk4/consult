import React from 'react';
import Layout from '../../components/Layout';
import { Check, X, Crown, Zap, Shield, Trophy } from 'lucide-react';
import { subscriptions } from '../../services/api';
import { useToast } from '../../components/ui/use-toast';

export default function UserSubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!selectedPlan || selectedPlan.name === 'Enterprise') return;
    setLoading(true);
    try {
      await subscriptions.subscribeUser(selectedPlan.name);
      toast({
        title: "Success",
        description: `Successfully subscribed to ${selectedPlan.name} plan!`,
      });
      setSelectedPlan(null);
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Perfect for getting started',
      color: 'gray',
      icon: <Shield size={24} />,
      popular: false,
      features: [
        { text: 'Max Consultants Chat Access', value: '3', available: true },
        { text: 'Total Chat Messages / Month', value: '5', available: true },
        { text: 'Bookings / Month', value: 'Unlimited', available: true },
        { text: 'Booking Duration Access', value: 'Up to 30 mins', available: true },
        { text: 'Platform Fee Discount', value: '0%', available: true },
        { text: 'Wallet Bonus on Recharge', value: 'Nil', available: true },
        { text: 'Loyalty Points', value: 'No', available: true },
        { text: 'Free Reschedule', value: 'No', available: true },
        { text: 'Cancellation Flexibility', value: 'Strict', available: true },
      ]
    },
    {
      name: 'Starter',
      price: '₹499/mo',
      description: 'For individual professionals',
      color: 'blue',
      icon: <Zap size={24} />,
      popular: true,
      features: [
        { text: 'Max Consultants Chat Access', value: '10', available: true },
        { text: 'Total Chat Messages / Month', value: '20', available: true },
        { text: 'Bookings / Month', value: 'Unlimited', available: true },
        { text: 'Booking Duration Access', value: 'Up to 60 mins', available: true },
        { text: 'Platform Fee Discount', value: '10%', available: true },
        { text: 'Wallet Bonus on Recharge', value: '2% (cap ₹200)', available: true },
        { text: 'Loyalty Points', value: '1%', available: true },
        { text: 'Free Reschedule', value: '1 per month', available: true },
        { text: 'Cancellation Flexibility', value: 'Strict', available: true },
      ]
    },
    {
      name: 'Growth',
      price: '₹999/mo',
      description: 'For growing teams',
      color: 'green',
      icon: <Trophy size={24} />,
      popular: false,
      features: [
        { text: 'Max Consultants Chat Access', value: '25', available: true },
        { text: 'Total Chat Messages / Month', value: '50', available: true },
        { text: 'Bookings / Month', value: 'Unlimited', available: true },
        { text: 'Booking Duration Access', value: 'Up to 60 mins', available: true },
        { text: 'Platform Fee Discount', value: '15%', available: true },
        { text: 'Wallet Bonus on Recharge', value: '5% (cap ₹500)', available: true },
        { text: 'Loyalty Points', value: '3%', available: true },
        { text: 'Free Reschedule', value: '2 per month', available: true },
        { text: 'Cancellation Flexibility', value: 'Moderate', available: true },
      ]
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      color: 'purple',
      icon: <Crown size={24} />,
      popular: false,
      features: [
        { text: 'Max Consultants Chat Access', value: '50', available: true },
        { text: 'Total Chat Messages / Month', value: '100', available: true },
        { text: 'Bookings / Month', value: 'Unlimited', available: true },
        { text: 'Booking Duration Access', value: 'Up to 120 mins', available: true },
        { text: 'Platform Fee Discount', value: '50%', available: true },
        { text: 'Wallet Bonus on Recharge', value: '10% (cap ₹1500)', available: true },
        { text: 'Loyalty Points', value: '7%', available: true },
        { text: 'Free Reschedule', value: '5 per month', available: true },
        { text: 'Cancellation Flexibility', value: 'Flexible', available: true },
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: any = {
      gray: {
        border: 'border-gray-200',
        bg: 'bg-white',
        title: 'text-gray-700',
        price: 'text-gray-900',
        button: 'bg-gray-600 hover:bg-gray-700',
      },
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        title: 'text-blue-700',
        price: 'text-blue-900',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
      green: {
        border: 'border-green-200',
        bg: 'bg-green-50',
        title: 'text-green-700',
        price: 'text-green-900',
        button: 'bg-green-600 hover:bg-green-700',
      },
      purple: {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        title: 'text-purple-700',
        price: 'text-purple-900',
        button: 'bg-purple-600 hover:bg-purple-700',
      }
    };
    return colors[color];
  };

  return (
    <Layout title="Subscription Plans">

      {/* ========= SIMPLE CARDS VIEW ========= */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your consulting needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan: any, index: number) => {
            const colors = getColorClasses(plan.color);

            return (
              <div
                key={index}
                className={`relative rounded-3xl border-2 ${colors.border} ${colors.bg} p-8 hover:shadow-2xl hover:-translate-y-2 transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOSTPOPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow mb-4">
                    <div className={colors.title}>{plan.icon}</div>
                  </div>

                  <h3 className={`text-2xl font-bold ${colors.title} mb-1`}>{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{plan.description}</p>

                  <div className={`text-4xl font-bold ${colors.price}`}>{plan.price}</div>
                  <p className="text-gray-500 text-sm">per month</p>
                </div>

                {/* Only ONE button here */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className={`px-6 py-3 rounded-xl font-semibold text-white ${colors.button}`}
                  >
                    View Plans
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========= WALLET RECHARGE BONUS STRUCTURE ========= */}
      <div className="max-w-7xl mx-auto p-6 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Wallet Recharge Bonus Structure</h2>
          <p className="text-lg text-gray-600">Get bonus credits when you recharge your wallet</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">₹1000</div>
              <div className="text-lg font-semibold text-gray-800 mb-1">₹1025</div>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold inline-block">
                2.5% Bonus
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">5 Bonus Credits</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Usable only for platform fee</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Expires in 60 days</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Non-withdrawable</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">POPULAR</span>
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-green-600 mb-2">₹5000</div>
              <div className="text-lg font-semibold text-gray-800 mb-1">₹5200</div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold inline-block">
                4% Bonus
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">25 Bonus Credits</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Usable only for platform fee</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Expires in 60 days</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Non-withdrawable</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-purple-600 mb-2">₹10,000</div>
              <div className="text-lg font-semibold text-gray-800 mb-1">₹10,500</div>
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold inline-block">
                5% Bonus
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">50 Bonus Credits</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Usable only for platform fee</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Expires in 60 days</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">Non-withdrawable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========= MONTHLY LIMIT EXHAUSTED ========= */}
      <div className="max-w-7xl mx-auto p-6 mb-16">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl p-8 max-w-4xl mx-auto border border-orange-200">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">When you exhaust your monthly chat limit</h3>
            <p className="text-lg text-gray-700 font-medium">"You've reached your monthly limit. Continue instantly using Chat Credits."</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">↑</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Upgrade Plan</h4>
              <p className="text-sm text-gray-600">Better value with higher limits</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">💬</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Buy Chat Credits</h4>
              <p className="text-sm text-gray-600">Quick fix to continue chatting</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">💰</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Recharge Wallet</h4>
              <p className="text-sm text-gray-600">Get bonus credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========= CHAT CREDITS PACKS ========= */}
      <div className="max-w-7xl mx-auto p-6 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Chat Credits Packs</h2>
          <p className="text-lg text-gray-600">Purchase credits to continue chatting when limits are reached</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mini Pack</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">10</div>
              <div className="text-gray-600 mb-1">messages</div>
              <div className="text-lg font-semibold text-gray-800">TBD</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                <span>30 days validity</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">POPULAR</span>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter Pack</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">25</div>
              <div className="text-gray-600 mb-1">messages</div>
              <div className="text-lg font-semibold text-gray-800">TBD</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                <span>45 days validity</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pro Pack</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">60</div>
              <div className="text-gray-600 mb-1">messages</div>
              <div className="text-lg font-semibold text-gray-800">TBD</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                <span>60 days validity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========= CREDITS TERMS ========= */}
      <div className="max-w-7xl mx-auto p-6 mb-16">
        <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Important Terms</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Credits non-refundable</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Credits non-transferable</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Chat Credits expire in 30–60 days</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Cannot use credits for video calls</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Cannot use credits for cancellation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========= MODAL VIEW ========= */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative">

            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-4">
                {selectedPlan.icon}
              </div>

              <h2 className="text-3xl font-bold mb-1">{selectedPlan.name}</h2>
              <p className="text-gray-600 text-lg mb-2">{selectedPlan.description}</p>

              <div className="text-5xl font-bold mb-2">{selectedPlan.price}</div>
              <p className="text-gray-500 text-lg">per month</p>
            </div>

            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold">Features & Benefits</h3>
              {selectedPlan.features.map((feature: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <Check className="text-green-600 mt-1" size={18} />
                  <div>
                    <p className="text-lg font-semibold">{feature.text}</p>
                    <p className="text-gray-700">{feature.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-8 py-3 rounded-xl bg-gray-100 border text-gray-600"
              >
                Close
              </button>

              <button
                disabled={loading}
                onClick={handleSubscribe}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : selectedPlan.name === 'Enterprise'
                    ? 'Contact Sales'
                    : `Choose ${selectedPlan.name}`
                }
              </button>
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
}