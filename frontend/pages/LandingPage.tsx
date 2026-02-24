
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle, Video, Globe, Users } from 'lucide-react';
import { TOP_CONSULTANTS } from '../constants';

// Force cache refresh
console.log('LandingPage loaded at:', new Date().toISOString());

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="text-2xl font-bold text-blue-600">ConsultaPro</div>
        <div className="hidden md:flex items-center space-x-8 text-gray-600 font-medium">
          <a href="#features" className="hover:text-blue-600 transition-colors">How it works</a>
          <a href="#experts" className="hover:text-blue-600 transition-colors">Find Experts</a>
          <a href="#benefits" className="hover:text-blue-600 transition-colors">Benefits</a>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/auth" className="text-gray-600 font-medium px-4 py-2 hover:text-blue-600">Login</Link>
          <Link to="/signup" className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star size={16} fill="currentColor" />
            <span>#1 Marketplace for Expert Consultations</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
            Connect with Global <span className="text-blue-600">Experts</span> in Minutes.
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
            Whether it's legal advice, tech strategy, or business growth, find verified consultants ready to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center">
              Find Consultants <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link to="/signup" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center">
              Become a Consultant
            </Link>
          </div>
          <div className="mt-12 flex items-center space-x-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://picsum.photos/seed/${i}/100`} className="w-12 h-12 rounded-full border-4 border-white shadow-sm" alt="User" />
              ))}
            </div>
            <div>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-sm text-gray-500 font-medium">Trusted by 10,000+ happy clients</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <img src="https://picsum.photos/seed/consult/800/1000" className="rounded-3xl shadow-2xl" alt="Consultation" />
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center space-x-4 max-w-xs animate-bounce">
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <Video size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">Session Live Now</p>
              <p className="text-sm text-gray-500">Legal Consultation with Dr. Sarah</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experts */}
      <section id="experts" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet our Top Consultants</h2>
              <p className="text-gray-600 max-w-md">Vetted professionals from diverse industries ready to provide high-impact advice.</p>
            </div>
            <Link to="/signup" className="text-blue-600 font-bold flex items-center mt-4 md:mt-0 hover:underline">
              View all 200+ consultants <ArrowRight className="ml-1" size={18} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TOP_CONSULTANTS.map((c) => (
              <div key={c.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                <div className="relative mb-6">
                  <img src={c.image} alt={c.name} className="w-full h-64 object-cover rounded-2xl" />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center space-x-1 shadow-md">
                    <Star size={14} className="text-yellow-400" fill="currentColor" />
                    <span className="text-sm font-bold text-gray-800">{c.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{c.name}</h3>
                  <div className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{c.domain}</div>
                </div>
                <p className="text-gray-500 mb-6 line-clamp-2">{c.bio}</p>
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">₹{c.hourly_price}</span>
                    <span className="text-gray-400 text-sm ml-1">/ session</span>
                  </div>
                  <Link to="/signup" className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold group-hover:bg-blue-600 transition-all">Book Now</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Verified Experts', value: '250+', icon: <CheckCircle className="mx-auto text-blue-600 mb-2" /> },
            { label: 'Sessions Completed', value: '15k+', icon: <Video className="mx-auto text-blue-600 mb-2" /> },
            { label: 'Global Reach', value: '45 Countries', icon: <Globe className="mx-auto text-blue-600 mb-2" /> },
            { label: 'Happy Customers', value: '98%', icon: <Users className="mx-auto text-blue-600 mb-2" /> },
          ].map((stat, i) => (
            <div key={i}>
              {stat.icon}
              <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12">
          <div className="col-span-2">
            <div className="text-2xl font-bold text-white mb-6">ConsultaPro</div>
            <p className="max-w-xs mb-8">
              The premium destination for professional advice and high-level strategic consulting.
            </p>
            <div className="flex space-x-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer"></div>)}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-blue-400">Browse Experts</a></li>
              <li><a href="#" className="hover:text-blue-400">Enterprise Solution</a></li>
              <li><a href="#" className="hover:text-blue-400">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-blue-400">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400">Safety Policy</a></li>
              <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800 text-center text-sm">
          © 2024 ConsultaPro Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
