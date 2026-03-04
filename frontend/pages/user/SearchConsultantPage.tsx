import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { useNavigate } from 'react-router-dom';
import { consultants as consultantsApi } from '../../services/api';
import { Consultant } from '../../types';
import { Search, Loader, Star, X } from 'lucide-react';
import '../../styles/UserPopupModal.css';

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

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, string[]>>({});

  useEffect(() => {
    fetchConsultants();
  }, []);

  // Update maxPrice when data loads
  useEffect(() => {
    if (consultantsData.length > 0) {
      const prices = consultantsData.map(c => c.hourly_price || 0);
      const limit = prices.length > 0 ? Math.max(...prices, 5000) : 5000;
      setMaxPrice(limit);
    }
  }, [consultantsData]);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const data = await consultantsApi.getAll();
      console.log('API consultants:', data);

      const normalized = data.map((c: any) => ({
        ...c,
        user: c.user || {
          name: c.name || 'Unknown',
          profile: { bio: c.bio || c.short_bio || c.description || null },
        },
      }));

      // Fetch availability days for each consultant
      const availMap: Record<number, string[]> = {};
      await Promise.all(
        normalized.map(async (c: Consultant) => {
          try {
            const availResponse = await consultantsApi.getAvailabilityDays(c.id);
            availMap[c.id] = availResponse?.availableDays || [];
          } catch (err) {
            console.log(`Could not fetch availability for consultant ${c.id}`);
            availMap[c.id] = [];
          }
        })
      );

      setAvailabilityMap(availMap);
      setConsultantsData(normalized);
    } catch (err) {
      setError('Failed to load consultants.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Dynamic Filters ---------------- */

  const domains = useMemo(() => {
    const result = [...new Set(consultantsData.map(c => c.domain).filter(Boolean))].sort();
    console.log('Dynamic domains:', result);
    return result;
  }, [consultantsData]);

  const languagesList = useMemo(() => {
    const allLanguages = new Set<string>();
    
    consultantsData.forEach(c => {
      // Languages are stored in user.profile.languages
      const profileLangs = c.user?.profile?.languages;
      const langs = Array.isArray(profileLangs)
        ? profileLangs
        : (profileLangs?.split(',') || []);
      
      langs.forEach(l => {
        const trimmed = l.trim();
        if (trimmed) allLanguages.add(trimmed);
      });
    });

    // Convert to array and sort, with English and Kannada prioritized
    const langArray = Array.from(allLanguages);
    const priority = ['English', 'Kannada'];
    const priorityLangs = priority.filter(p => langArray.includes(p));
    const otherLangs = langArray.filter(l => !priority.includes(l)).sort();
    
    const result = [...priorityLangs, ...otherLangs];
    console.log('Dynamic languages:', result);
    return result;
  }, [consultantsData]);

  const maxPriceLimit = useMemo(() => {
    const prices = consultantsData.map(c => c.hourly_price || 0);
    const limit = prices.length > 0 ? Math.max(...prices, 5000) : 5000;
    console.log('Dynamic max price:', limit);
    return limit;
  }, [consultantsData]);

  const availableDays = useMemo(() => {
    const days = new Set<string>();
    Object.values(availabilityMap).forEach(dayArray => {
      dayArray.forEach(day => {
        days.add(day);
      });
    });
    // If no availability data, show all weekdays
    const result = days.size > 0 ? Array.from(days) : weekdays;
    console.log('Dynamic available days:', result);
    return result;
  }, [availabilityMap]);

  /* ---------------- Filtering Logic ---------------- */

  const filteredConsultants = consultantsData.filter(c => {

    const matchesQuery =
      !query ||
      c.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.domain?.toLowerCase().includes(query.toLowerCase());

    const matchesDomain =
      selectedDomains.length === 0 ||
      (c.domain && selectedDomains.includes(c.domain));

    const matchesPrice =
      (c.hourly_price ?? 0) <= maxPrice;

    const matchesLanguage =
      selectedLanguages.length === 0 ||
      selectedLanguages.some(lang => {
        // Languages are stored in user.profile.languages
        const profileLangs = c.user?.profile?.languages;
        const consultantLangs = Array.isArray(profileLangs)
          ? profileLangs
          : (profileLangs?.split(',') || []);
        return consultantLangs.map(l => l.trim()).includes(lang);
      });

    const matchesAvailability =
      selectedDays.length === 0 ||
      selectedDays.some(day => {
        const consultantAvailableDays = availabilityMap[c.id] || [];
        return consultantAvailableDays.includes(day);
      });

    const matches = matchesQuery && matchesDomain && matchesPrice && matchesLanguage && matchesAvailability;
    
    // Debug logging (can be removed in production)
    if (!matches && query) {
      console.log(`Consultant ${c.name} filtered out:`, {
        matchesQuery,
        matchesDomain,
        matchesPrice,
        matchesLanguage,
        matchesAvailability
      });
    }

    return matches;
  });

  const clearFilters = () => {
    setSelectedDomains([]);
    setSelectedLanguages([]);
    setMaxPrice(maxPriceLimit);
    setSelectedDays([]);
  };

  /* ------------ REMOVE INDIVIDUAL FILTER TAG ------------ */
  const removeTag = (type: string, value: string) => {
    if (type === 'domain')
      setSelectedDomains(selectedDomains.filter(d => d !== value));
    if (type === 'language')
      setSelectedLanguages(selectedLanguages.filter(l => l !== value));
    if (type === 'day')
      setSelectedDays(selectedDays.filter(d => d !== value));
  };

  return (
    <Layout title="Find Experts">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* SEARCH + FILTER BUTTON */}
        <div className="bg-white rounded-3xl p-6 border shadow-md">
          <div className="flex gap-4 items-center">
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
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition shadow flex items-center gap-2"
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
              {(selectedDomains.length + selectedLanguages.length + selectedDays.length) > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {selectedDomains.length + selectedLanguages.length + selectedDays.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* SELECTED FILTER TAGS */}
        {(selectedDomains.length > 0 ||
          selectedLanguages.length > 0 ||
          selectedDays.length > 0) && (
          <div className="flex flex-wrap gap-3">

            {selectedDomains.map((d) => (
              <span key={d} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {d}
                <X size={14} className="cursor-pointer hover:text-blue-900" onClick={() => removeTag('domain', d)} />
              </span>
            ))}

            {selectedLanguages.map((l) => (
              <span key={l} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {l}
                <X size={14} className="cursor-pointer hover:text-green-900" onClick={() => removeTag('language', l)} />
              </span>
            ))}

            {selectedDays.map((d) => (
              <span key={d} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {d}
                <X size={14} className="cursor-pointer hover:text-purple-900" onClick={() => removeTag('day', d)} />
              </span>
            ))}

            <button
              onClick={clearFilters}
              className="text-sm text-red-600 font-semibold hover:underline"
            >
              Clear All
            </button>
          </div>
        )}

        {/* HORIZONTAL FILTER PANEL */}
        {showFilters && (
          <div className="bg-white rounded-3xl p-6 border shadow-md">

            <div className="flex flex-wrap gap-10">

              {/* DOMAIN */}
              <div>
                <h3 className="font-semibold mb-3">Domain</h3>
                <div className="flex flex-wrap gap-3">
                  {domains.length === 0 ? (
                    <p className="text-sm text-gray-400">No domains available</p>
                  ) : (
                    domains.map((d) => (
                      <label key={d} className="flex items-center text-sm cursor-pointer hover:text-blue-600 transition">
                        <input
                          type="checkbox"
                          checked={selectedDomains.includes(d)}
                          onChange={() =>
                            selectedDomains.includes(d)
                              ? setSelectedDomains(selectedDomains.filter((x) => x !== d))
                              : setSelectedDomains([...selectedDomains, d])
                          }
                          className="mr-2 accent-blue-600"
                        />
                        <span className="font-medium">{d}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* LANGUAGE */}
              <div>
                <h3 className="font-semibold mb-3">Language</h3>
                <div className="flex flex-wrap gap-3">
                  {languagesList.length === 0 ? (
                    <p className="text-sm text-gray-400">No languages available</p>
                  ) : (
                    languagesList.map((l) => (
                      <label key={l} className="flex items-center text-sm cursor-pointer hover:text-green-600 transition">
                        <input
                          type="checkbox"
                          checked={selectedLanguages.includes(l)}
                          onChange={() =>
                            selectedLanguages.includes(l)
                              ? setSelectedLanguages(selectedLanguages.filter((x) => x !== l))
                              : setSelectedLanguages([...selectedLanguages, l])
                          }
                          className="mr-2 accent-green-600"
                        />
                        <span className="font-medium">{l}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* PRICE */}
              <div>
                <h3 className="font-semibold mb-2">Price Range</h3>
                <div className="text-sm text-gray-600 mb-1">
                  Up to <span className="font-bold text-blue-600">₹{maxPrice}</span> / session
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxPriceLimit}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-48 accent-blue-600"
                />
                <div className="text-xs text-gray-400 mt-1 flex justify-between w-48">
                  <span>₹0</span>
                  <span>₹{maxPriceLimit}</span>
                </div>
              </div>

              {/* AVAILABILITY */}
              <div>
                <h3 className="font-semibold mb-3">Available Days</h3>
                <div className="mb-3">
                  <label className="flex items-center text-sm font-semibold cursor-pointer hover:text-purple-600 transition">
                    <input
                      type="checkbox"
                      checked={selectedDays.length === availableDays.length}
                      onChange={() => {
                        if (selectedDays.length === availableDays.length) {
                          setSelectedDays([]);
                        } else {
                          setSelectedDays([...availableDays]);
                        }
                      }}
                      className="mr-2 accent-purple-600"
                    />
                    <span className="font-bold text-purple-600">All Days</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableDays.map((day) => (
                    <label key={day} className="flex items-center text-sm cursor-pointer hover:text-purple-600 transition">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={() =>
                          selectedDays.includes(day)
                            ? setSelectedDays(selectedDays.filter((x) => x !== day))
                            : setSelectedDays([...selectedDays, day])
                        }
                        className="mr-2 accent-purple-600"
                      />
                      <span className="font-medium">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS COUNT */}
        <p className="text-gray-500 font-medium">
          Found <span className="font-bold text-gray-900">{filteredConsultants.length}</span> experts
        </p>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin text-blue-600" size={40} />
          </div>
        )}

        {/* RESULTS */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredConsultants.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border shadow-md hover:shadow-xl transition p-6 text-center"
              >
                <img
                  src={c.profile_pic || c.image || 'https://via.placeholder.com/150'}
                  alt={c.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />

                <h3 className="text-lg font-bold">{c.user?.name || c.name}</h3>
                <p className="text-blue-600 text-sm">{c.domain}</p>

                <p className="text-sm text-gray-500 mt-2 flex justify-center items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  {c.rating ?? 5} • {Array.isArray(c.user?.profile?.languages) 
                    ? c.user.profile.languages.join(', ') 
                    : c.user?.profile?.languages || 'Not specified'}
                </p>

                <p className="text-xl font-bold mt-3">₹{c.hourly_price} / session</p>

                <button
                  onClick={() => navigate(`/user/consultant/${c.id}`)}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="text-center py-20 text-red-600">
            <p>{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchConsultantPage;
