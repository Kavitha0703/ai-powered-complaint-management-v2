import React from 'react';
import { GoogleCalendarPanel } from '../components/GoogleCalendarPanel';

export default function CalendarApp() {
  return (
    <div className="h-full w-full bg-[#0B1120] overflow-hidden flex flex-col text-slate-200">
      <GoogleCalendarPanel inline={true} />
    </div>
  );
}
