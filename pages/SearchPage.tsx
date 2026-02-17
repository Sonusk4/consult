
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { consultants as consultantsApi } from '../services/api';
import { Consultant } from '../types';
import { Search, Filter, Star, ShieldCheck, MapPin, Globe, Loader } from 'lucide-react';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [consultantsData, setConsultantsData] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async (domain?: string) => {
    setLoading(true);
    try {
      const data = await consultantsApi.getAll(domain);
      setConsultantsData(data || []);
    } catch (err) {
      console.error("Failed to fetch consultants", err);
      setError("Failed to load consultants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Simple client-side filter for now if backend fuzzy search isn't ready,
    // or trigger backend search if implemented.
    // The backend `getAll` accepts a `domain` param.
    // For general text search, we might need a better endpoint or client-side filtering.
    // Let's filter client-side for "query" on name/bio if fetching all.
    // Or if query matches a domain, pass it.
  };

  const filteredConsultants = consultantsData.filter(c =>
    !query ||
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.domain.toLowerCase().includes(query.toLowerCase()) ||
    c.bio?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout title="Find Experts">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Search & Filter Header */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, domain, or skills..."
                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="bg-gray-50 text-gray-600 font-bold px-6 py-4 rounded-2xl flex items-center hover:bg-gray-100 transition-all">
                <Filter size={20} className="mr-2" /> Filters
              </button>
              <button className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                Search
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {['Tech Strategy', 'Legal Counsel', 'Health', 'Marketing', 'FinOps', 'Architecture'].map(tag => (
              <button
                key={tag}
                onClick={() => fetchConsultants(tag)}
                className="px-4 py-2 rounded-full border border-gray-100 text-sm font-bold text-gray-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                {tag}
              </button>
            ))}
            <button
              onClick={() => fetchConsultants()}
              className="px-4 py-2 rounded-full border border-gray-100 text-sm font-bold text-gray-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              All
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between">
          <p className="text-gray-500 font-medium">Found <span className="text-gray-900 font-bold">{filteredConsultants.length}</span> experts available for booking</p>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Sort by:</span>
            <select className="bg-transparent border-none font-bold text-blue-600 outline-none">
              <option>Popularity</option>
              <option>Rating (High-Low)</option>
              <option>Price (Low-High)</option>
            </select>
          </div>
        </div>

        {/* Loading / Error State */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin text-blue-600" size={40} />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-red-500 font-bold">
            {error}
          </div>
        )}

        {/* Consultants Grid */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredConsultants.map((c) => (
              <div key={c.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="relative h-48">
                  <img src={c.profile_pic || c.image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800'} alt={c.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
                  {c.is_verified && (
                    <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                      <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                        <ShieldCheck size={16} />
                      </div>
                      <span className="text-white text-xs font-black uppercase tracking-widest shadow-sm">Verified Premium</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center space-x-1 shadow-lg">
                    <Star size={14} className="text-yellow-400" fill="currentColor" />
                    <span className="text-xs font-bold text-gray-800">{c.rating || "5.0"}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{c.name || c.user?.email || "Consultant"}</h3>
                      <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">{c.domain}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{c.bio || "No bio available."}</p>

                  <div className="flex items-center space-x-4 mb-6 text-gray-400 text-xs font-bold">
                    <div className="flex items-center"><MapPin size={14} className="mr-1" /> Global</div>
                    <div className="flex items-center"><Globe size={14} className="mr-1" /> {c.languages || "English"}</div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div>
                      <p className="text-2xl font-black text-gray-900">${c.hourly_price || c.hourly_price}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Hourly Rate</p>
                    </div>
                    <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination - Mock for now */}
        {!loading && filteredConsultants.length > 0 && (
          <div className="flex justify-center pt-8">
            <div className="flex space-x-2">
              <button className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-100">1</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
