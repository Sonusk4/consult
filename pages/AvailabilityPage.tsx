import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
} from 'lucide-react';

interface Slot {
  id?: number; // Optional id from backend
  start: string; // 24h format (for logic)
  end: string;   // 24h format (for logic)
  display: string; // 12h formatted display
}

const AvailabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch availability from backend on component mount and when month changes
  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/consultant/availability');
      
      // Group slots by date
      const slotsByDateMap: Record<string, Slot[]> = {};
      response.data.forEach((slot: any) => {
        const dateKey = new Date(slot.date).toDateString();
        if (!slotsByDateMap[dateKey]) {
          slotsByDateMap[dateKey] = [];
        }
        slotsByDateMap[dateKey].push({
          id: slot.id,
          start: slot.time,
          end: '', // Will calculate based on duration
          display: slot.time
        });
      });
      
      setSlotsByDate(slotsByDateMap);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedKey = selectedDate.toDateString();
  const selectedSlots = slotsByDate[selectedKey] || [];

  /* ---------------- TIME HELPERS ---------------- */

  const convertTo12Hour = (time: string) => {
    const [hour, minute] = time.split(':');
    let h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12;
    if (h === 0) h = 12;

    return `${h}:${minute} ${ampm}`;
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const isOverlapping = (newStart: string, newEnd: string) => {
    const newStartMin = timeToMinutes(newStart);
    const newEndMin = timeToMinutes(newEnd);

    return selectedSlots.some(slot => {
      const existingStart = timeToMinutes(slot.start);
      const existingEnd = timeToMinutes(slot.end);

      return newStartMin < existingEnd && newEndMin > existingStart;
    });
  };

  /* ---------------- MONTH NAVIGATION ---------------- */

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  /* ---------------- ADD SLOT ---------------- */
  const handleAddSlot = async () => {
    if (!startTime || !endTime) {
      alert('Please select start and end time');
      return;
    }

    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    if (isOverlapping(startTime, endTime)) {
      alert('This time overlaps with an existing slot');
      return;
    }

    try {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      
      // Save to backend
      await axios.post('/consultant/availability', {
        date: selectedDateStr,
        time: startTime
      });

      // Refresh availability data
      await fetchAvailability();

      // Reset form
      setStartTime('');
      setEndTime('');
      setShowForm(false);
      
      alert('Slot added successfully!');
    } catch (error) {
      console.error('Failed to add slot:', error);
      alert('Failed to add slot. Please try again.');
    }
  };

  /* ---------------- DELETE SLOT ---------------- */

  const handleDeleteSlot = async (index: number) => {
    try {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const selectedSlots = slotsByDate[selectedDate.toDateString()] || [];
      const slotToDelete = selectedSlots[index];
      
      if (slotToDelete?.id) {
        // Delete from backend
        await axios.delete(`/consultant/availability/${slotToDelete.id}`);
        
        // Refresh availability data
        await fetchAvailability();
        
        alert('Slot deleted successfully!');
      } else {
        // Remove from local state (for unsaved slots)
        setSlotsByDate(prev => {
          const updated = [...(prev[selectedDateStr] || [])];
          updated.splice(index, 1);
          return {
            ...prev,
            [selectedDateStr]: updated,
          };
        });
      }
    } catch (error) {
      console.error('Failed to delete slot:', error);
      alert('Failed to delete slot. Please try again.');
    }
  };

  /* ---------------- CALENDAR GENERATION ---------------- */

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const generateCalendarDays = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );

      const key = date.toDateString();
      const isSelected = key === selectedKey;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            isSelected
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-gray-100 hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-bold">
            {date.toLocaleString('default', { weekday: 'short' })}
          </p>
          <h3 className="text-lg font-black">{day}</h3>

          {(slotsByDate[key] || []).length > 0 && (
            <div className="mt-2 h-1 bg-blue-300 rounded-full" />
          )}
        </div>
      );
    }

    return days;
  };

  /* ---------------- UI ---------------- */

  return (
    <Layout title="Work Schedule">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border shadow-sm flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Calendar size={28} />
            <h2 className="text-2xl font-black">{monthName}</h2>
          </div>

          <div className="flex space-x-2">
            <button onClick={handlePrevMonth}>
              <ChevronLeft />
            </button>
            <button onClick={handleNextMonth}>
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="grid grid-cols-7 gap-3">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="p-4 rounded-2xl border">
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            generateCalendarDays()
          )}
        </div>

        {/* Slots Section */}
        <div className="bg-white rounded-3xl p-6 border shadow-sm">
          <div className="flex justify-between mb-4">
            <h3 className="font-black">
              Slots for {selectedDate.toDateString()}
            </h3>
            <span className="text-sm font-bold text-gray-500">
              {selectedSlots.length} Slots
            </span>
          </div>

          <div className="space-y-3">

            {selectedSlots.length === 0 && (
              <p className="text-gray-400">No slots added yet.</p>
            )}

            {selectedSlots.map((slot, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border"
              >
                <p className="font-bold">{slot.display}</p>

                <button
                  onClick={() => handleDeleteSlot(index)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Add Slot */}
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 border-2 border-dashed rounded-xl text-gray-400 font-bold flex justify-center items-center hover:border-blue-300 hover:text-blue-500"
              >
                <Plus size={18} className="mr-2" />
                Add New Slot
              </button>
            ) : (
              <div className="p-4 border rounded-xl bg-gray-50 space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="p-2 border rounded-lg"
                  />

                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-bold text-gray-500"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleAddSlot}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AvailabilityPage;
