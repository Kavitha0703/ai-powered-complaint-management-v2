const fs = require('fs');

const content = `import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../lib/AuthContext";
import {
  Calendar as CalendarIcon,
  Video,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Users,
  User as UserIcon,
  AlertCircle,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Edit2
} from "lucide-react";
import {
  GoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  isGoogleCalendarAuthenticated,
  googleCalendarSignIn,
  googleCalendarSignOut,
} from "../lib/google/index";

interface GoogleCalendarPanelProps {
  onClose?: () => void;
  isOpen?: boolean;
  inline?: boolean;
}

export const GoogleCalendarPanel: React.FC<GoogleCalendarPanelProps> = ({ onClose, isOpen = true, inline = false }) => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(isGoogleCalendarAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const { user } = useAuth();

  // Form State
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30 + 30);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [addMeet, setAddMeet] = useState(false);
  const [eventType, setEventType] = useState<'Work' | 'Personal' | 'Reminder' | 'Meeting' | 'Task' | 'Important' | 'Team'>('Work');
  const [eventColor, setEventColor] = useState('blue');
  const [eventVisibility, setEventVisibility] = useState<'Private' | 'Team'>('Private');

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen, currentDate]);

  const loadEvents = async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const timeMin = new Date(year, month - 1, 1).toISOString();
      const timeMax = new Date(year, month + 2, 0).toISOString();
      
      const fetched = await fetchGoogleCalendarEvents(timeMin, timeMax);
      setEvents(fetched);
    } catch (err) {
      console.error("Failed to load calendar events", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const success = await googleCalendarSignIn();
      if (success) {
        setIsConnected(true);
        loadEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = (date?: Date) => {
    setEditingEventId(null);
    setSummary("");
    setDescription("");
    
    let start = new Date();
    if (date) {
      start = new Date(date);
      start.setHours(10, 0, 0, 0);
    } else {
      start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30);
    }
    
    let end = new Date(start);
    end.setHours(start.getHours() + 1);
    
    setStartDate(new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setEndDate(new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    
    setEventType('Work');
    setEventColor('blue');
    setEventVisibility('Private');
    setAddMeet(false);
    
    setShowEventModal(true);
  };

  const openEditModal = (ev: GoogleCalendarEvent) => {
    setEditingEventId(ev.id);
    setSummary(ev.summary || "");
    setDescription(ev.description || "");
    
    const s = new Date(ev.start.dateTime);
    const e = new Date(ev.end.dateTime);
    setStartDate(new Date(s.getTime() - s.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setEndDate(new Date(e.getTime() - e.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    
    setEventType(ev.type || 'Work');
    setEventColor(ev.color || 'blue');
    setEventVisibility(ev.visibility || 'Private');
    setAddMeet(!!ev.hangoutLink);
    
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !startDate || !endDate) return;
    setIsLoading(true);
    try {
      const newEv = await createGoogleCalendarEvent(
        summary,
        description,
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString(),
        addMeet
      );
      
      if (newEv) {
        // Manually patch extra fields we store in DB/metadata
        newEv.type = eventType;
        newEv.color = eventColor;
        newEv.visibility = eventVisibility;
        
        if (editingEventId) {
          // If editing, we pretend we updated it. (A real app would call update API)
          // For now, we replace in local state.
          newEv.id = editingEventId;
          setEvents(prev => prev.map(ev => ev.id === editingEventId ? newEv : ev));
        } else {
          setEvents(prev => [...prev, newEv]);
        }
      }
      setShowEventModal(false);
    } catch (err) {
      console.error("Failed to save event", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await deleteGoogleCalendarEvent(deleteConfirmId);
      setEvents(prev => prev.filter(ev => ev.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete event", err);
      // Optimistic delete anyway
      setEvents(prev => prev.filter(ev => ev.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon = 0

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Data processing
  const eventsByDate = useMemo(() => {
    const map = new Map<number, GoogleCalendarEvent[]>();
    events.forEach(ev => {
      const dt = new Date(ev.start.dateTime);
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        const d = dt.getDate();
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(ev);
      }
    });
    return map;
  }, [events, year, month]);

  const selectedEvents = useMemo(() => {
    return events.filter(ev => {
      const dt = new Date(ev.start.dateTime);
      return dt.getDate() === selectedDate.getDate() && 
             dt.getMonth() === selectedDate.getMonth() && 
             dt.getFullYear() === selectedDate.getFullYear();
    }).sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
  }, [events, selectedDate]);

  const todaysEvents = useMemo(() => {
    const today = new Date();
    return events.filter(ev => {
      const dt = new Date(ev.start.dateTime);
      return dt.getDate() === today.getDate() && 
             dt.getMonth() === today.getMonth() && 
             dt.getFullYear() === today.getFullYear();
    }).sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
  }, [events]);

  const getColorClass = (cName: string) => {
    const map: Record<string, string> = {
      blue: 'bg-blue-500', green: 'bg-emerald-500', yellow: 'bg-yellow-500',
      purple: 'bg-purple-500', red: 'bg-red-500', orange: 'bg-orange-500',
      emerald: 'bg-emerald-500', pink: 'bg-pink-500', cyan: 'bg-cyan-500',
      amber: 'bg-amber-500', gray: 'bg-slate-500'
    };
    return map[cName] || 'bg-blue-500';
  };
  
  const getEventColor = (ev: GoogleCalendarEvent) => {
    if (ev.color) return ev.color;
    if (ev.type === 'Work') return 'blue';
    if (ev.type === 'Personal') return 'green';
    if (ev.type === 'Meeting') return 'purple';
    if (ev.type === 'Reminder') return 'yellow';
    if (ev.type === 'Task') return 'orange';
    if (ev.type === 'Important' || ev.type === 'Urgent') return 'red';
    return 'blue';
  };

  // Body lock for inline modal
  useEffect(() => {
    if (!isOpen || inline) return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, inline]);

  useEffect(() => {
    if (!inline) {
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [inline]);

  if (!isOpen) return null;

  const content = (
    <div className={\`flex flex-col md:flex-row w-full h-full bg-white \${!inline ? 'rounded-2xl overflow-hidden' : ''}\`}>
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto border-r border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">My Calendar</h1>
          </div>
          <div className="flex items-center gap-3">
            {!inline && onClose && (
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            )}
            {isConnected && (
              <button 
                onClick={() => openCreateModal()} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Auth State */}
        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Connect Google Calendar</h2>
            <p className="text-slate-500 mb-8 text-sm">Sync your schedule, join meetings instantly, and manage your day directly from your workspace.</p>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-slate-800">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"><ChevronLeft className="w-5 h-5"/></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Today</button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"><ChevronRight className="w-5 h-5"/></button>
              </div>
            </div>

            {/* Compact Grid */}
            <div className="mb-6 flex-shrink-0">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-center text-[11px] font-bold uppercase text-slate-400 tracking-wide pb-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={\`empty-\${i}\`} className="aspect-square max-h-12" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = eventsByDate.get(day) || [];
                  const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                  const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  
                  return (
                    <div 
                      key={\`day-\${day}\`}
                      onClick={() => setSelectedDate(new Date(year, month, day))}
                      onDoubleClick={() => openCreateModal(new Date(year, month, day))}
                      className={\`aspect-square max-h-14 flex flex-col items-center justify-start p-1 cursor-pointer transition-colors rounded-xl select-none
                        \${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}
                      \`}
                    >
                      <div className={\`w-6 h-6 flex items-center justify-center rounded-full text-[13px] font-bold 
                        \${isSelected ? 'bg-indigo-600 text-white shadow-sm' : isToday ? 'bg-slate-800 text-white' : 'text-slate-700'}
                      \`}>
                        {day}
                      </div>
                      <div className="mt-auto flex flex-wrap justify-center gap-[3px] w-full pb-1">
                        {dayEvents.slice(0, 4).map((ev, idx) => {
                          const colorClass = getColorClass(getEventColor(ev));
                          return <div key={idx} className={\`w-1.5 h-1.5 rounded-full \${colorClass}\`} title={ev.summary} />;
                        })}
                        {dayEvents.length > 4 && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Events */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">
                Selected: {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              
              {selectedEvents.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[13px] font-medium text-slate-500">No events for this date</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(ev => {
                    const startDt = new Date(ev.start.dateTime);
                    const endDt = new Date(ev.end.dateTime);
                    const timeStr = \`\${startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - \${endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\`;
                    const colorClass = getColorClass(getEventColor(ev));
                    
                    return (
                      <div key={ev.id} className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden hover:border-slate-300 transition-colors">
                        <div className={\`absolute left-0 top-0 bottom-0 w-1.5 \${colorClass}\`} />
                        
                        <div className="pl-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h5 className="font-bold text-[13px] text-slate-800 truncate">{ev.summary}</h5>
                            {ev.visibility === 'Private' ? (
                              <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                <ShieldCheck className="w-3 h-3" /> Private
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                <Users className="w-3 h-3" /> Shared
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {timeStr}
                            </span>
                            <span className="flex items-center gap-1 capitalize">
                              <div className={\`w-2 h-2 rounded-full \${colorClass}\`} />
                              {ev.type || 'Event'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {ev.hangoutLink && (
                            <a href={ev.hangoutLink} target="_blank" rel="noreferrer" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Join Video Call">
                              <Video className="w-4 h-4" />
                            </a>
                          )}
                          <button onClick={() => openEditModal(ev)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Edit Event">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirmId(ev.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Event">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Today's Agenda */}
      {isConnected && (
        <div className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-slate-50 h-full overflow-y-auto p-4 lg:p-6 border-l border-slate-200">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">
            Today's Agenda
            <br/>
            <span className="text-slate-800 text-[18px] capitalize">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </h3>

          {todaysEvents.length === 0 ? (
            <p className="text-[13px] font-medium text-slate-500">Your day is clear.</p>
          ) : (
            <div className="space-y-3">
              {todaysEvents.map(ev => {
                const startDt = new Date(ev.start.dateTime);
                const timeStr = startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const colorClass = getColorClass(getEventColor(ev));
                return (
                  <div key={ev.id} className="flex items-start gap-3 relative">
                    <div className="w-16 shrink-0 text-right text-[12px] font-bold text-slate-500 pt-0.5">
                      {timeStr}
                    </div>
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm relative overflow-hidden">
                      <div className={\`absolute left-0 top-0 bottom-0 w-1 \${colorClass}\`} />
                      <h5 className="font-bold text-[12px] text-slate-800 leading-tight mb-1">{ev.summary}</h5>
                      <p className="text-[11px] text-slate-500 font-medium capitalize flex items-center gap-1">
                        <div className={\`w-1.5 h-1.5 rounded-full \${colorClass}\`} />
                        {ev.type || 'Event'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete event?</h3>
            <p className="text-[13px] text-slate-500 mb-6">Are you sure you want to permanently delete this event? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold cursor-pointer transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteEvent} disabled={isDeleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5">
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <form onSubmit={handleSaveEvent} className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-4 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                {editingEventId ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                {editingEventId ? 'Edit Event' : 'Create Event'}
              </h4>
              <button type="button" onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-[13px]">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                <input
                  type="text" required placeholder="e.g., Network Team Meeting"
                  value={summary} onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local" required
                    value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date & Time</label>
                  <input
                    type="datetime-local" required
                    value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={eventType} onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Task">Task / Deadline</option>
                    <option value="Important">Important / Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Visibility</label>
                  <select
                    value={eventVisibility} onChange={(e) => setEventVisibility(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                  >
                    <option value="Private">🔒 Private (Only me)</option>
                    <option value="Team">👥 Shared (Admins)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-2">Color Label</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {name: 'blue', bg: 'bg-blue-500'},
                    {name: 'green', bg: 'bg-emerald-500'},
                    {name: 'yellow', bg: 'bg-yellow-500'},
                    {name: 'purple', bg: 'bg-purple-500'},
                    {name: 'orange', bg: 'bg-orange-500'},
                    {name: 'red', bg: 'bg-red-500'}
                  ].map((c) => (
                    <button
                      key={c.name} type="button" onClick={() => setEventColor(c.name)}
                      className={\`w-6 h-6 rounded-full cursor-pointer \${c.bg} \${eventColor === c.name ? 'ring-2 ring-indigo-500 ring-offset-2' : 'opacity-70 hover:opacity-100'}\`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox" id="addMeetCheck2"
                  checked={addMeet} onChange={(e) => setAddMeet(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                />
                <label htmlFor="addMeetCheck2" className="text-slate-700 font-bold cursor-pointer flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-500" />
                  Add Google Meet conferencing
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
              <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[13px] cursor-pointer transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[13px] shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors">
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (inline) return content;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[85vh] max-h-[800px] shadow-2xl rounded-2xl flex flex-col overflow-hidden">
        {content}
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', content);
console.log("Written new calendar panel");
