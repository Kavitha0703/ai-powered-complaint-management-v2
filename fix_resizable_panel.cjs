const fs = require('fs');
let content = fs.readFileSync('src/components/ResizablePanel.tsx', 'utf-8');

const targetEffect = `  useEffect(() => {
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
        localStorage.setItem(\`dcms_resizable_panel_\${id}\`, width.toString());
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
  }, [id, minWidth, maxWidth, position, width]);`;

const replacementEffect = `  const widthRef = useRef(width);
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

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
        localStorage.setItem(\`dcms_resizable_panel_\${id}\`, widthRef.current.toString());
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
  }, [id, minWidth, maxWidth, position]);`;

content = content.replace(targetEffect, replacementEffect);
fs.writeFileSync('src/components/ResizablePanel.tsx', content);
