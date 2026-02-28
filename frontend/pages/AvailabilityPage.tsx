import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Clock, Loader, Check } from 'lucide-react';
import api from '../services/api';

interface Slot {
  id: number;
  available_date: string;
  available_time: string;
  is_booked: boolean;
}

const to12Hour = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const AvailabilityPage: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchSlots(); }, []);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get('/consultant/availability/my');
      setAllSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Slots for the currently-selected date
  const selectedDateStr = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const slotsForDay = allSlots.filter(s =>
    new Date(s.available_date).toLocaleDateString('en-CA') === selectedDateStr
  ).sort((a, b) => a.available_time.localeCompare(b.available_time));

  // Dates that have at least one slot (for the calendar dot indicator)
  const datesWithSlots = new Set(allSlots.map(s => new Date(s.available_date).toLocaleDateString('en-CA')));

  /* ──── Add Slots ──── */
  const handleAddSlots = async () => {
    if (!startTime || !endTime) { setError('Please enter start and end times'); return; }
    if (startTime >= endTime) { setError('End time must be after start time'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/consultant/availability', {
        date: selectedDateStr,
        start_time: startTime,
        end_time: endTime,
      });
      setSuccess(`✓ ${res.data.message}!`);
      setShowForm(false);
      setStartTime('09:00');
      setEndTime('17:00');
      await fetchSlots();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add slots');
    } finally {
      setSaving(false);
    }
  };

  /* ──── Delete Slot ──── */
  const handleDelete = async (slot: Slot) => {
    if (slot.is_booked) { alert('Cannot delete a booked slot'); return; }
    try {
      await api.delete(`/consultant/availability/${slot.id}`);
      setAllSlots(prev => prev.filter(s => s.id !== slot.id));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete slot');
    }
  };

  /* ──── Calendar ──── */
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calDays = () => {
    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`e${i}`} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dStr = date.toLocaleDateString('en-CA');
      const isSelected = dStr === selectedDateStr;
      const hasDot = datesWithSlots.has(dStr);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push(
        <div
          key={d}
          onClick={() => !isPast && setSelectedDate(date)}
          className={`p-3 rounded-2xl border text-center cursor-pointer transition-all select-none
            ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : ''}
            ${isPast ? 'opacity-30 cursor-not-allowed' : 'hover:border-blue-300'}
          `}
        >
          <p className="text-[10px] font-bold mb-0.5">{date.toLocaleString('default', { weekday: 'short' })}</p>
          <p className="text-base font-black">{d}</p>
          {hasDot && <div className={`mt-1 mx-auto h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />}
        </div>
      );
    }
    return days;
  };

  /* ──── Preview Slots ──── */
  const previewSlots = () => {
    if (!startTime || !endTime || startTime >= endTime) return [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const slots: string[] = [];
    for (let min = startMin; min < endMin; min += 60) {
      const hh = String(Math.floor(min / 60)).padStart(2, '0');
      slots.push(`${hh}:00`);
    }
    return slots;
  };

  return (
    <Layout title="Availability Manager">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Availability Manager</h2>
              <p className="text-blue-100 text-sm mt-1">Add time ranges — they auto-split into 1-hour slots for clients to book</p>
            </div>
            <div className="bg-white/20 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{allSlots.filter(s => !s.is_booked).length}</p>
              <p className="text-xs text-blue-100">Open Slots</p>
            </div>
          </div>
        </div>

        {/* Calendar Month Navigation */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              <h3 className="font-black text-lg">{monthName}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { const m = new Date(currentMonth); m.setMonth(m.getMonth() - 1); setCurrentMonth(m); }} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => { const m = new Date(currentMonth); m.setMonth(m.getMonth() + 1); setCurrentMonth(m); }} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {loading ? Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-2xl border bg-gray-50">
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            )) : calDays()}
          </div>
        </div>

        {/* Slots for Selected Date */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-lg">{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
              <p className="text-sm text-gray-500">{slotsForDay.length} slot(s) — {slotsForDay.filter(s => !s.is_booked).length} available, {slotsForDay.filter(s => s.is_booked).length} booked</p>
            </div>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
                <Plus size={16} /> Add Slots
              </button>
            )}
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-2xl">
              <h4 className="font-bold text-gray-800 mb-4">Define Available Time Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">End Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Preview */}
              {previewSlots().length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Preview — {previewSlots().length} slot(s) will be created:</p>
                  <div className="flex flex-wrap gap-2">
                    {previewSlots().map(s => (
                      <span key={s} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                        {to12Hour(s)} – {to12Hour(`${String(parseInt(s) + 1).padStart(2, '0')}:00`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
              {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

              <div className="flex gap-3">
                <button onClick={() => { setShowForm(false); setError(''); setSuccess(''); }}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleAddSlots} disabled={saving}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : <><Plus size={16} /> Add {previewSlots().length} Slot(s)</>}
                </button>
              </div>
            </div>
          )}

          {success && !showForm && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />{success}
            </div>
          )}

          {/* Slots Grid */}
          {slotsForDay.length === 0 ? (
            <div className="py-12 text-center">
              <Clock size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 font-medium">No slots added for this day</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Slots" to set your availability</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slotsForDay.map(slot => {
                const startH = parseInt(slot.available_time);
                const endHH = String(startH + 1).padStart(2, '0');
                return (
                  <div key={slot.id} className={`relative rounded-2xl border-2 p-4 transition-all
                    ${slot.is_booked ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50 hover:shadow-md'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${slot.is_booked ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {slot.is_booked ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </span>
                      {!slot.is_booked && (
                        <button onClick={() => handleDelete(slot)} className="text-red-400 hover:text-red-600 transition p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="font-black text-gray-800 text-sm">{to12Hour(slot.available_time)}</p>
                    <p className="text-xs text-gray-500">to {to12Hour(`${endHH}:00`)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AvailabilityPage;