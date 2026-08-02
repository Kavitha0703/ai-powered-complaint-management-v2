import React, { useState, useEffect } from "react";
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
  AlertCircle,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  GoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  isGoogleCalendarAuthenticated,
  googleCalendarSignIn,
  googleCalendarSignOut,
} from "../lib/google/index.ts";

interface GoogleCalendarPanelProps {
  onClose?: () => void;
  isOpen?: boolean;
  inline?: boolean;
}

export const GoogleCalendarPanel: React.FC<GoogleCalendarPanelProps> = ({ onClose, isOpen = true, inline = false }) => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(isGoogleCalendarAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [attendeesInput, setAttendeesInput] = useState("");
  const [addMeet, setAddMeet] = useState(true);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGoogleCalendarEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleConnect = async () => {
    const success = await googleCalendarSignIn();
    if (success) {
      setIsConnected(true);
      await loadEvents();
    }
  };

  const handleDisconnect = () => {
    googleCalendarSignOut();
    setIsConnected(false);
    setEvents([]);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setIsLoading(true);
    const attendeesList = attendeesInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newEv = await createGoogleCalendarEvent({
      summary,
      description,
      startTime: new Date(startDate).toISOString(),
      endTime: new Date(endDate).toISOString(),
      attendees: attendeesList,
      addGoogleMeet: addMeet,
    });

    setEvents((prev) => [newEv, ...prev]);
    setShowCreateModal(false);
    setSummary("");
    setDescription("");
    setAttendeesInput("");
    setIsLoading(false);
  };

  const handleDeleteEvent = async (id: string) => {
    setIsLoading(true);
    await deleteGoogleCalendarEvent(id);
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    setDeleteConfirmId(null);
    setIsLoading(false);
  };

  if (!isOpen && !inline) return null;

  const content = (
    <div className={`bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ${inline ? 'w-full' : 'max-w-2xl w-full max-h-[90vh]'}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Google Calendar Sync</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                Project quiet-alchemy-0lkqp
              </span>
            </div>
            <p className="text-xs text-slate-400">View & schedule events synced with Google Calendar and Google Meet</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            title="Refresh Calendar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          {!inline && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border-none"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
        {/* Status / Auth Banner */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/40 border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <div>
              <div className="font-semibold text-xs text-slate-200">
                {isConnected ? 'Connected to Google Workspace' : 'Disconnected from Google Calendar'}
              </div>
              <div className="text-[11px] text-slate-400">
                {isConnected
                  ? 'Events and Google Meet video calls are synced with your Google account.'
                  : 'Connect to sync events and Google Meet links with Google Calendar.'}
              </div>
            </div>
          </div>

          <div>
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm cursor-pointer transition-colors border-none flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Upcoming Events ({events.length})</h4>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
        </div>

        {/* Events list */}
        {events.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No upcoming calendar events</p>
            <p className="text-xs text-slate-500 mt-1">Click "Schedule Event" to create a new entry on Google Calendar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const startDt = new Date(ev.start.dateTime);
              const endDt = new Date(ev.end.dateTime);
              const dateStr = startDt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const timeStr = `${startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

              return (
                <div key={ev.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-white">{ev.summary}</h5>
                      {ev.hangoutLink && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Video className="w-3 h-3 text-emerald-400" />
                          Meet Ready
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-indigo-300 font-medium">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {timeStr}
                      </span>
                      {ev.attendees && ev.attendees.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {ev.attendees.length} attendee{ev.attendees.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{ev.description}</p>
                    )}
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
                    {ev.htmlLink && !ev.hangoutLink && (
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Google Calendar
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteConfirmId(ev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-base text-white">Delete Calendar Event?</h4>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this event from Google Calendar? This action will remove the event for all attendees.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteConfirmId)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer border-none"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateEvent} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Schedule Google Calendar Event
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 bg-transparent border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Q3 Project Roadmap & Sync"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Meeting agenda and discussion topics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Attendees (comma separated emails)</label>
                <input
                  type="text"
                  placeholder="john@example.com, sarah@company.com"
                  value={attendeesInput}
                  onChange={(e) => setAttendeesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addMeetCheck"
                  checked={addMeet}
                  onChange={(e) => setAddMeet(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="addMeetCheck" className="text-slate-200 font-medium cursor-pointer flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" />
                  Add Google Meet video conferencing
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md border-none cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Add to Google Calendar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {content}
    </div>
  );
};
