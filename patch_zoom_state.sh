sed -i '124a\
  const [showZoom, setShowZoom] = useState(true);\
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);\
\
  useEffect(() => {\
    if (showZoom) {\
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);\
      zoomTimeoutRef.current = setTimeout(() => setShowZoom(false), 2500);\
    }\
    return () => {\
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);\
    };\
  }, [showZoom, zoomFactor]);\
' src/components/DcmsCamera.tsx
