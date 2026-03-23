'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Globe, ChevronDown, Clock, Info, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils';
import { TIMEZONES } from './constants';

// Time Picker Component with scrollable hours and minutes
function TimePickerScroll({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const [hours, setHours] = useState<number>(() => {
    if (value) {
      const h = parseInt(value.split(':')[0]);
      return isNaN(h) ? 0 : h;
    }
    return 0;
  });
  const [minutes, setMinutes] = useState<number>(() => {
    if (value) {
      const m = parseInt(value.split(':')[1]);
      return isNaN(m) ? 0 : m;
    }
    return 0;
  });
  
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  // Update hours and minutes when value prop changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const newHours = parseInt(h);
      const newMinutes = parseInt(m);
      if (!isNaN(newHours)) setHours(newHours);
      if (!isNaN(newMinutes)) setMinutes(newMinutes);
    }
  }, [value]);

  // Scroll to selected hour
  useEffect(() => {
    if (hoursRef.current) {
      const selectedElement = hoursRef.current.querySelector(`[data-hour="${hours}"]`) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, []);

  // Scroll to selected minute
  useEffect(() => {
    if (minutesRef.current) {
      const selectedElement = minutesRef.current.querySelector(`[data-minute="${minutes}"]`) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, []);

  const handleHourSelect = (hour: number) => {
    setHours(hour);
    onChange(`${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const handleMinuteSelect = (minute: number) => {
    setMinutes(minute);
    onChange(`${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45]; // Only quarter hours

  return (
    <div className="flex items-center gap-2 py-3 px-2">
      {/* Hours */}
      <div className="w-16">
        <div className="text-xs font-semibold text-slate-500 text-center mb-2">Hour</div>
        <div 
          ref={hoursRef}
          className="h-40 overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {hourOptions.map((hour) => (
            <button
              key={hour}
              data-hour={hour}
              onClick={() => handleHourSelect(hour)}
              className={cn(
                "w-full py-1.5 text-center text-sm font-medium transition-colors snap-center rounded",
                hours === hour
                  ? "bg-[#FF6B3D] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {String(hour).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="text-xl font-bold text-slate-400 py-6 self-center">:</div>

      {/* Minutes */}
      <div className="w-16">
        <div className="text-xs font-semibold text-slate-500 text-center mb-2">Minute</div>
        <div 
          ref={minutesRef}
          className="h-40 overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {minuteOptions.map((minute) => (
            <button
              key={minute}
              data-minute={minute}
              onClick={() => handleMinuteSelect(minute)}
              className={cn(
                "w-full py-1.5 text-center text-sm font-medium transition-colors snap-center rounded",
                minutes === minute
                  ? "bg-[#FF6B3D] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {String(minute).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface Timezone {
  id: string;
  city: string;
  offset: string;
  currentTime: string;
}

interface ScheduleProps {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  selectedTimezone: Timezone;
  onStartDateChange: (date: string) => void;
  onStartTimeChange: (time: string) => void;
  onEndDateChange: (date: string) => void;
  onEndTimeChange: (time: string) => void;
  onTimezoneChange: (timezone: Timezone) => void;
}

export function Schedule({
  startDate,
  startTime,
  endDate,
  endTime,
  selectedTimezone,
  onStartDateChange,
  onStartTimeChange,
  onEndDateChange,
  onEndTimeChange,
  onTimezoneChange,
}: ScheduleProps) {
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [duration, setDuration] = useState<string>('');
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [showEndDateTime, setShowEndDateTime] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [isDurationManual, setIsDurationManual] = useState(false); // Track if duration was manually selected

  // Convert date string to Date object
  const startDateObj = startDate ? new Date(startDate + 'T00:00:00') : undefined;
  const endDateObj = endDate ? new Date(endDate + 'T00:00:00') : undefined;

  // Get today's date (set to start of day for comparison)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Disable dates before today for start date
  const isStartDateDisabled = (date: Date) => {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  // Disable dates before start date (or today if no start date) for end date
  const isEndDateDisabled = (date: Date) => {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    let minDate: Date;
    if (startDateObj) {
      minDate = new Date(startDateObj);
      minDate.setHours(0, 0, 0, 0);
    } else {
      minDate = new Date(today);
    }
    return dateToCheck < minDate;
  };

  // Format date display as "Sat, Dec 20, 2025"
  const formatDateDisplay = (date: string) => {
    if (!date) return '';
    try {
      const d = new Date(date + 'T00:00:00');
      return format(d, 'EEE, MMM d, yyyy');
    } catch {
      return date;
    }
  };

  // Simplified time options - only common times (every hour on the hour)
  const timeOptions = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  ];

  // Format time display for Select component (e.g., "19:00" -> "7:00 PM")
  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Get display value for Select (used in SelectValue)
  const getTimeDisplayValue = (time: string) => {
    if (!time) return 'Select time';
    return formatTimeDisplay(time);
  };

  // Calculate duration in hours (only when "Set an end time" is selected)
  useEffect(() => {
    // Only auto-calculate duration if user selected "Set an end time"
    // If user selected a specific duration (1/2/3 hours), keep it unchanged
    if (showEndDateTime && startDate && startTime && endDate && endTime) {
      try {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          const diffMs = end.getTime() - start.getTime();
          const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
          if (diffHours > 0) {
            if (diffHours === 1) {
              setDuration('1 hour');
            } else if (diffHours % 1 === 0) {
              setDuration(`${Math.round(diffHours)} hours`);
            } else {
              setDuration(`${diffHours} hours`);
            }
          } else {
            setDuration('');
          }
        } else {
          setDuration('');
        }
      } catch {
        setDuration('');
      }
    } else if (!showEndDateTime && isDurationManual && startDate && startTime) {
      // If duration was manually selected (1/2/3 hours), update endTime when startTime changes
      try {
        const start = new Date(`${startDate}T${startTime}`);
        if (!isNaN(start.getTime()) && duration) {
          let hours = 1;
          if (duration.includes('hour')) {
            hours = parseFloat(duration.replace(' hours', '').replace(' hour', ''));
          }
          
          const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
          const endDateStr = end.toISOString().slice(0, 10);
          const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
          
          onEndDateChange(endDateStr);
          onEndTimeChange(endTimeStr);
        }
      } catch {
        // Ignore errors
      }
    }
  }, [startDate, startTime, endDate, endTime, showEndDateTime, isDurationManual, duration]);

  // Duration options
  const durationOptions = [
    '1 hour',
    '2 hours',
    '3 hours',
    'Set an end time'
  ];

  // Handle duration selection
  const handleDurationSelect = (selectedDuration: string) => {
    setDuration(selectedDuration);
    setIsDurationOpen(false);
    
    if (selectedDuration === 'Set an end time') {
      // Show end date/time pickers
      setShowEndDateTime(true);
      setIsDurationManual(false); // Not a manual duration selection
      // Set default end date/time if not set
      if (!endDate) {
        onEndDateChange(startDate || '');
      }
      if (!endTime) {
        // Default to 1 hour later
        if (startTime) {
          try {
            const [h, m] = startTime.split(':');
            const startHour = parseInt(h);
            const startMin = parseInt(m);
            const endHour = (startHour + 1) % 24;
            onEndTimeChange(`${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
          } catch {
            onEndTimeChange('00:00');
          }
        }
      }
    } else {
      // Hide end date/time pickers and calculate end time
      setShowEndDateTime(false);
      setIsDurationManual(true); // Mark as manually selected
      
      if (startDate && startTime) {
        try {
          const start = new Date(`${startDate}T${startTime}`);
          if (!isNaN(start.getTime())) {
            let hours = 1;
            if (selectedDuration.includes('hour')) {
              hours = parseFloat(selectedDuration.replace(' hours', '').replace(' hour', ''));
            }
            
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            const endDateStr = end.toISOString().slice(0, 10);
            const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
            
            onEndDateChange(endDateStr);
            onEndTimeChange(endTimeStr);
          }
        } catch {
          // Ignore errors
        }
      }
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm transition-all">
      <div className="space-y-5">
        {/* Date and Time Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date Section */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-medium h-11",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  {startDate ? formatDateDisplay(startDate) : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDateObj}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      onStartDateChange(dateStr);
                    }
                  }}
                  disabled={isStartDateDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Section */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900">Time</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-medium h-11",
                    !startTime && "text-muted-foreground"
                  )}
                >
                  <Clock className="mr-2 h-4 w-4 text-slate-400 flex-shrink-0" />
                  {startTime ? formatTimeDisplay(startTime) : 'Select time'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                <TimePickerScroll value={startTime} onChange={onStartTimeChange} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Timezone Indicator */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">{selectedTimezone.offset.replace('GMT', 'GMT')}</span>
          <Popover open={isTimezoneOpen} onOpenChange={setIsTimezoneOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="p-2 border-b">
                <input 
                  type="text" 
                  placeholder="Search city or country..." 
                  className="w-full bg-slate-50 border-none rounded-lg text-xs p-2 focus:ring-2 focus:ring-[#FF6B3D]/20 outline-none font-medium text-slate-700"
                  value={timezoneSearch}
                  onChange={(e) => setTimezoneSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="p-1 max-h-64 overflow-y-auto">
                {(() => {
                  const filtered = TIMEZONES.filter(tz => {
                    const searchLower = timezoneSearch.toLowerCase();
                    return tz.city.toLowerCase().includes(searchLower) || 
                           tz.id.toLowerCase().includes(searchLower) ||
                           tz.offset.toLowerCase().includes(searchLower);
                  });
                  
                  const displayList = timezoneSearch.trim() === '' ? filtered.slice(0, 5) : filtered;
                  
                  return displayList.length > 0 ? (
                    displayList.map(tz => (
                      <button 
                        key={`${tz.id}-${tz.city}`}
                        onClick={() => {
                          onTimezoneChange(tz); 
                          setIsTimezoneOpen(false); 
                          setTimezoneSearch(''); 
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-medium flex justify-between group transition-colors",
                          selectedTimezone.id === tz.id && selectedTimezone.city === tz.city && "bg-[#FFF0E6] text-[#FF6B3D]"
                        )}
                      >
                        <span className="font-semibold">{tz.city}</span>
                        <span className={cn(
                          "text-slate-400 group-hover:text-slate-500",
                          selectedTimezone.id === tz.id && selectedTimezone.city === tz.city && "text-[#FF6B3D]"
                        )}>
                          {tz.offset.replace('GMT', '')}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                      No timezone found
                    </div>
                  );
                })()}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Duration Section */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900">Duration</label>
          <Popover open={isDurationOpen} onOpenChange={setIsDurationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-medium h-11 border-slate-200",
                  !duration && "text-muted-foreground"
                )}
              >
                {duration || 'Select duration'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" align="start" sideOffset={4}>
              <div className="flex flex-col min-w-[140px]">
                {durationOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleDurationSelect(option)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      duration === option
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date & Time (only shown when "Set an end time" is selected) */}
        {showEndDateTime && (
          <div className="pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-medium text-xs h-9 border-slate-200 focus:ring-0 focus:ring-offset-0",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? formatDateDisplay(endDate) : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDateObj}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          onEndDateChange(dateStr);
                        }
                      }}
                      disabled={isEndDateDisabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">End Time</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-medium text-xs h-9 border-slate-200 focus:ring-0 focus:ring-offset-0",
                        !endTime && "text-muted-foreground"
                      )}
                    >
                      {endTime ? formatTimeDisplay(endTime) : 'Select time'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                    <TimePickerScroll value={endTime} onChange={onEndTimeChange} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
