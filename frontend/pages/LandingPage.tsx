import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Star, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Play,
  Shield,
  Clock,
  Award,
  Video,
  MessageSquare,
  Zap
} from 'lucide-react';

const PerfectLandingPage: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-gray-900">
                ConsultaPro
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('experts')}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Experts
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  How It Works
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {/* Trust Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-900 font-semibold">Trusted by 50,000+ users worldwide</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                Get Expert Help
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {" "}When You Need It Most
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-900 leading-relaxed mb-8 max-w-lg">
                Connect with verified professionals who provide personalized guidance for your specific challenges - 
                from business strategy to career advice.
              </p>

              {/* Key Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Video className="w-5 h-5 text-green-800" />
                  </div>
                  <span className="text-gray-900 font-medium">1-on-1 video consultations with verified experts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-800" />
                  </div>
                  <span className="text-gray-900 font-medium">Instant booking, flexible scheduling</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-800" />
                  </div>
                  <span className="text-gray-900 font-medium">Affordable rates, secure payments</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/search" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
                >
                  Find Experts
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/signup/consultant" 
                  className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
                >
                  Become a Consultant
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <img 
                      key={i} 
                      src={`https://picsum.photos/seed/user${i}/40`} 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-md" 
                      alt={`User ${i}`} 
                    />
                  ))}
                </div>
                <div className="text-gray-700">
                  <div className="flex text-yellow-400 mb-1">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="font-bold text-gray-900">4.9/5 average rating • 10,000+ sessions completed</p>
                </div>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="https://picsum.photos/seed/consultation-platform/600/700" 
                  alt="Consultation Platform" 
                  className="rounded-3xl shadow-2xl w-full h-auto object-cover border-2 border-gray-200"
                />
                
                {/* Live Sessions Badge */}
                <div className="absolute top-6 -right-6 bg-green-500 text-white rounded-2xl shadow-xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="font-bold">12 Live Sessions</span>
                  </div>
                </div>

                {/* Success Rate Badge */}
                <div className="absolute bottom-6 -left-6 bg-blue-600 text-white rounded-2xl shadow-xl p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">95%</div>
                    <div className="text-sm">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experts Section */}
      <section id="experts" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Expert Consultants</span>
            </h2>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto">
              Learn from industry leaders with proven track records
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                name: "Dr. Sarah Johnson",
                title: "Business Strategy Consultant",
                expertise: "Strategic Planning, Market Analysis",
                experience: "15+ years experience",
                rating: "4.9/5",
                sessions: "2,500+ sessions",
                image: "https://picsum.photos/seed/sarah-expert/400"
              },
              {
                name: "Michael Chen",
                title: "Career Development Coach", 
                expertise: "Resume Building, Interview Prep",
                experience: "10+ years experience",
                rating: "4.8/5",
                sessions: "1,800+ sessions",
                image: "https://picsum.photos/seed/michael-expert/400"
              }
            ].map((expert, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start space-x-6">
                  <img 
                    src={expert.image} 
                    alt={expert.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{expert.name}</h3>
                    <p className="text-lg font-semibold text-blue-600 mb-2">{expert.title}</p>
                    <p className="text-gray-700 mb-3">{expert.expertise}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">{expert.experience}</span>
                      <span className="text-yellow-500 font-semibold">⭐ {expert.rating}</span>
                      <span className="text-gray-600">{expert.sessions}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get Started in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">3 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto">
              From finding the right expert to getting your problem solved
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { title: "Find Your Expert", description: "Browse verified consultants by expertise, rating, and availability", icon: Users },
              { title: "Book a Session", description: "Schedule a consultation at your convenience with secure booking", icon: Clock },
              { title: "Connect & Solve", description: "Join a video session and get personalized solutions", icon: Video }
            ].map((step, index) => (
              <div key={index} className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">ConsultaPro</span>?
            </h2>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto">
              Experience the future of professional consultations with our cutting-edge platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Smart Matching", description: "AI-powered expert recommendations based on your needs", icon: Zap },
              { title: "Instant Booking", description: "Book sessions in seconds with our streamlined process", icon: Clock },
              { title: "HD Video Sessions", description: "Crystal clear video quality for effective communication", icon: Video },
              { title: "Verified Experts", description: "All consultants undergo rigorous background checks", icon: Shield },
              { title: "Secure Payments", description: "Safe and encrypted payment processing", icon: Award },
              { title: "Post-Session Support", description: "Follow-up assistance and resources included", icon: MessageSquare }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              Ready to Transform Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300"> Future?</span>
            </h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Join thousands of professionals who are already achieving their goals with expert guidance. 
              Your success story starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link 
                to="/signup" 
                className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
              >
                Get Started Free
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link 
                to="/search" 
                className="border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:border-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
              >
                Browse Experts
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "No Risk", description: "30-day money-back guarantee", icon: Shield },
                { title: "Verified Experts", description: "All consultants are background checked", icon: Users },
                { title: "Quick Start", description: "Book your first session in minutes", icon: Clock }
              ].map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-yellow-300" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-blue-100">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PerfectLandingPage;
