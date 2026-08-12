import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface ResizablePanelProps {
  id: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsedWidth?: number;
  isCollapsed?: boolean;
  children: ReactNode;
  position?: 'left' | 'right'; // Which side is the handle on? If left, drag left increases width.
  className?: string;
  onReset?: (resetFn: () => void) => void;
}

export default function ResizablePanel({
  id,
  defaultWidth = 260,
  minWidth = 200,
  maxWidth = 400,
  collapsedWidth = 0,
  isCollapsed = false,
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
  const animationFrameRef = useRef<number | null>(null);

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
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setWidth(prev => {
          // If handle is on the right, dragging right (+delta) increases width
          // If handle is on the left, dragging right (+delta) decreases width
          const newWidth = position === 'right' ? prev + delta : prev - delta;
          return Math.max(minWidth, Math.min(maxWidth, newWidth));
        });
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
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [id, minWidth, maxWidth, position, width]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow left click
    if (e.button !== 0) return;
    if (document.body.classList.contains('modal-open')) return;
    
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const currentWidth = isCollapsed ? collapsedWidth : width;

  if (isCollapsed && collapsedWidth === 0) {
    return null; // Don't render anything if completely collapsed and 0 width
  }

  return (
    <div 
      style={{ 
        width: currentWidth, 
        minWidth: currentWidth, 
        maxWidth: currentWidth,
        flexShrink: 0
      }} 
      className={`relative flex transition-[width,min-width,max-width] duration-0 ${className}`}
    >
      {position === 'left' && !isCollapsed && (
        <div 
          className="w-2 absolute left-0 top-0 bottom-0 -translate-x-1/2 flex items-center justify-center bg-transparent hover:bg-indigo-500/50 transition-colors duration-150 cursor-col-resize select-none z-50 group touch-none"
          onPointerDown={handlePointerDown}
        >
          <div className="w-[2px] h-8 bg-slate-300 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100" />
        </div>
      )}
      
      <div className="flex-1 w-full h-full min-w-0 min-h-0 overflow-hidden">
        {children}
      </div>

      {position === 'right' && !isCollapsed && (
        <div 
          className="w-2 absolute right-0 top-0 bottom-0 translate-x-1/2 flex items-center justify-center bg-transparent hover:bg-indigo-500/50 transition-colors duration-150 cursor-col-resize select-none z-50 group touch-none"
          onPointerDown={handlePointerDown}
        >
          <div className="w-[2px] h-8 bg-slate-300 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100" />
        </div>
      )}
    </div>
  );
}
