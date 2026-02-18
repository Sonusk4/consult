import React, { useState } from 'react';
import Layout from '../components/Layout';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
} from 'lucide-react';

interface Slot {
  start: string; // 24h format (for logic)
  end: string;   // 24h format (for logic)
  display: string; // 12h formatted display
}

const AvailabilityPage: React.FC = () => {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});

  const [showForm, setShowForm] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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

  const handleAddSlot = () => {
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

    const newSlot: Slot = {
      start: startTime,
      end: endTime,
      display: `${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}`,
    };

    const updatedSlots = [...selectedSlots, newSlot];

    // 🔥 Auto sort by start time
    updatedSlots.sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
    );

    setSlotsByDate(prev => ({
      ...prev,
      [selectedKey]: updatedSlots,
    }));

    setStartTime('');
    setEndTime('');
    setShowForm(false);
  };

  /* ---------------- DELETE SLOT ---------------- */

  const handleDeleteSlot = (index: number) => {
    setSlotsByDate(prev => {
      const updated = [...(prev[selectedKey] || [])];
      updated.splice(index, 1);
      return {
        ...prev,
        [selectedKey]: updated,
      };
    });
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
          {generateCalendarDays()}
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
