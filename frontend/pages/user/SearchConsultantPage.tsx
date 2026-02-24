import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { useNavigate } from 'react-router-dom';
import { consultants as consultantsApi } from '../../services/api';
import { Consultant } from '../../types';
import { Search, Loader, Star } from 'lucide-react';

const weekdays = [
  'Monday','Tuesday','Wednesday','Thursday',
  'Friday','Saturday','Sunday'
];

const SearchConsultantPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [consultantsData, setConsultantsData] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [rating, setRating] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const data = await consultantsApi.getAll();
      setConsultantsData(data || []);
    } catch (err) {
      setError('Failed to load consultants.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Dynamic Filters ---------------- */

  const domains = useMemo(() => {
    return [...new Set(consultantsData.map(c => c.domain).filter(Boolean))];
  }, [consultantsData]);

  const languages = useMemo(() => {
    return [
      ...new Set(
        consultantsData
          .flatMap(c =>
            c.languages ? c.languages.split(',') : []
          )
          .map(l => l.trim())
          .filter(Boolean)
      )
    ];
  }, [consultantsData]);

  /* ---------------- Filtering Logic ---------------- */

  const filteredConsultants = consultantsData.filter(c => {

    const matchesQuery =
      !query ||
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.domain?.toLowerCase().includes(query.toLowerCase());

    const matchesDomain =
      selectedDomains.length === 0 ||
      selectedDomains.includes(c.domain);

    const matchesPrice =
      (c.hourly_price ?? 0) <= maxPrice;

    const matchesRating =
      !rating || (c.rating ?? 0) >= rating;

    const matchesLanguage =
      selectedLanguages.length === 0 ||
      selectedLanguages.some(lang =>
        c.languages?.includes(lang)
      );

    const matchesAvailability =
      selectedDays.length === 0 ||
      selectedDays.some(day =>
        c.availability?.includes(day)
      );

    return (
      matchesQuery &&
      matchesDomain &&
      matchesPrice &&
      matchesRating &&
      matchesLanguage &&
      matchesAvailability
    );
  });

  const clearFilters = () => {
    setSelectedDomains([]);
    setSelectedLanguages([]);
    setMaxPrice(5000);
    setRating(null);
    setSelectedDays([]);
    setQuery('');
  };

  return (
    <Layout title="Find Experts">
      <div className="flex gap-8 max-w-7xl mx-auto">

        {/* ================= FILTER PANEL ================= */}
        <div className="w-80 bg-white rounded-3xl p-6 border border-gray-200 shadow-lg h-fit sticky top-24">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 font-semibold hover:underline"
            >
              Clear
            </button>
          </div>

          {/* DOMAIN */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Domain</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {domains.map(domain => (
                <label key={domain} className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDomains.includes(domain)}
                    onChange={() =>
                      selectedDomains.includes(domain)
                        ? setSelectedDomains(selectedDomains.filter(d => d !== domain))
                        : setSelectedDomains([...selectedDomains, domain])
                    }
                    className="mr-2 accent-blue-600"
                  />
                  {domain}
                </label>
              ))}
            </div>
          </div>

          {/* PRICE */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">
              Max Price:
              <span className="text-blue-600 ml-2 font-bold">₹{maxPrice}</span>
            </h3>
            <input
              type="range"
              min={0}
              max={5000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* RATING */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Rating</h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  checked={rating === null}
                  onChange={() => setRating(null)}
                  className="mr-2 accent-blue-600"
                />
                All Ratings
              </label>
              {[4, 3, 2].map(r => (
                <label key={r} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={rating === r}
                    onChange={() => setRating(r)}
                    className="mr-2 accent-blue-600"
                  />
                  {r}★ & above
                </label>
              ))}
            </div>
          </div>

          {/* LANGUAGE */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Language</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {languages.map(lang => (
                <label key={lang} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang)}
                    onChange={() =>
                      selectedLanguages.includes(lang)
                        ? setSelectedLanguages(selectedLanguages.filter(l => l !== lang))
                        : setSelectedLanguages([...selectedLanguages, lang])
                    }
                    className="mr-2 accent-blue-600"
                  />
                  {lang}
                </label>
              ))}
            </div>
          </div>

          {/* AVAILABILITY */}
          <div>
            <h3 className="font-semibold mb-3">Availability</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {weekdays.map(day => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() =>
                      selectedDays.includes(day)
                        ? setSelectedDays(selectedDays.filter(d => d !== day))
                        : setSelectedDays([...selectedDays, day])
                    }
                    className="mr-2 accent-blue-600"
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT CONTENT ================= */}
        <div className="flex-1 space-y-8">

          {/* SEARCH */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or domain..."
                  className="w-full bg-gray-50 rounded-2xl pl-12 pr-4 py-4 border focus:ring-2 focus:ring-blue-500 outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-700 transition shadow"
              >
                Search
              </button>
            </div>
          </div>

          <p className="text-gray-500 font-medium">
            Found <span className="font-bold text-gray-900">
              {filteredConsultants.length}
            </span> experts
          </p>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader className="animate-spin text-blue-600" size={40} />
            </div>
          )}

          {!loading && !error && (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredConsultants.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border shadow-md hover:shadow-xl transition p-6 text-center"
                >
                  <img
                    src={c.profile_pic || c.image}
                    alt={c.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />

                  <h3 className="text-lg font-bold">{c.name}</h3>
                  <p className="text-blue-600 text-sm">{c.domain}</p>

                  <p className="text-sm text-gray-500 mt-2 flex justify-center items-center gap-1">
                    <Star size={14} className="text-yellow-500" />
                    {c.rating ?? 5} • {c.languages}
                  </p>

                  <p className="text-xl font-bold mt-3">
                    ₹{c.hourly_price} / session
                  </p>

                  <button 
                    onClick={() => navigate(`/user/consultant/${c.id}`)}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchConsultantPage;
