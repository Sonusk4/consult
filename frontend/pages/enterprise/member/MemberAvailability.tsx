import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface Slot {
  id?: number;
  start: string;
  end: string;
  display: string;
}

const MemberAvailability: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      // API call would go here to fetch member's availability
      // For now, showing empty state
      setSlotsByDate({});
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedKey = selectedDate.toDateString();
  const selectedSlots = slotsByDate[selectedKey] || [];

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

  const handleAddSlot = async () => {
    if (!startTime || !endTime) {
      setMessage("Please select both start and end times");
      return;
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      setMessage("End time must be after start time");
      return;
    }

    if (isOverlapping(startTime, endTime)) {
      setMessage("This time slot overlaps with an existing slot");
      return;
    }

    setSaving(true);
    try {
      // API call would go here to add availability
      const newSlot: Slot = {
        start: startTime,
        end: endTime,
        display: `${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}`,
      };

      const newSlots = [...selectedSlots, newSlot];
      setSlotsByDate({
        ...slotsByDate,
        [selectedKey]: newSlots,
      });

      setStartTime('');
      setEndTime('');
      setShowForm(false);
      setMessage("Slot added successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to add slot");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId?: number) => {
    setSaving(true);
    try {
      // API call would go here to delete availability
      const updatedSlots = selectedSlots.filter(s => s.id !== slotId);
      setSlotsByDate({
        ...slotsByDate,
        [selectedKey]: updatedSlots,
      });
      setMessage("Slot deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to delete slot");
    } finally {
      setSaving(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: getFirstDayOfMonth(currentMonth) }, () => null);

  return (
    <Layout title="Manage Availability">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Availability</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Time Slot
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            <AlertCircle size={20} />
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-bold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded">
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, idx) => (
                <div key={`empty-${idx}`} className="h-12"></div>
              ))}
              {days.map(day => {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateStr = date.toDateString();
                const isSelected = dateStr === selectedDate.toDateString();
                const hasSlots = slotsByDate[dateStr]?.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`h-12 rounded-lg font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : hasSlots
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots for selected date */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>

            {selectedSlots.length > 0 ? (
              <div className="space-y-3 mb-6">
                {selectedSlots.map((slot, idx) => (
                  <div key={idx} className="bg-blue-50 p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-blue-700">{slot.display}</span>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-6">No slots for this date</p>
            )}

            {showForm && (
              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSlot}
                      disabled={saving}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MemberAvailability;