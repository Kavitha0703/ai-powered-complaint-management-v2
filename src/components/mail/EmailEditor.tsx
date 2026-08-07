import React, { useState } from 'react';
import { Type, Image, Link, List, Minus, Layout, MessageSquare, Save, Eye, MousePointerSquareDashed } from 'lucide-react';
import { Button } from "../../../components/ui/button";

export type BlockType = 'heading' | 'paragraph' | 'button' | 'card' | 'divider' | 'signature';

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: any;
}

interface EmailEditorProps {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
}

export function EmailEditor({ blocks, onChange }: EmailEditorProps) {
  const addBlock = (type: BlockType) => {
    onChange([...blocks, { id: Math.random().toString(36).substring(7), type, content: type === 'divider' ? '' : 'New ' + type }]);
  };

  const updateBlock = (id: string, newContent: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const updateMetadata = (id: string, metadata: any) => {
    onChange(blocks.map(b => b.id === id ? { ...b, metadata: { ...b.metadata, ...metadata } } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mx-2">Insert Blocks</span>
        <button onClick={() => addBlock('heading')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs"><Type className="w-3.5 h-3.5"/> Heading</button>
        <button onClick={() => addBlock('paragraph')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs"><Type className="w-3.5 h-3.5"/> Paragraph</button>
        <button onClick={() => addBlock('button')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs"><MousePointerSquareDashed className="w-3.5 h-3.5"/> Button</button>
        <button onClick={() => addBlock('card')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs"><Layout className="w-3.5 h-3.5"/> Card</button>
        <button onClick={() => addBlock('divider')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs"><Minus className="w-3.5 h-3.5"/> Divider</button>
        <button onClick={() => addBlock('signature')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5"/> Signature</button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#070c15]/50">
        <div className="max-w-2xl mx-auto space-y-4">
          {blocks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              Start by adding blocks from the toolbar above.
            </div>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                
                {/* Block Delete */}
                <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => removeBlock(block.id)} className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full p-1 shadow-sm">
                    <Minus className="w-3 h-3" />
                  </button>
                </div>

                {block.type === 'heading' && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
                    placeholder="Heading text..."
                  />
                )}
                {block.type === 'paragraph' && (
                  <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    className="w-full text-base bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 resize-none min-h-[60px]"
                    placeholder="Paragraph text..."
                  />
                )}
                {block.type === 'button' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-md outline-none text-sm w-48"
                      placeholder="Button text..."
                    />
                    <input
                      type="text"
                      value={block.metadata?.url || ''}
                      onChange={(e) => updateMetadata(block.id, { url: e.target.value })}
                      className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 text-sm outline-none"
                      placeholder="Button URL..."
                    />
                  </div>
                )}
                {block.type === 'card' && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-950">
                    <input
                      type="text"
                      value={block.metadata?.title || ''}
                      onChange={(e) => updateMetadata(block.id, { title: e.target.value })}
                      className="w-full text-xs font-bold uppercase tracking-wider bg-transparent border-none focus:outline-none mb-2 text-slate-500"
                      placeholder="CARD TITLE"
                    />
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300 resize-none min-h-[40px]"
                      placeholder="Card content (key-value pairs or text)..."
                    />
                  </div>
                )}
                {block.type === 'divider' && (
                  <div className="py-4"><hr className="border-slate-200 dark:border-slate-800" /></div>
                )}
                {block.type === 'signature' && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none font-medium text-slate-900 dark:text-white"
                      placeholder="Sign off (e.g., Regards, The Team)"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
