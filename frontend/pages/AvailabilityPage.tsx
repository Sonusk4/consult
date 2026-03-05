import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConsultantKycGate from '../components/ConsultantKycGate';
import useConsultantKycCheck from '../hooks/useConsultantKycCheck';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Clock, Loader, Check, Copy, Save, AlertCircle } from 'lucide-react';
import api, { consultants as consultantsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Slot {
  id: number;
  available_date: string;
  available_time: string;
  is_booked: boolean;
  booking_status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null;
}

interface DayAvailability {
  day: string;
  available: boolean;
  startTime: string;
  endTime: string;
  selectedSlots: string[]; // Array of selected slot times (e.g., ["09:00", "10:00", "11:00"])
}

const to12Hour = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const AvailabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const { kycStatus, loading: kycLoading, isApprovalSuccess } = useConsultantKycCheck();
  const today = new Date();
  const [availabilityMode, setAvailabilityMode] = useState<'monthly' | 'weekly'>('weekly');
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
  const { addToast } = useToast();

  // Weekly availability state - persists across tab switches
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>(
    daysOfWeek.map(day => ({
      day,
      available: false,
      startTime: '09:00',
      endTime: '17:00',
      selectedSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
    }))
  );

  // Weekly mode specific state
  const [globalStartTime, setGlobalStartTime] = useState('09:00');
  const [globalEndTime, setGlobalEndTime] = useState('17:00');
  const [weeklySavedMessage, setWeeklySavedMessage] = useState('');
  const [weeklyError, setWeeklyError] = useState('');
  const [isSavingWeekly, setIsSavingWeekly] = useState(false);

  // Check profile completion
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profileData = await consultantsApi.getProfile();
        const isIncomplete = !profileData || !profileData.name || !profileData.domain || 
                            !profileData.hourly_price || !profileData.bio || !profileData.languages;
        if (isIncomplete) {
          navigate('/consultant/dashboard', { replace: true });
        }
      } catch (error) {
        navigate('/consultant/dashboard', { replace: true });
      }
    };
    checkProfile();
  }, [navigate]);

  useEffect(() => { 
    fetchSlots(); 
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        api.get('/consultant/availability/my'),
        consultantsApi.getConsultantBookings()
      ]);

      const slots = slotsRes.data;
      const bookings = bookingsRes || [];

      // Create a map of date+time to booking status
      const bookingStatusMap: Record<string, string> = {};
      bookings.forEach((booking: any) => {
        if (booking.date && booking.time_slot) {
          const key = `${booking.date}_${booking.time_slot}`;
          bookingStatusMap[key] = booking.status;
        }
      });

      // Enrich slots with booking status
      const enrichedSlots = slots.map((slot: Slot) => {
        const key = `${slot.available_date}_${slot.available_time}`;
        return {
          ...slot,
          booking_status: bookingStatusMap[key] || null
        };
      });

      setAllSlots(enrichedSlots);
      
      // Load saved weekly availability from the slots
      loadSavedWeeklyAvailability(enrichedSlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse saved slots and populate the weekly availability form
  const loadSavedWeeklyAvailability = (slots: Slot[]) => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const savedByDay: Record<string, Set<string>> = {};
    
    // Group slots by day of week
    slots.forEach(slot => {
      if (slot.is_booked) return; // Skip booked slots
      const dayName = new Date(slot.available_date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!savedByDay[dayName]) {
        savedByDay[dayName] = new Set<string>();
      }
      savedByDay[dayName].add(slot.available_time);
    });

    // Update weekly availability with saved data
    const updatedWeekly = daysOfWeek.map(day => {
      const hasSavedSlots = savedByDay[day] && savedByDay[day].size > 0;
      
      if (hasSavedSlots) {
        const slotsArray = Array.from(savedByDay[day]!).sort();
        const startTime = slotsArray[0];
        const endTime = `${(parseInt(slotsArray[slotsArray.length - 1].split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
        
        return {
          day,
          available: true,
          startTime,
          endTime,
          selectedSlots: slotsArray
        };
      }
      
      return {
        day,
        available: false,
        startTime: '09:00',
        endTime: '17:00',
        selectedSlots: []
      };
    });

    setWeeklyAvailability(updatedWeekly);
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

  /* ──── Weekly Availability Functions ──── */
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const generateSlotsForTimeRange = (startTime: string, endTime: string): string[] => {
    const [sh] = startTime.split(':').map(Number);
    const [eh] = endTime.split(':').map(Number);
    const slots: string[] = [];
    for (let h = sh; h < eh; h++) {
      slots.push(h.toString().padStart(2, '0') + ':00');
    }
    return slots;
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  const getSlotPreview = (startTime: string, endTime: string): string[] => {
    const [sh] = startTime.split(':').map(Number);
    const [eh] = endTime.split(':').map(Number);
    const slots: string[] = [];
    for (let h = sh; h < eh; h++) {
      const start = formatTime(`${h.toString().padStart(2, '0')}:00`);
      const end = formatTime(`${(h + 1).toString().padStart(2, '0')}:00`);
      slots.push(`${start} - ${end}`);
    }
    return slots;
  };

  const updateWeeklyDay = (index: number, updates: Partial<DayAvailability>) => {
    const newAvailability = [...weeklyAvailability];
    const updatedDay = { ...newAvailability[index], ...updates };
    
    // If times changed, regenerate selectedSlots to match new range
    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime || newAvailability[index].startTime;
      const endTime = updates.endTime || newAvailability[index].endTime;
      updatedDay.selectedSlots = generateSlotsForTimeRange(startTime, endTime);
    }
    
    newAvailability[index] = updatedDay;
    setWeeklyAvailability(newAvailability);
  };

  const toggleSlot = (dayIndex: number, slotTime: string) => {
    const newAvailability = [...weeklyAvailability];
    const day = newAvailability[dayIndex];
    
    if (day.selectedSlots.includes(slotTime)) {
      day.selectedSlots = day.selectedSlots.filter(s => s !== slotTime);
    } else {
      day.selectedSlots.push(slotTime);
      day.selectedSlots.sort();
    }
    
    setWeeklyAvailability(newAvailability);
  };

  const applyToWeekdays = () => {
    if (globalStartTime >= globalEndTime) {
      alert('Start time must be before end time');
      return;
    }
    const slots = generateSlotsForTimeRange(globalStartTime, globalEndTime);
    const newAvailability = weeklyAvailability.map((day, index) => {
      if (index < 5) {
        return { ...day, available: true, startTime: globalStartTime, endTime: globalEndTime, selectedSlots: slots };
      }
      return day;
    });
    setWeeklyAvailability(newAvailability);
  };

  const applyToAllDays = () => {
    if (globalStartTime >= globalEndTime) {
      alert('Start time must be before end time');
      return;
    }
    const slots = generateSlotsForTimeRange(globalStartTime, globalEndTime);
    const newAvailability = weeklyAvailability.map(day => ({
      ...day, available: true, startTime: globalStartTime, endTime: globalEndTime, selectedSlots: slots
    }));
    setWeeklyAvailability(newAvailability);
  };

  const saveWeeklyAvailability = async () => {
    const activeDays = weeklyAvailability.filter(day => day.available);
    if (activeDays.length === 0) {
      setWeeklyError('Please select at least one day with availability');
      setTimeout(() => setWeeklyError(''), 3000);
      return;
    }

    setIsSavingWeekly(true);
    setWeeklyError('');
    setWeeklySavedMessage('');

    try {
      const today = new Date();
      const weeksToGenerate = 4; // Generate for 4 weeks to ensure consistent data
      let slotsCreated = 0;

      for (let week = 0; week < weeksToGenerate; week++) {
        for (const dayData of activeDays) {
          const dayIndex = daysOfWeek.indexOf(dayData.day);
          const targetDate = new Date(today);
          const dayOfWeek = targetDate.getDay();
          const currentDayOffset = (dayOfWeek + 6) % 7;
          const daysToAdd = (dayIndex - currentDayOffset + 7) % 7 + (week * 7);
          targetDate.setDate(today.getDate() + daysToAdd);
          const dateStr = targetDate.toLocaleDateString('en-CA');

          // Create a slot for each selected time
          for (const slotTime of dayData.selectedSlots) {
            const [hour] = slotTime.split(':').map(Number);
            const startTime = slotTime;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

            try {
              await api.post('/consultant/availability', {
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
              });
              slotsCreated++;
            } catch (slotError: any) {
              console.error(`Failed to create slot for ${dayData.day} ${dateStr} ${startTime}:`, slotError);
            }
          }
        }
      }

      setWeeklySavedMessage(`✓ Your weekly availability is updated successfully! ${slotsCreated} slots created for the next 4 weeks.`);
      setTimeout(() => setWeeklySavedMessage(''), 5000);
      
      // Refresh slots and update the display
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure DB is updated
      await fetchSlots();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to save availability';
      setWeeklyError(errorMsg);
      setTimeout(() => setWeeklyError(''), 4000);
    } finally {
      setIsSavingWeekly(false);
    }
  };

  const selectedWeeklyDays = weeklyAvailability
    .filter(day => day.available && day.selectedSlots.length > 0)
    .map(day => ({ day: day.day, slots: [...day.selectedSlots].sort() }));

  const toLocalDate = (dateInput: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateInput);
  };

  const savedSlotsByDate = allSlots.reduce((acc, slot) => {
    const slotDate = toLocalDate(slot.available_date);
    const dateKey = slotDate.toLocaleDateString('en-CA');
    const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        day: dayName,
        slots: new Set<string>()
      };
    }

    acc[dateKey].slots.add(slot.available_time);
    return acc;
  }, {} as Record<string, { date: string; day: string; slots: Set<string> }>);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  const currentDay = weekStart.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const savedDateAvailability = Object.values(savedSlotsByDate)
    .map(entry => {
      const entryDate = toLocalDate(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return {
        date: entry.date,
        day: entry.day,
        slots: Array.from(entry.slots).sort(),
        status: entryDate < todayStart ? 'completed' : 'active'
      };
    })
    .filter(entry => {
      const entryDate = toLocalDate(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    })
    .sort((a, b) => toLocalDate(a.date).getTime() - toLocalDate(b.date).getTime());

  return (
    <ConsultantKycGate kycStatus={kycStatus} showSuccessModal={isApprovalSuccess}>
      <Layout title="Availability Manager">
        <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Availability Mode Selector */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Select Availability Mode</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setAvailabilityMode('monthly')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition text-sm ${
                availabilityMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Monthly Availability
            </button>
            <button
              onClick={() => setAvailabilityMode('weekly')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition text-sm ${
                availabilityMode === 'weekly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📆 Weekly Availability
            </button>
          </div>
        </div>

        {/* Monthly Availability Mode */}
        {availabilityMode === 'monthly' && (
        <div className="space-y-6">
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
              <p className="text-sm text-gray-500">{slotsForDay.length} slot(s) — {slotsForDay.filter(s => !s.is_booked).length} available, {slotsForDay.filter(s => s.booking_status === 'completed').length} completed, {slotsForDay.filter(s => s.is_booked && s.booking_status !== 'completed').length} active</p>
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
                  <div key={slot.id} className={`relative rounded-2xl border-2 p-4 transition-all ${
                    slot.booking_status === 'completed' ? 'border-purple-200 bg-purple-50' :
                    slot.is_booked ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50 hover:shadow-md'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        slot.booking_status === 'completed' ? 'bg-purple-100 text-purple-700' :
                        slot.is_booked ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {slot.booking_status === 'completed' ? (
                          <> ✓ Completed</>
                        ) : slot.is_booked ? (
                          <> <CheckCircle className="w-3 h-3" /> Active</>
                        ) : (
                          <> <Check className="w-3 h-3" /> Available</>
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
        )}

        {/* Weekly Availability Mode */}
        {availabilityMode === 'weekly' && (
          <div className="w-full bg-white rounded-2xl border shadow-sm p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-black text-gray-900">Weekly Availability</h2>
              </div>
              <p className="text-gray-500">Set your available hours for consulting sessions</p>
            </div>

            {/* Global Time Controls */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Quick Apply Options</h3>
              <p className="text-xs text-gray-500 mb-4">All slots are 1-hour each (e.g., 5-6 PM, 6-7 PM)</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Start Time</label>
                  <input
                    type="time"
                    value={globalStartTime}
                    onChange={e => setGlobalStartTime(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formatTime(globalStartTime)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">End Time</label>
                  <input
                    type="time"
                    value={globalEndTime}
                    onChange={e => setGlobalEndTime(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formatTime(globalEndTime)}</p>
                </div>
                <div className="md:col-span-2 flex gap-2 items-end">
                  <button
                    onClick={applyToWeekdays}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                  >
                    <Copy size={16} /> Apply to Weekdays
                  </button>
                  <button
                    onClick={applyToAllDays}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
                  >
                    <Copy size={16} /> Apply to All
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <AlertCircle size={14} />
                Currently active: <span className="font-bold text-blue-600">{weeklyAvailability.filter(day => day.available).length} days</span>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {weeklyAvailability.map((dayData, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    dayData.available
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  {/* Day Header with Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{dayData.day}</h4>
                      <p className="text-xs text-gray-500">
                        {dayData.available ? 'Available' : 'Not available'}
                      </p>
                    </div>
                    <button
                      onClick={() => updateWeeklyDay(index, { available: !dayData.available })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        dayData.available ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          dayData.available ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Time Inputs - Only show when available */}
                  {dayData.available && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">From</label>
                        <input
                          type="time"
                          value={dayData.startTime}
                          onChange={e => updateWeeklyDay(index, { startTime: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{formatTime(dayData.startTime)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">To</label>
                        <input
                          type="time"
                          value={dayData.endTime}
                          onChange={e => updateWeeklyDay(index, { endTime: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{formatTime(dayData.endTime)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-100 mt-2">
                        <p className="text-xs font-semibold text-blue-700 mb-2">
                          {dayData.selectedSlots.length} selected 1-hour slots (click to toggle):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {generateSlotsForTimeRange(dayData.startTime, dayData.endTime).map((slotTime) => {
                            const isSelected = dayData.selectedSlots.includes(slotTime);
                            const displayTime = `${formatTime(slotTime)} - ${formatTime(`${(parseInt(slotTime) + 1).toString().padStart(2, '0')}:00`)}`;
                            return (
                              <button
                                key={slotTime}
                                onClick={() => toggleSlot(index, slotTime)}
                                className={`text-[10px] px-2 py-1 rounded cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-blue-600 text-white font-semibold'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {displayTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disabled State Message */}
                  {!dayData.available && (
                    <div className="text-xs text-gray-500 text-center py-4">
                      Toggle to enable availability
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-gray-900 text-base">
                  {savedDateAvailability.length > 0 ? '✓ Saved Availability (This Week)' : 'No Schedule Saved Yet'}
                </h4>
              </div>
              
              {savedDateAvailability.length > 0 ? (
                <div className="space-y-3">
                  {savedDateAvailability.map((entry, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-white rounded-lg p-3 border border-blue-100 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800 text-sm">{entry.day}</span>
                          <span className="text-xs text-gray-600">({new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })})</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            entry.status === 'completed'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {entry.status === 'completed' ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 flex flex-wrap gap-1">
                          {entry.slots.map((slot, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {formatTime(slot)} - {formatTime(`${(parseInt(slot.split(':')[0]) + 1).toString().padStart(2, '0')}:00`)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 ml-2">{entry.slots.length} slots</span>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700">
                      <span className="font-bold">📅 Total:</span> {savedDateAvailability.length} saved dates • {savedDateAvailability.reduce((sum, entry) => sum + entry.slots.length, 0)} total slots
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">No saved slots for this week. Configure and save your weekly schedule above.</p>
                </div>
              )}

              {/* Show what's being prepared to save */}
              {selectedWeeklyDays.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700 font-semibold">
                    💡 Pending save: {selectedWeeklyDays.length} days ({selectedWeeklyDays.reduce((sum, day) => sum + day.slots.length, 0)} slots)
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            {weeklySavedMessage && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 flex items-center gap-3 animate-pulse">
                <div className="bg-green-600 text-white p-2 rounded-full">
                  <Save size={20} />
                </div>
                <div>
                  <p className="font-bold text-base">{weeklySavedMessage}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <button
                onClick={saveWeeklyAvailability}
                disabled={isSavingWeekly}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold text-base hover:from-green-700 hover:to-emerald-700 transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingWeekly ? (
                  <>
                    <Loader size={18} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save Availability
                  </>
                )}
              </button>
              {weeklyError && (
                <div className="text-sm text-red-600 font-semibold flex items-center gap-2">
                  <AlertCircle size={16} /> {weeklyError}
                </div>
              )}
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-500 mt-6">
              <span className="font-semibold text-gray-600">How it works:</span> Each time slot is exactly 1 hour. For example, if you set 9:00 AM to 5:00 PM, you'll see 8 available slots. Click on each slot to enable or disable it. Gray slots are disabled, blue slots are enabled for bookings. You can set different days with different time slots.
            </p>
          </div>
        )}
        </div>
      </Layout>
    </ConsultantKycGate>
  );
};


export default AvailabilityPage;