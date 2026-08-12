import React, { useState, useMemo } from 'react';
import { GoogleCalendarEvent } from '../lib/google/index';
import { ChevronLeft, ChevronRight, Video, Users, User as UserIcon, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarMonthViewProps {
  events: GoogleCalendarEvent[];
  onDeleteEvent?: (id: string) => void;
  onAddEvent?: (date: Date) => void;
  onAddTask?: (date: Date) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ events, onDeleteEvent, onAddEvent, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday

  // Adjust for Monday as first day of week
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventColor = (ev: GoogleCalendarEvent) => {
    if (ev.color) return ev.color;
    if (ev.type === 'Personal') return 'blue';
    if (ev.type === 'Team') return 'purple';
    if (ev.visibility === 'Private') return 'blue';
    if (ev.visibility === 'Team') return 'purple';
    return 'blue'; // default
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    gray: 'bg-gray-500',
    slate: 'bg-slate-500',
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<number, GoogleCalendarEvent[]>();
    events.forEach(ev => {
      const dt = new Date(ev.start.dateTime);
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        const d = dt.getDate();
        const existing = map.get(d) || [];
        existing.push(ev);
        map.set(d, existing);
      }
    });
    return map;
  }, [events, year, month]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    if (selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month) return [];
    return eventsByDate.get(selectedDate.getDate()) || [];
  }, [selectedDate, eventsByDate, year, month]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <button onClick={prevMonth} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-200">
          {monthNames[month]} {year}
        </h3>
        <button onClick={nextMonth} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-950/30 p-2 sm:p-4 rounded-2xl border border-slate-800/60">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase text-slate-500 tracking-wider">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = eventsByDate.get(day) || [];
            const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            
            return (
              <div 
                key={`day-${day}`}
                onClick={() => {
                  const clickedDate = new Date(year, month, day);
                  if (isSelected) {
                    if (onAddEvent) onAddEvent(clickedDate);
                  } else {
                    setSelectedDate(clickedDate);
                  }
                }}
                onDoubleClick={() => {
                  const clickedDate = new Date(year, month, day);
                  setSelectedDate(clickedDate);
                  if (onAddEvent) onAddEvent(clickedDate);
                }}
                className="relative h-12 flex flex-col items-center justify-start p-1 cursor-pointer transition-all hover:bg-slate-800/40 rounded-lg group select-none"
              >
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-indigo-600 text-white shadow-md' : isToday ? 'border border-slate-500 text-slate-300' : 'text-slate-300 group-hover:text-white'}`}>
                  {day}
                </div>
                
                {/* Event Dots */}
                <div className="mt-auto flex flex-wrap justify-center gap-0.5 sm:gap-1 w-full pb-0.5">
                  {dayEvents.slice(0, 4).map((ev, idx) => {
                    const colorName = getEventColor(ev);
                    const bgClass = colorClasses[colorName] || 'bg-blue-500';
                    return (
                      <div key={idx} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${bgClass} shadow-sm`} title={ev.summary} />
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-500 shadow-sm" title="More events" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      <div className="mt-2">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Selected Date'}
        </h4>
        
        {selectedEvents.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
            <p className="text-sm font-semibold text-slate-400">No events for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map(ev => {
              const startDt = new Date(ev.start.dateTime);
              const endDt = new Date(ev.end.dateTime);
              const timeStr = `${startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              
              const colorName = getEventColor(ev);
              
              return (
                <div key={ev.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                  {/* Left Color Indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClasses[colorName] || 'bg-blue-500'}`} />
                  
                  <div className="pl-2 space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="font-bold text-sm text-white">{ev.summary}</h5>
                      {ev.visibility === 'Team' && (
                         <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700 text-[10px] uppercase tracking-wider">
                           <Users className="w-3 h-3 text-slate-400" />
                           Team
                         </span>
                      )}
                      {ev.visibility === 'Private' && (
                         <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700 text-[10px] uppercase tracking-wider">
                           <UserIcon className="w-3 h-3 text-slate-400" />
                           Private
                         </span>
                      )}
                      {ev.priority && (
                         <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700 text-[10px] uppercase tracking-wider">
                           {ev.priority === 'Urgent' ? '🚨' : ev.priority === 'High' ? '⚠️' : ''} {ev.priority}
                         </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {timeStr}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {ev.hangoutLink && (
                      <a
                        href={ev.hangoutLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors border-none shadow-sm cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Meet
                      </a>
                    )}
                    {onDeleteEvent && (
                      <button
                        onClick={() => onDeleteEvent(ev.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
          {onAddEvent && (
            <button
              onClick={() => onAddEvent(selectedDate || new Date())}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-1"
            >
              <span className="text-indigo-400">+</span> Add event
            </button>
          )}
          {onAddTask && (
            <button
              onClick={() => onAddTask(selectedDate || new Date())}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-1"
            >
              <span className="text-emerald-400">+</span> Add task
            </button>
          )}
        </div>
</div>
    </div>
  );
};
