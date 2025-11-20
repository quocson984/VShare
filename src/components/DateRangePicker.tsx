'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabledDates?: Date[];
  minDate?: Date;
  className?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  disabledDates = [],
  minDate = new Date(),
  className = ''
}: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date: Date) => {
    // Check if date is before minDate
    if (date < minDate) return true;
    
    // Check if date is in disabledDates
    return disabledDates.some(disabledDate => 
      disabledDate.toDateString() === date.toDateString()
    );
  };

  const isDateInRange = (date: Date) => {
    if (!value.from || !value.to) return false;
    return date >= value.from && date <= value.to;
  };

  const isDateSelected = (date: Date) => {
    if (value.from && date.toDateString() === value.from.toDateString()) return true;
    if (value.to && date.toDateString() === value.to.toDateString()) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (selectingStart || !value.from) {
      onChange({ from: date, to: null });
      setSelectingStart(false);
    } else {
      if (date < value.from) {
        onChange({ from: date, to: value.from });
      } else {
        onChange({ from: value.from, to: date });
      }
      setSelectingStart(true);
      setShowCalendar(false);
    }
  };

  const renderCalendar = () => {
    const days = daysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const dates = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      dates.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= days; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const inRange = isDateInRange(date);
      const selected = isDateSelected(date);

      dates.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={disabled}
          className={`
            p-2 text-sm rounded-lg transition-colors
            ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
            ${selected ? 'bg-orange-500 text-white font-semibold hover:bg-orange-600' : ''}
            ${inRange && !selected ? 'bg-orange-100 text-orange-900' : ''}
            ${!disabled && !selected && !inRange ? 'text-gray-700' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return dates;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Display Box */}
      <div
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-white"
      >
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-700">
              {value.from ? formatDate(value.from) : 'Chọn ngày bắt đầu'}
            </div>
            {value.to && (
              <div className="text-xs text-gray-500">
                đến {formatDate(value.to)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {showCalendar && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowCalendar(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20 w-80">
            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <div className="font-semibold">
                Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
              </div>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Info Text */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              {selectingStart || !value.from
                ? 'Chọn ngày bắt đầu'
                : 'Chọn ngày kết thúc'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
