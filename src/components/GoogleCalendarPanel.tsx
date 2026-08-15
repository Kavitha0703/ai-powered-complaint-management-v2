import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import {
  Calendar as CalendarIcon,
  Video,
  Plus,
  Trash2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Lock,
  Search,
  Users,
  Clock,
  Bell
} from "lucide-react";
import { useGoogleLogin } from '@react-oauth/google';
import {
  GoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  isGoogleCalendarAuthenticated,
  googleCalendarSignIn,
} from "../lib/google/index";
import { updateGoogleCalendarEvent } from "../lib/google/calendar";

interface GoogleCalendarPanelProps {
  onClose?: () => void;
  isOpen?: boolean;
  inline?: boolean;
}
export const GoogleCalendarPanel: React.FC<GoogleCalendarPanelProps> = ({ onClose, isOpen = true, inline = false }) => {

  const googleLogin = useGoogleLogin({
    prompt: 'select_account',
    scope: 'https://www.googleapis.com/auth/calendar.events openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        sessionStorage.setItem("google_workspace_access_token", tokenResponse.access_token);
        setIsConnected(true);
        googleCalendarSignIn();
        
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          });
          if (userInfoRes.ok) {
            const userInfo = await userInfoRes.json();
            if (userInfo.email) {
              setConnectedGoogleEmail(userInfo.email);
              sessionStorage.setItem("google_meet_connected_email", userInfo.email);
            }
          }
        } catch (e) {
          console.warn("Could not fetch Google user info", e);
        }
      } catch (err) {
        console.error(err);
      }
    }
  });

  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(isGoogleCalendarAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Jump to Date Modal
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpDay, setJumpDay] = useState(new Date().getDate());
  const [jumpMonth, setJumpMonth] = useState(new Date().getMonth());
  const [jumpYear, setJumpYear] = useState(new Date().getFullYear());

  const { user } = useAuth();

  // Form State
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addMeet, setAddMeet] = useState(false);
  const [eventType, setEventType] = useState('Personal');
  const [eventColor, setEventColor] = useState('green');
  const [eventVisibility, setEventVisibility] = useState<'Private' | 'Team'>('Private');
  const [eventPriority, setEventPriority] = useState('Normal');
  const [reminder, setReminder] = useState<number | undefined>(10);
  const [connectedGoogleEmail, setConnectedGoogleEmail] = useState<string | null>(() => sessionStorage.getItem("google_meet_connected_email"));

  useEffect(() => {
    if (isOpen) {
      loadEvents();
      if (!inline) {
        // Class to disable sidebar resizing or other background elements
      }
    }
    return () => {
      if (!inline) {
      }
    };
  }, [isOpen, currentDate, inline]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEventModal) {
          setShowEventModal(false);
        } else if (showJumpModal) {
          setShowJumpModal(false);
        } else if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isOpen) {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showEventModal, showJumpModal, deleteConfirmId, onClose]);

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

  const initDateStrings = (d?: Date) => {
    let start = new Date();
    if (d) {
      start = new Date(d);
      start.setHours(10, 0, 0, 0);
    } else {
      start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30);
    }
    let end = new Date(start);
    end.setHours(start.getHours() + 1);
    return {
      s: new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      e: new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    };
  };

  const openCreateModal = (date?: Date, typeOveride = 'Personal') => {
    setEditingEventId(null);
    setSummary("");
    setDescription("");
    
    const { s, e } = initDateStrings(date || selectedDate);
    setStartDate(s);
    setEndDate(e);
    
    setEventType(typeOveride);
    const cMap: Record<string, string> = {
      'Work': 'blue', 'Meeting': 'purple', 'Personal': 'green',
      'Task': 'orange', 'Important': 'red', 'Reminder': 'yellow', 'Birthday': 'pink'
    };
    setEventColor(cMap[typeOveride] || 'gray');
    setEventVisibility(['Personal', 'Reminder', 'Birthday'].includes(typeOveride) ? 'Private' : 'Team');
    setEventPriority('Normal');
    setAddMeet(false);
    setReminder(10);
    
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
    
    setEventType(ev.type || 'Personal');
    setEventColor(ev.color || getEventColor(ev));
    setEventVisibility(ev.visibility || 'Private');
    setEventPriority(ev.priority || 'Normal');
    setAddMeet(!!ev.hangoutLink);
    setReminder(ev.reminderMinutes !== undefined ? ev.reminderMinutes : 10);
    
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !startDate || !endDate) return;
    
    const token = sessionStorage.getItem("google_workspace_access_token");
    if (!token) {
      googleLogin();
      return;
    }

    setIsLoading(true);
    try {
      let savedEv: GoogleCalendarEvent;
      const eventData = {
        summary,
        description,
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString(),
        addGoogleMeet: addMeet,
        type: eventType,
        visibility: eventVisibility as any,
        color: eventColor,
        priority: eventPriority as any,
        reminderMinutes: reminder === -1 ? undefined : reminder,
        userId: user?.id,
      };

      if (editingEventId) {
        savedEv = await updateGoogleCalendarEvent(editingEventId, eventData, token);
        setEvents(prev => prev.map(ev => ev.id === editingEventId ? savedEv : ev));
      } else {
        savedEv = await createGoogleCalendarEvent(eventData, token);
        setEvents(prev => [...prev, savedEv]);
      }
      setShowEventModal(false);
      window.location.reload(); // Reload page to ensure sync
    } catch (err) {
      console.error("Failed to save event", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirmId) return;
    const token = sessionStorage.getItem("google_workspace_access_token");
    setIsDeleting(true);
    try {
      await deleteGoogleCalendarEvent(deleteConfirmId, token || undefined, user?.id);
      setEvents(prev => prev.filter(ev => ev.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      window.location.reload(); // Reload page to ensure sync
    } catch (err) {
      console.error("Failed to delete event", err);
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
  const prevDaysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon = 0

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const d = new Date();
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
  };

  const handleJumpSearch = () => {
    const target = new Date(jumpYear, jumpMonth, jumpDay);
    setCurrentDate(new Date(jumpYear, jumpMonth, 1));
    setSelectedDate(target);
    setShowJumpModal(false);
  };

  const openJumpModal = () => {
    setJumpDay(selectedDate.getDate());
    setJumpMonth(selectedDate.getMonth());
    setJumpYear(selectedDate.getFullYear());
    setShowJumpModal(true);
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Touch logic for long press
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleTouchStart = (d: Date) => {
    touchTimerRef.current = setTimeout(() => {
      openCreateModal(d);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

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

  const COLOR_MAP: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-emerald-500', purple: 'bg-purple-500',
    orange: 'bg-orange-500', red: 'bg-red-500', yellow: 'bg-yellow-500',
    gray: 'bg-slate-400'
  };
  
  const getEventColor = (ev: GoogleCalendarEvent) => {
    if (ev.color && COLOR_MAP[ev.color]) return ev.color;
    switch(ev.type) {
       case 'Work': return 'blue';
       case 'Meeting': return 'purple';
       case 'Personal': return 'green';
       case 'Task': return 'orange';
       case 'Important': return 'red';
       case 'Reminder': return 'yellow';
       default: return 'gray';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const content = (
    <div className="flex flex-col w-full h-full bg-[#0B1120] text-slate-200">
      
      {/* Header Area */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/60 bg-slate-900/50 shrink-0">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm">
             <CalendarIcon className="w-5 h-5 text-indigo-400" />
           </div>
           <div>
             <h2 className="text-[18px] font-bold text-white leading-tight">My Calendar</h2>
             <p className="text-[12px] text-slate-400 font-medium">Personal & shared events</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           {!isConnected ? (
              <button onClick={handleConnect} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[12px] font-bold transition-colors cursor-pointer shadow-sm">
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Connect Google
              </button>
           ) : null}
           {!inline && onClose && (
             <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
               <X className="w-5 h-5" />
             </button>
           )}
         </div>
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/30">
          <div className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner">
            <CalendarIcon className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-[16px] font-bold text-white mb-2">Connect Google Calendar</h2>
          <p className="text-slate-400 mb-6 text-[13px] max-w-xs">Connect your account to view your schedule and manage events.</p>
          <button
            onClick={handleConnect} disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-sm text-[13px]"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sign in with Google"}
          </button>
        </div>
      ) : (
         <div className="flex flex-col min-h-0 flex-1">
           
           {/* Navigation Toolbar */}
           <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 shrink-0 bg-slate-900/20">
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4"/></button>
                <h3 className="text-[16px] font-bold text-slate-100 w-32 text-center select-none tracking-wide">
                  {months[month]} {year}
                </h3>
                <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"><ChevronRight className="w-4 h-4"/></button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={goToday} className="px-3 py-1.5 text-[12px] font-bold text-slate-300 bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-lg transition-colors cursor-pointer shadow-sm">
                  Today
                </button>
                <button onClick={openJumpModal} className="px-3 py-1.5 text-[12px] font-bold text-slate-300 bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <Search className="w-3.5 h-3.5 opacity-80"/> Search date
                </button>
              </div>
           </div>

           {/* Grid Area */}
           <div className="p-4 shrink-0 bg-[#0B1120]">
              {/* Day Names Header */}
              <div className="grid grid-cols-7 mb-2">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                   <div key={d} className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                     {d}
                   </div>
                 ))}
              </div>
              
              {/* 42 Date Cells */}
              <div className="grid grid-cols-7 gap-y-1">
                 {Array.from({length: 42}).map((_, i) => {
                    const day = i - startOffset + 1;
                    const isCurrentMonth = day > 0 && day <= daysInMonth;
                    const dateObj = isCurrentMonth ? new Date(year, month, day) : 
                                    day <= 0 ? new Date(year, month - 1, prevDaysInMonth + day) : 
                                    new Date(year, month + 1, day - daysInMonth);
                    
                    const isSelected = selectedDate.toDateString() === dateObj.toDateString();
                    const isToday = new Date().toDateString() === dateObj.toDateString();
                    
                    const dayEvents = isCurrentMonth ? (eventsByDate.get(day) || []) : [];
                    
                    return (
                      <div 
                         key={i}
                         onClick={() => { if(isCurrentMonth) setSelectedDate(dateObj); else { setCurrentDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)); setSelectedDate(dateObj); } }}
                         onDoubleClick={() => openCreateModal(dateObj)}
                         onTouchStart={() => handleTouchStart(dateObj)}
                         onTouchEnd={handleTouchEnd}
                         className={`
                           h-11 flex flex-col items-center justify-start py-1 cursor-pointer select-none rounded-lg transition-colors relative
                           ${!isCurrentMonth ? 'text-slate-600 opacity-50' : 'hover:bg-slate-800/40'}
                         `}
                      >
                         <div className={`
                           w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium z-10 transition-colors
                           ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 
                             isToday ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/30' : 
                             isCurrentMonth ? 'text-slate-300' : 'text-slate-500'}
                         `}>
                           {dateObj.getDate()}
                         </div>
                         
                         {/* Tiny Event Dots (up to 3) */}
                         <div className="flex gap-0.5 mt-0.5 h-1">
                            {dayEvents.slice(0, 3).map((ev, idx) => (
                              <div key={idx} className={`w-[5px] h-[5px] rounded-full ${COLOR_MAP[getEventColor(ev)]}`} />
                            ))}
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>

           {/* Selected Day Agenda */}
           <div className="flex-1 flex flex-col border-t border-slate-800/60 bg-slate-900/30 overflow-hidden min-h-[160px]">
             <div className="px-5 py-3 border-b border-slate-800/40 flex items-center justify-between bg-slate-900/50 shrink-0">
               <h3 className="text-[13px] font-bold text-slate-200 tracking-wide">
                 {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
               </h3>
               <button onClick={() => openCreateModal(selectedDate)} className="text-[12px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg">
                 <Plus className="w-3.5 h-3.5"/> Add Event
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-2.5 relative">
               {selectedEvents.length === 0 ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pb-4">
                   <p className="text-[13px] font-medium">No events scheduled</p>
                 </div>
               ) : (
                 selectedEvents.map(ev => {
                   const startDt = new Date(ev.start.dateTime);
                   const timeStr = startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                   const colorClass = COLOR_MAP[getEventColor(ev)] || 'bg-slate-500';
                   
                   return (
                     <div key={ev.id} className="group flex flex-col p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors relative overflow-hidden shadow-sm">
                       <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${colorClass}`} />
                       
                       <div className="flex justify-between items-start pl-2">
                          <div className="min-w-0 pr-2">
                            <h5 className="font-bold text-[13px] text-slate-100 flex items-center gap-1.5 truncate">
                              {ev.summary}
                              {ev.visibility === 'Private' ? <Lock className="w-3 h-3 text-slate-500 shrink-0" /> : <Users className="w-3 h-3 text-indigo-400 shrink-0" />}
                            </h5>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                              <Clock className="w-3 h-3 opacity-60"/>
                              {timeStr} <span className="opacity-40">·</span> {ev.type || 'Event'}
                              {ev.priority && ev.priority !== 'Normal' && (
                                <span className="text-slate-300 font-bold"><span className="opacity-40">·</span> {ev.priority}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(ev)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg cursor-pointer transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirmId(ev.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
         </div>
      )}

      {/* Jump to Date Modal */}
      {showJumpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => setShowJumpModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-white mb-5">Search date</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
               <div>
                 <label className="text-[11px] font-bold text-slate-400 block mb-2">Day</label>
                 <select value={jumpDay} onChange={e => setJumpDay(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                    {Array.from({length: 31}).map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                 </select>
               </div>
               <div>
                 <label className="text-[11px] font-bold text-slate-400 block mb-2">Month</label>
                 <select value={jumpMonth} onChange={e => setJumpMonth(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                    {months.map((m, i) => <option key={i} value={i}>{m.slice(0,3)}</option>)}
                 </select>
               </div>
               <div>
                 <label className="text-[11px] font-bold text-slate-400 block mb-2">Year</label>
                 <select value={jumpYear} onChange={e => setJumpYear(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                    {Array.from({length: 25}, (_, i) => new Date().getFullYear() - 10 + i).map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
               <button onClick={() => setShowJumpModal(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[13px] font-bold transition-colors cursor-pointer">Cancel</button>
               <button onClick={handleJumpSearch} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm cursor-pointer">Go to date</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-white mb-2">Delete this event?</h3>
            <p className="text-[13px] text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[13px] font-bold cursor-pointer transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteEvent} disabled={isDeleting} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[13px] font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => setShowEventModal(false)}>
          <form onSubmit={handleSaveEvent} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-[16px] text-white mb-5">{editingEventId ? 'Edit event' : 'Add event'}</h4>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text" required placeholder="Event title"
                  value={summary} onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[14px] font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Start Date & Time</label>
                  <div className="flex flex-col gap-2">
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-400 transition-colors">📅</div>
                      <input
                        type="date" required value={startDate ? startDate.slice(0,10) : ""} 
                        onChange={(e) => setStartDate(`${e.target.value}T${startDate ? startDate.slice(11,16) : "10:00"}`)}
                        onClick={(e) => { try { if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker(); } catch(err){} }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500 hover:border-slate-600 transition-colors cursor-pointer"
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-400 transition-colors">🕐</div>
                      <input
                        type="time" required value={startDate ? startDate.slice(11,16) : ""} 
                        onChange={(e) => setStartDate(`${startDate ? startDate.slice(0,10) : new Date().toISOString().slice(0,10)}T${e.target.value}`)}
                        onClick={(e) => { try { if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker(); } catch(err){} }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500 hover:border-slate-600 transition-colors cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">End Date & Time</label>
                  <div className="flex flex-col gap-2">
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-400 transition-colors">📅</div>
                      <input
                        type="date" required value={endDate ? endDate.slice(0,10) : ""} 
                        onChange={(e) => setEndDate(`${e.target.value}T${endDate ? endDate.slice(11,16) : "11:00"}`)}
                        onClick={(e) => { try { if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker(); } catch(err){} }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500 hover:border-slate-600 transition-colors cursor-pointer"
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-400 transition-colors">🕐</div>
                      <input
                        type="time" required value={endDate ? endDate.slice(11,16) : ""} 
                        onChange={(e) => setEndDate(`${endDate ? endDate.slice(0,10) : new Date().toISOString().slice(0,10)}T${e.target.value}`)}
                        onClick={(e) => { try { if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker(); } catch(err){} }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500 hover:border-slate-600 transition-colors cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Type</label>
                  <select
                    value={eventType} onChange={(e) => {
                      setEventType(e.target.value);
                      const cMap: Record<string,string> = {'Work': 'blue', 'Meeting': 'purple', 'Personal': 'green', 'Task': 'orange', 'Important': 'red', 'Reminder': 'yellow', 'Birthday': 'pink'};
                      if (cMap[e.target.value]) setEventColor(cMap[e.target.value]);
                      if (['Personal', 'Reminder', 'Birthday'].includes(e.target.value)) {
                        setEventVisibility('Private');
                      } else {
                        setEventVisibility('Team');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[13px] font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Work">Work</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Personal">Personal</option>
                    <option value="Task">Task / Deadline</option>
                    <option value="Important">Important / Urgent</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Birthday">Birthday / Special</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Visibility</label>
                  <select
                    value={eventVisibility} onChange={(e) => setEventVisibility(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[13px] font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Private">🔒 Private</option>
                    <option value="Team">👥 Shared with team</option>
                  </select>
                </div>
              </div>
              <div className="pt-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">Color Label</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    {name: 'blue', bg: 'bg-blue-500'},
                    {name: 'green', bg: 'bg-emerald-500'},
                    {name: 'purple', bg: 'bg-purple-500'},
                    {name: 'orange', bg: 'bg-orange-500'},
                    {name: 'red', bg: 'bg-red-500'},
                    {name: 'yellow', bg: 'bg-yellow-500'},
                    {name: 'gray', bg: 'bg-slate-400'}
                  ].map((c) => (
                    <button
                      key={c.name} type="button" onClick={() => setEventColor(c.name)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-all ${c.bg} ${eventColor === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Reminder</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-400 transition-colors">🔔</div>
                  <select
                    value={reminder === undefined ? -1 : reminder} 
                    onChange={(e) => setReminder(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500 hover:border-slate-600 transition-colors cursor-pointer appearance-none"
                  >
                    <option value={0}>At time of event</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={1440}>1 day before</option>
                    <option value={-1}>No reminder</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Google Calendar Sync</span>
                {sessionStorage.getItem("google_workspace_access_token") ? (
                  <div className="flex items-center gap-2 text-[12px] font-medium text-slate-300 bg-slate-950/50 px-3 py-2.5 rounded-xl border border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                    Connected as {connectedGoogleEmail || "authenticated user"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[12px] font-medium text-slate-300 bg-slate-950/50 px-3 py-2.5 rounded-xl border border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0"></div>
                    Not connected (Will connect on save)
                  </div>
                )}
              </div>

            </div>
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-800/80">
              <button type="button" onClick={() => setShowEventModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-[13px] cursor-pointer transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[13px] shadow-sm cursor-pointer transition-colors flex items-center gap-1.5">
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save event"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;
  if (inline) return content;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="w-full max-w-[580px] h-auto max-h-[90vh] shadow-2xl rounded-2xl flex flex-col overflow-hidden bg-[#0B1120] border border-slate-800" onClick={e => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
};
