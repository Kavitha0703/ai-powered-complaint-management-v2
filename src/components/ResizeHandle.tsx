import React, { useEffect, useRef } from 'react';

export default function ResizeHandle({ 
  onResize, 
  onResizeEnd
}: { 
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}) {
  const isResizing = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const delta = clientX - lastX.current;
      lastX.current = clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        if (onResizeEnd) onResizeEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [onResize, onResizeEnd]);

  return (
    <div 
      className="w-1 hover:w-1.5 shrink-0 relative flex items-center justify-center bg-slate-200 hover:bg-indigo-500 dark:bg-slate-800 dark:hover:bg-indigo-600 transition-all duration-150 cursor-col-resize select-none z-50 group"
      onMouseDown={(e) => {
        e.preventDefault();
        isResizing.current = true;
        lastX.current = e.clientX;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }}
      onTouchStart={(e) => {
        isResizing.current = true;
        lastX.current = e.touches[0].clientX;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }}
    >
      <div className="w-[3px] h-8 bg-slate-400 dark:bg-slate-600 rounded-full opacity-60 group-hover:opacity-100" />
    </div>
  );
}
