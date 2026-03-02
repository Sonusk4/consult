import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { consultants as consultantsApi } from "../../services/api";
import { Consultant } from "../../types";
import { Search, Loader, Star, X } from "lucide-react";
import "../../styles/UserPopupModal.css";

const weekdays = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
];

const SearchConsultantPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [consultantsData, setConsultantsData] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const data = await consultantsApi.getAll();
      console.log("API consultants:", data);

      const normalized = data.map((c: any) => ({
        ...c,
        user: c.user || {
          name: c.name || "Unknown",
          profile: { bio: c.bio || c.short_bio || c.description || null },
        },
      }));

      setConsultantsData(normalized);
    } catch (err) {
      setError("Failed to load consultants.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------ DYNAMIC DOMAIN LIST ------------ */
  const domains = useMemo(() => {
    return [...new Set(consultantsData.map((c) => c.domain).filter(Boolean))];
  }, [consultantsData]);

  /* ------------ DYNAMIC LANGUAGE LIST ------------ */
  const languagesList = useMemo(() => {
    const dynamic = [
      ...new Set(
        consultantsData
          .flatMap((c) =>
            Array.isArray(c.languages)
              ? c.languages
              : (c.languages?.split(",") || [])
          )
          .map((l) => l.trim())
          .filter(Boolean)
      ),
    ];

    return ["English", "Kannada", ...dynamic];
  }, [consultantsData]);

  /* ------------ FILTER LOGIC ------------ */
  const filteredConsultants = consultantsData.filter((c) => {
    const matchesQuery =
      !query ||
      c.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.domain?.toLowerCase().includes(query.toLowerCase());

    const matchesDomain =
      selectedDomains.length === 0 ||
      selectedDomains.includes(c.domain);

    const matchesPrice = (c.hourly_price ?? 0) <= maxPrice;

    const matchesLanguage =
      selectedLanguages.length === 0 ||
      selectedLanguages.some((lang) =>
        (Array.isArray(c.languages)
          ? c.languages
          : (c.languages?.split(",") || [])
        )
          .map((l) => l.trim())
          .includes(lang)
      );

    const matchesAvailability =
      selectedDays.length === 0 ||
      selectedDays.some((day) => c.availability?.includes(day));

    return (
      matchesQuery &&
      matchesDomain &&
      matchesPrice &&
      matchesLanguage &&
      matchesAvailability
    );
  });

  /* ------------ CLEAR FILTERS ------------ */
  const clearFilters = () => {
    setSelectedDomains([]);
    setSelectedLanguages([]);
    setMaxPrice(5000);
    setSelectedDays([]);
  };

  /* ------------ REMOVE INDIVIDUAL FILTER TAG ------------ */
  const removeTag = (type: string, value: string) => {
    if (type === "domain")
      setSelectedDomains(selectedDomains.filter((d) => d !== value));
    if (type === "language")
      setSelectedLanguages(selectedLanguages.filter((l) => l !== value));
    if (type === "day")
      setSelectedDays(selectedDays.filter((d) => d !== value));
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
                className="w-full bg-gray-50 rounded-2xl pl-12 pr-4 py-4 border focus:ring-2 focus:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition shadow"
            >
              {showFilters ? "Hide Filters" : "Filters"}
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
                <X size={14} className="cursor-pointer" onClick={() => removeTag("domain", d)} />
              </span>
            ))}

            {selectedLanguages.map((l) => (
              <span key={l} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {l}
                <X size={14} className="cursor-pointer" onClick={() => removeTag("language", l)} />
              </span>
            ))}

            {selectedDays.map((d) => (
              <span key={d} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {d}
                <X size={14} className="cursor-pointer" onClick={() => removeTag("day", d)} />
              </span>
            ))}
          </div>
        )}

        {/* HORIZONTAL FILTER PANEL */}
        {showFilters && (
          <div className="bg-white rounded-3xl p-6 border shadow-md animate-fadeIn">

            <div className="flex flex-wrap gap-10">

              {/* DOMAIN */}
              <div>
                <h3 className="font-semibold mb-3">Domain</h3>
                <div className="flex flex-wrap gap-3">
                  {domains.map((d) => (
                    <label key={d} className="flex items-center text-sm">
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
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              {/* LANGUAGE */}
              <div>
                <h3 className="font-semibold mb-3">Language</h3>
                <div className="flex flex-wrap gap-3">
                  {languagesList.map((l) => (
                    <label key={l} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(l)}
                        onChange={() =>
                          selectedLanguages.includes(l)
                            ? setSelectedLanguages(selectedLanguages.filter((x) => x !== l))
                            : setSelectedLanguages([...selectedLanguages, l])
                        }
                        className="mr-2 accent-blue-600"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              {/* PRICE */}
              <div>
                <h3 className="font-semibold mb-3">Max Price: ₹{maxPrice}</h3>
                <input
                  type="range"
                  min={0}
                  max={5000}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-48 accent-blue-600"
                />
              </div>

              {/* AVAILABILITY */}
              <div>
                <h3 className="font-semibold mb-3">Availability</h3>
                <div className="flex flex-wrap gap-3">
                  {weekdays.map((day) => (
                    <label key={day} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={() =>
                          selectedDays.includes(day)
                            ? setSelectedDays(selectedDays.filter((x) => x !== day))
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

            {/* CLEAR FILTERS */}
            <button
              onClick={clearFilters}
              className="mt-6 text-sm text-blue-600 font-semibold hover:underline"
            >
              Clear All Filters
            </button>
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
                  src={c.profile_pic || c.image}
                  alt={c.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />

                <h3 className="text-lg font-bold">{c.user?.name || c.name}</h3>
                <p className="text-blue-600 text-sm">{c.domain}</p>

                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {c.user?.profile?.bio || "No bio available"}
                </p>

                <p className="text-sm text-gray-500 mt-2 flex justify-center items-center gap-1">
                  <Star size={14} className="text-yellow-500" />
                  {c.rating ?? 5} • {c.languages}
                </p>

                <p className="text-xl font-bold mt-3">₹{c.hourly_price} / session</p>

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
    </Layout>
  );
};

export default SearchConsultantPage;