import React from 'react';
import { Bold, Italic, Underline, Link2, List, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, MessageSquare } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function RichTextEditor({ value, onChange, placeholder, className, rows = 8 }: Props) {
  const insertText = (before: string, after: string = '') => {
    onChange(value + before + 'text' + after);
  };

  return (
    <div className={`flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 ${className}`}>
      <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button type="button" onClick={() => insertText('**', '**')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Bold"><Bold className="w-3.5 h-3.5"/></button>
        <button type="button" onClick={() => insertText('_', '_')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Italic"><Italic className="w-3.5 h-3.5"/></button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <button type="button" onClick={() => insertText('## ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Heading"><Heading2 className="w-3.5 h-3.5"/></button>
        <button type="button" onClick={() => insertText('- ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="List"><List className="w-3.5 h-3.5"/></button>
        <button type="button" onClick={() => insertText('[Link](https://)')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Link"><Link2 className="w-3.5 h-3.5"/></button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <button type="button" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Align Left"><AlignLeft className="w-3.5 h-3.5"/></button>
        <button type="button" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Align Center"><AlignCenter className="w-3.5 h-3.5"/></button>
      </div>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-none text-sm text-slate-800 dark:text-slate-200 p-4 focus:outline-none focus:ring-0 leading-relaxed resize-y"
      />
    </div>
  );
}
