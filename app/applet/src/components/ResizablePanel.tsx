import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface ResizablePanelProps {
  id: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  children: ReactNode;
  position?: 'left' | 'right';
  className?: string;
  onReset?: (resetFn: () => void) => void;
}

export default function ResizablePanel({
  id,
  defaultWidth = 260,
  minWidth = 200,
  maxWidth = 400,
  children,
  position = 'right',
  className = '',
  onReset
}: ResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(`dcms_resizable_panel_${id}`);
    return saved ? parseInt(saved, 10) : defaultWidth;
  });

  const isResizing = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    if (onReset) {
      onReset(() => {
        setWidth(defaultWidth);
        localStorage.removeItem(`dcms_resizable_panel_${id}`);
      });
    }
  }, [id, defaultWidth, onReset]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isResizing.current) return;
      
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      
      setWidth(prev => {
        const newWidth = position === 'right' ? prev + delta : prev - delta;
        return Math.max(minWidth, Math.min(maxWidth, newWidth));
      });
    };

    const handlePointerUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        localStorage.setItem(`dcms_resizable_panel_${id}`, width.toString());
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [id, minWidth, maxWidth, position, width]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizing.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div style={{ width, minWidth, maxWidth }} className={`relative flex shrink-0 ${className}`}>
      {position === 'left' && (
        <div 
          className="w-1.5 absolute left-0 top-0 bottom-0 -translate-x-1/2 flex items-center justify-center bg-transparent hover:bg-indigo-500 transition-colors duration-150 cursor-col-resize select-none z-50 group"
          onPointerDown={handlePointerDown}
        >
          <div className="w-[3px] h-8 bg-slate-300 dark:bg-slate-600 rounded-full opacity-60 group-hover:opacity-100" />
        </div>
      )}
      
      <div className="flex-1 w-full h-full overflow-hidden">
        {children}
      </div>

      {position === 'right' && (
        <div 
          className="w-1.5 absolute right-0 top-0 bottom-0 translate-x-1/2 flex items-center justify-center bg-transparent hover:bg-indigo-500 transition-colors duration-150 cursor-col-resize select-none z-50 group"
          onPointerDown={handlePointerDown}
        >
          <div className="w-[3px] h-8 bg-slate-300 dark:bg-slate-600 rounded-full opacity-60 group-hover:opacity-100" />
        </div>
      )}
    </div>
  );
}
