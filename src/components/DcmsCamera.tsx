import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, Camera, RefreshCw, Sparkles, Crop, Edit3, Check, Trash2, ArrowLeft, 
  MapPin, Clock, Building, Bot, AlertTriangle, Image as ImageIcon, Sliders, 
  ZoomIn, Type, Circle, ArrowRight, Shield, CheckCircle2, DownloadCloud, Loader2,
  FileText, Activity, Layers, Maximize, Settings, Grid, Upload, Scan, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SupportAttachment } from "../types";

interface DcmsCameraProps {
  onClose: () => void;
  onCapturePhotos: (photos: SupportAttachment[]) => void;
  initialMode?: "standard" | "document" | "hd" | "lowlight" | "ai" | "ultraclear";
}

// Simulated Office Mock Templates for Desktop / Denied Permissions
const CAMERA_TEMPLATES = [
  {
    id: "printer",
    name: "Broken Office Xerox C405 (Hardware Jam)",
    category: "IT & Systems",
    detectedObject: "Xerox Printer C405",
    confidence: 0.98,
    ocrText: "ERROR CODE: JAM-FUSER-03\nSTATUS: OFFLINE\nLOCATION: Ground Floor Lobby\nPLEASE REPLACE ROLLER UNIT",
    src: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=80",
    suggestedCategory: "IT & Systems",
    suggestedSeverity: "Medium",
    suggestedTitle: "Xerox Printer Jam - Ground Floor Lobby (Fuser Error 03)"
  },
  {
    id: "salary_slip",
    name: "Salary Discrepancy (Printed Wage Document)",
    category: "Finance & Payroll",
    detectedObject: "Financial Salary Statement",
    confidence: 0.96,
    ocrText: "EMPLOYEE ID: EMP-40293\nMONTH: JUNE 2026\nBASE SALARY: $4,500.00\nDISBURSED AMOUNT: $3,200.00\nUNACCOUNTED DEDUCTION: -$1,300.00",
    src: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800&auto=format&fit=crop&q=80",
    suggestedCategory: "Finance & Payroll",
    suggestedSeverity: "Urgent",
    suggestedTitle: "Salary Underpayment Discrepancy - EMP-40293 (June 2026)"
  },
  {
    id: "badge",
    name: "Damaged Key Card Badge (Biometric Access)",
    category: "Human Resources Relations",
    detectedObject: "RFID Proximity Key Card",
    confidence: 0.94,
    ocrText: "WORKPLACE LOGISTICS INC.\nNAME: NASIKA KAVITHA\nROLE: ASSOCIATE SPECIALIST\nSERIAL NO: RFID-209384-A\nERROR: CHIP READ FAILURE",
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    suggestedCategory: "Human Resources Relations",
    suggestedSeverity: "Low",
    suggestedTitle: "Damaged Proximity Access Key Card Replacement Required"
  },
  {
    id: "leak",
    name: "Ceiling Pipeline Leaking (Facilities Damage)",
    category: "Facilities Management",
    detectedObject: "Damaged Ceiling Pipe (Water Leakage)",
    confidence: 0.99,
    ocrText: "WARN: WET FLOOR AREA\nFACILITIES TAG: ZONE-B-12\nPRESSURE DROP IN MAIN FEEDER\nIN-PERSON ATTENDANCE REQUESTED",
    src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
    suggestedCategory: "Facilities Management",
    suggestedSeverity: "Critical",
    suggestedTitle: "Water Pipeline Leakage at Zone B-12 Ceiling"
  },
  {
    id: "server",
    name: "Main Network Server Row 1 Fault",
    category: "IT & Systems",
    detectedObject: "Network Cisco Rack Core Switch",
    confidence: 0.97,
    ocrText: "CISCO SYSTEMS CATALYST 9300\nLINK LED: AMBER (FAULT)\nPORT STATUS: 12 PORTS DISCONNECTED\nDOWNTIME DURATION: 28 MINUTES",
    src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
    suggestedCategory: "IT & Systems",
    suggestedSeverity: "Critical",
    suggestedTitle: "Network Cisco Rack core switch Link Amber Fault"
  }
];

// Simulated Selfie Mock Templates for Identity Check
const SELFIE_TEMPLATES = [
  {
    id: "selfie_verification",
    name: "Employee Identity Selfie (Biometric Check)",
    category: "Human Resources Relations",
    detectedObject: "Employee Face Verified (Kavitha)",
    confidence: 0.99,
    ocrText: "FACIAL BIOMETRICS: PASSED\nEMPLOYEE NAME: NASIKA KAVITHA\nROLE: SYSTEM TRIAGE SUPERVISOR\nAUTHENTICATION STAMP: INTEGRITY_OK",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
    suggestedCategory: "Human Resources Relations",
    suggestedSeverity: "Low",
    suggestedTitle: "Biometric Identity Verification Selfie - Nasika Kavitha"
  },
  {
    id: "selfie_hold_badge",
    name: "Verification Selfie holding Physical ID Card",
    category: "Human Resources Relations",
    detectedObject: "Employee Face & RFID Badge Match",
    confidence: 0.97,
    ocrText: "FACIAL PATTERN MATCHED\nHOLDING BADGE SERIAL: RFID-209384-A\nVERIFIED MATCH BY SYSTEM COMPLIANCE",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80",
    suggestedCategory: "Human Resources Relations",
    suggestedSeverity: "Medium",
    suggestedTitle: "Biometric Verification Selfie with physical RFID Card"
  }
];

export default function DcmsCamera({ onClose, onCapturePhotos, initialMode = "standard" }: DcmsCameraProps) {
    
  // Navigation Screens: "capture" | "preview" | "annotate" | "permission_denied"
  const [screen, setScreen] = useState<"capture" | "preview" | "annotate">("capture");
  
  // Camera feed states
  const [activeMode, setActiveMode] = useState(initialMode);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isHdrOn, setIsHdrOn] = useState(true);
  const [focusLocked, setFocusLocked] = useState(false);
  const [focusStatus, setFocusStatus] = useState("Adjusting auto-focus...");
  const [zoomFactor, setZoomFactor] = useState(1);
  const [showZoom, setShowZoom] = useState(true);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showZoom) {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => setShowZoom(false), 2500);
    }
    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, [showZoom, zoomFactor]);

  const [resolution, setResolution] = useState("1080p");
  
  // High-End camera firmware additions
  const [cameraStatusMessage, setCameraStatusMessage] = useState<string>("Looking for camera...");
  const [gridOn, setGridOn] = useState(false);
  const [autoFocusOn, setAutoFocusOn] = useState(true);
  const [aiEnhanceOn, setAiEnhanceOn] = useState(true);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Multiple Photos Captures Storage
  const [capturedPhotos, setCapturedPhotos] = useState<SupportAttachment[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Preview editing states
  const [editingImage, setEditingImage] = useState<string>(""); // base64 source
  const [originalImage, setOriginalImage] = useState<string>(""); // backup for restore original
  const [showOriginalToggle, setShowOriginalToggle] = useState(false);
  const [isAutoEnhancingBeforeUpload, setIsAutoEnhancingBeforeUpload] = useState(false);
  const [enhancingStep, setEnhancingStep] = useState("");
  const [rotationAngle, setRotationAngle] = useState(0); // 0, 90, 180, 270
  const [enhanceSettings, setEnhanceSettings] = useState({
    sharpness: 60,
    brightness: 50,
    contrast: 50,
    noiseReduction: 40,
    blurReduction: 70
  });
  const [autoEnhanced, setAutoEnhanced] = useState(false);
  
  // Interactive Annotation state
  const [annotationMode, setAnnotationMode] = useState<"none" | "draw" | "circle" | "arrow" | "text">("none");
  const [brushColor, setBrushColor] = useState("#EF4444"); // Red by default
  const [textLabelInput, setTextLabelInput] = useState("");

  // AI Intelligence checks & OCR Simulation variables
  const [detectedObject, setDetectedObject] = useState<string>("");
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [extractedOcrText, setExtractedOcrText] = useState<string>("");
  const [suggestedTicketMeta, setSuggestedTicketMeta] = useState<{
    category: string;
    severity: string;
    title: string;
  } | null>(null);

  // Quality check warnings
  const [qualityScore, setQualityScore] = useState<number>(95); // score 0-100
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [showQualityWarningModal, setShowQualityWarningModal] = useState(false);

  // Cropping variables
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 }); // percent representation
  const [cropActive, setCropActive] = useState(false);
  const [cropAspectRatio, setCropAspectRatio] = useState<string>("free");
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [previewPan, setPreviewPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showAutoCropPrompt, setShowAutoCropPrompt] = useState(true);
  const [autoCropApplied, setAutoCropApplied] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [magnifierOffset, setMagnifierOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartBox = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Touch Gestures, Pinch Zoom & Tap to Focus states
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const [focusRingPos, setFocusRingPos] = useState<{ x: number; y: number } | null>(null);
  const [showFocusRing, setShowFocusRing] = useState(false);

  // DOM elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Callback ref to reliably attach stream when element mounts
  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.onloadedmetadata = async () => {
        try {
          await node.play();
        } catch (e) {
          console.warn("Video loadedmetadata play failed:", e);
        }
      };
      // Immediate play fallback
      node.play().catch(e => console.warn("Immediate video play failed:", e));
    }
  }, []);

  // Annotation Drawing Variables
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const drawHistoryRef = useRef<ImageData[]>([]);

  // 1. Initialize Camera or fallback
  useEffect(() => {
    initCameraFeed();
    return () => {
      stopCameraStream();
    };
  }, [selectedDeviceId, facingMode, resolution]);

  // Trigger camera tour once upon mount
  useEffect(() => {
    const completed = localStorage.getItem("dcms_tour_completed_camera");
    if (!completed) {
      const tourTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent("start-product-tour", { detail: { name: "camera" } }));
      }, 1000);
      return () => clearTimeout(tourTimer);
    }
  }, []);

  // Simulate auto focus sequence
  useEffect(() => {
    if (screen === "capture" && autoFocusOn) {
      setFocusLocked(false);
      setFocusStatus("Calibrating lenses...");
      const t1 = setTimeout(() => {
        setFocusStatus("Adjusting focus metrics...");
      }, 1200);
      const t2 = setTimeout(() => {
        setFocusLocked(true);
        setFocusStatus(facingMode === "environment" ? "Rear Camera Ready ✓" : "Front Camera Ready ✓");
      }, 2400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (!autoFocusOn) {
      setFocusLocked(false);
      setFocusStatus("Manual Focus active");
    }
  }, [screen, activeMode, zoomFactor, autoFocusOn, facingMode]);

  const initCameraFeed = async () => {
    stopCameraStream();
    setCameraPermissionError(false);
    setCameraStatusMessage("Looking for camera...");

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId } }
          : { 
              facingMode: facingMode,
              width: resolution === "4k" ? { ideal: 3840 } : resolution === "1080p" ? { ideal: 1920 } : { ideal: 1280 },
              height: resolution === "4k" ? { ideal: 2160 } : resolution === "1080p" ? { ideal: 1080 } : { ideal: 720 },
            },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsStreamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly play to prevent black screen on some browsers
        await videoRef.current.play().catch(e => console.warn("Video element play request caught:", e));
      }

      // Check the active track metadata
      const activeTrack = stream.getVideoTracks()[0];
      const label = activeTrack?.label?.toLowerCase() || "";
      const isActuallyFront = label.includes("front") || label.includes("user") || label.includes("selfie");

      if (facingMode === "environment" && isActuallyFront) {
        setCameraStatusMessage("Rear camera unavailable. Switching to Front Camera...");
        setFacingMode("user");
      } else {
        setCameraStatusMessage(facingMode === "environment" ? "Rear Camera Selected ✓" : "Front Camera Selected ✓");
      }

      // Enumerate available cameras
      const devicesList = await navigator.mediaDevices.enumerateDevices();
      const cameras = devicesList.filter(d => d.kind === "videoinput");
      setDevices(cameras);
    } catch (err) {
      console.warn("Real webcam not available or blocked. Activating simulated smart environment camera.", err);
      // Try to open front camera if environment failed
      if (facingMode === "environment") {
        setCameraStatusMessage("Rear camera unavailable. Switching to Front Camera...");
        try {
          const fallbackConstraints: MediaStreamConstraints = {
            video: { 
              facingMode: "user",
              width: resolution === "4k" ? { ideal: 3840 } : resolution === "1080p" ? { ideal: 1920 } : { ideal: 1280 },
              height: resolution === "4k" ? { ideal: 2160 } : resolution === "1080p" ? { ideal: 1080 } : { ideal: 720 },
            },
            audio: false
          };
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          streamRef.current = stream;
          setIsStreamActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(e => console.warn(e));
          }
          setFacingMode("user");
          setCameraStatusMessage("Front Camera Selected ✓");
          return;
        } catch (fallbackErr) {
          console.warn("Selfie camera fallback failed", fallbackErr);
        }
      }
      setCameraPermissionError(true);
      setIsStreamActive(false);
      setCameraStatusMessage("Camera blocked or unavailable.");
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreamActive(false);
  };

  // 2. Select a simulated template to trigger mock capturing
  const selectMockTemplate = (templateId: string) => {
    const template = CAMERA_TEMPLATES.find(t => t.id === templateId) || SELFIE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Simulate instant capture to preview
    setEditingImage(template.src);
    setOriginalImage(template.src);
    setRotationAngle(0);
    setAutoEnhanced(false);
    setEnhanceSettings({
      sharpness: 60,
      brightness: 50,
      contrast: 50,
      noiseReduction: 40,
      blurReduction: 70
    });

    // Run Simulated AI analysis & quality scoring
    setDetectedObject(template.detectedObject);
    setDetectionConfidence(template.confidence);
    setExtractedOcrText(template.ocrText);
    setSuggestedTicketMeta({
      category: template.suggestedCategory,
      severity: template.suggestedSeverity,
      title: template.suggestedTitle
    });

    // Quality parameters randomizer
    const score = Math.floor(Math.random() * 15) + 85; // 85 - 100
    setQualityScore(score);
    setQualityWarnings([]);

    // Proceed to preview screen
    setScreen("preview");
  };

  // Switch camera direction
  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setSelectedDeviceId(""); // clear locked ID so constraints resolve dynamically
    setCameraStatusMessage(nextFacing === "environment" ? "Rear Camera Selected ✓" : "Front Camera Selected ✓");
  };

  // Pinch-to-zoom Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomFactor;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      let targetZoom = touchStartZoomRef.current * ratio;
      // Clamp between 0.5x and 5x
      targetZoom = Math.max(0.5, Math.min(5, Math.round(targetZoom * 10) / 10));
      setZoomFactor(targetZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Tap-to-focus Click Handler
  const handleTapToFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusRingPos({ x, y });
    setShowFocusRing(true); setShowZoom(true);
    setFocusLocked(false);
    setFocusStatus("Locking Auto Focus...");

    setTimeout(() => {
      setFocusLocked(true);
      setFocusStatus("✓ Focus Locked");
    }, 1200);

    // Hide reticle after 2.5 seconds
    setTimeout(() => {
      setShowFocusRing(false);
    }, 2500);
  };

  // Real or mock capture event trigger
  const triggerCapture = () => {
    // If real stream is active, capture frame from video via canvas
    if (isStreamActive && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // apply mirroring for user-facing camera
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        // Apply automatic AI mode-based filters for immediate premium image adjustment
        if (activeMode === "document" || activeMode === "whiteboard" || activeMode === "ocr" || activeMode === "textenhance") {
          ctx.filter = "contrast(1.45) saturate(0.7) brightness(1.05) grayscale(0.2)";
        } else if (activeMode === "night" || activeMode === "lowlight") {
          ctx.filter = "brightness(1.35) contrast(1.15) saturate(1.1)";
        } else if (activeMode === "hd" || activeMode === "ultraclear") {
          ctx.filter = "contrast(1.12) brightness(1.02) saturate(1.05)";
        } else if (activeMode === "portrait") {
          ctx.filter = "contrast(1.02) brightness(1.04) saturate(1.15)";
        } else if (activeMode === "macro") {
          ctx.filter = "contrast(1.2) brightness(1.0) saturate(1.1)";
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Reset filter
        ctx.filter = "none";

        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setEditingImage(dataUrl);
        setOriginalImage(dataUrl);
        
        // Randomly generate object detection and OCR based on current mode
        generateRealCaptureIntelligence();
        setScreen("preview");
      }
    } else {
      // If no webcam is active, open standard fallback selector
      const randomT = CAMERA_TEMPLATES[Math.floor(Math.random() * CAMERA_TEMPLATES.length)];
      selectMockTemplate(randomT.id);
    }
  };

  const generateRealCaptureIntelligence = () => {
    // Assign generic hardware diagnosis metadata
    const templates = [
      {
        detectedObject: "Electronic Circuit Board / Diagnostic Screen",
        ocrText: "SYS_DIAGNOSTIC_ERR_0x0029F\nSTATUS: CORE_TEMP_ALERT\nFAN SPEED: 0 RPM (BLOCKED)\nSYSTEM VOLTAGE: 1.2V NOMINAL",
        suggestedCategory: "IT & Systems",
        suggestedSeverity: "Urgent",
        suggestedTitle: "Electronic Diagnostic Screen Overheat Alert (Error 0x0029F)"
      },
      {
        detectedObject: "Paper Document Letterhead",
        ocrText: "MEMORANDUM TO STAFF\nSUBJECT: RETIREE WAGE PROTOCOL\nAUTHORIZED STAMP RECEIVED\nDATE: JUNE 18, 2026",
        suggestedCategory: "Other",
        suggestedSeverity: "Low",
        suggestedTitle: "Document Staff Memorandum Audit Request"
      }
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    setDetectedObject(pick.detectedObject);
    setDetectionConfidence(0.92);
    setExtractedOcrText(pick.ocrText);
    setSuggestedTicketMeta({
      category: pick.suggestedCategory,
      severity: pick.suggestedSeverity,
      title: pick.suggestedTitle
    });

    // Simulate warning occasionally
    const rand = Math.random();
    if (rand < 0.4) {
      setQualityScore(72);
      setQualityWarnings(["⚠️ Mild blur detected in upper right corner.", "⚠️ Low ambient lighting in center frame."]);
    } else {
      setQualityScore(94);
      setQualityWarnings([]);
    }
    setRotationAngle(0);
    setAutoEnhanced(false);
  };

  // Helper values and interactive dragging handlers for Crop Workspace
  const getAspectRatioValue = (ratio: string): number => {
    switch (ratio) {
      case "1:1": return 1;
      case "4:3": return 4 / 3;
      case "16:9": return 16 / 9;
      case "doc": return 8.5 / 11;
      case "receipt": return 0.4;
      case "idcard": return 1.57;
      default: return 1;
    }
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, handleType: string) => {
    e.stopPropagation();
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    dragStartBox.current = { ...cropBox };
    setActiveDrag(handleType);
  };

  useEffect(() => {
    if (!activeDrag || !cropContainerRef.current) return;

    const handleMove = (clientX: number, clientY: number) => {
      const rect = cropContainerRef.current!.getBoundingClientRect();
      const dx = ((clientX - dragStartPos.current.x) / rect.width) * 100;
      const dy = ((clientY - dragStartPos.current.y) / rect.height) * 100;

      let nextBox = { ...dragStartBox.current };
      const minSize = 10;

      switch (activeDrag) {
        case "move": {
          nextBox.x = Math.max(0, Math.min(100 - nextBox.w, dragStartBox.current.x + dx));
          nextBox.y = Math.max(0, Math.min(100 - nextBox.h, dragStartBox.current.y + dy));
          break;
        }
        case "nw": {
          const newX = Math.max(0, Math.min(dragStartBox.current.x + dragStartBox.current.w - minSize, dragStartBox.current.x + dx));
          const newW = dragStartBox.current.w - (newX - dragStartBox.current.x);
          const newY = Math.max(0, Math.min(dragStartBox.current.y + dragStartBox.current.h - minSize, dragStartBox.current.y + dy));
          const newH = dragStartBox.current.h - (newY - dragStartBox.current.y);
          nextBox = { x: newX, y: newY, w: newW, h: newH };
          break;
        }
        case "ne": {
          const newY = Math.max(0, Math.min(dragStartBox.current.y + dragStartBox.current.h - minSize, dragStartBox.current.y + dy));
          const newH = dragStartBox.current.h - (newY - dragStartBox.current.y);
          const newW = Math.max(minSize, Math.min(100 - dragStartBox.current.x, dragStartBox.current.w + dx));
          nextBox = { ...nextBox, y: newY, h: newH, w: newW };
          break;
        }
        case "se": {
          const newW = Math.max(minSize, Math.min(100 - dragStartBox.current.x, dragStartBox.current.w + dx));
          const newH = Math.max(minSize, Math.min(100 - dragStartBox.current.y, dragStartBox.current.h + dy));
          nextBox = { ...nextBox, w: newW, h: newH };
          break;
        }
        case "sw": {
          const newX = Math.max(0, Math.min(dragStartBox.current.x + dragStartBox.current.w - minSize, dragStartBox.current.x + dx));
          const newW = dragStartBox.current.w - (newX - dragStartBox.current.x);
          const newH = Math.max(minSize, Math.min(100 - dragStartBox.current.y, dragStartBox.current.h + dy));
          nextBox = { ...nextBox, x: newX, w: newW, h: newH };
          break;
        }
        case "n": {
          const newY = Math.max(0, Math.min(dragStartBox.current.y + dragStartBox.current.h - minSize, dragStartBox.current.y + dy));
          const newH = dragStartBox.current.h - (newY - dragStartBox.current.y);
          nextBox = { ...nextBox, y: newY, h: newH };
          break;
        }
        case "s": {
          const newH = Math.max(minSize, Math.min(100 - dragStartBox.current.y, dragStartBox.current.h + dy));
          nextBox = { ...nextBox, h: newH };
          break;
        }
        case "w": {
          const newX = Math.max(0, Math.min(dragStartBox.current.x + dragStartBox.current.w - minSize, dragStartBox.current.x + dx));
          const newW = dragStartBox.current.w - (newX - dragStartBox.current.x);
          nextBox = { ...nextBox, x: newX, w: newW };
          break;
        }
        case "e": {
          const newW = Math.max(minSize, Math.min(100 - dragStartBox.current.x, dragStartBox.current.w + dx));
          nextBox = { ...nextBox, w: newW };
          break;
        }
      }

      if (cropAspectRatio && cropAspectRatio !== "free") {
        const ratio = getAspectRatioValue(cropAspectRatio);
        const containerRatio = rect.width / rect.height;
        const targetPctRatio = ratio / containerRatio;

        if (activeDrag === "e" || activeDrag === "w" || activeDrag === "move") {
          nextBox.h = nextBox.w / targetPctRatio;
          if (nextBox.y + nextBox.h > 100) {
            nextBox.h = 100 - nextBox.y;
            nextBox.w = nextBox.h * targetPctRatio;
          }
        } else {
          nextBox.w = nextBox.h * targetPctRatio;
          if (nextBox.x + nextBox.w > 100) {
            nextBox.w = 100 - nextBox.x;
            nextBox.h = nextBox.w / targetPctRatio;
          }
        }
      }

      // Compute magnifier offset percent
      let handleX = 0;
      let handleY = 0;
      if (activeDrag === "nw") { handleX = nextBox.x; handleY = nextBox.y; }
      else if (activeDrag === "ne") { handleX = nextBox.x + nextBox.w; handleY = nextBox.y; }
      else if (activeDrag === "se") { handleX = nextBox.x + nextBox.w; handleY = nextBox.y + nextBox.h; }
      else if (activeDrag === "sw") { handleX = nextBox.x; handleY = nextBox.y + nextBox.h; }
      else { handleX = nextBox.x + nextBox.w / 2; handleY = nextBox.y + nextBox.h / 2; }
      
      setMagnifierOffset({ x: handleX, y: handleY });
      setCropBox(nextBox);
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleDragEnd = () => {
      setActiveDrag(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleWindowTouchMove, { passive: true });
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [activeDrag, cropAspectRatio]);

  const applyAutoCrop = () => {
    setCropBox({ x: 15, y: 12, w: 70, h: 76 });
    setCropAspectRatio("doc");
    setAutoCropApplied(true);
    setQualityScore(98);
    setQualityWarnings([]);
  };

  const handleResetCrop = () => {
    setCropBox({ x: 10, y: 10, w: 80, h: 80 });
    setCropAspectRatio("free");
    setPreviewZoom(1);
    setPreviewPan({ x: 0, y: 0 });
    setAutoCropApplied(false);
  };

  const applyCropAndOCR = () => {
    setIsOcrLoading(true);
    renderProcessedImageToDataUrl((croppedUrl) => {
      setEditingImage(croppedUrl);
      setCropActive(false);
      setRotationAngle(0);
      setCropBox({ x: 10, y: 10, w: 80, h: 80 });
      setPreviewZoom(1);
      setPreviewPan({ x: 0, y: 0 });

      setTimeout(() => {
        let simulatedText = "";
        const sampleLines = [
          "CASE ID: #9821A-2026",
          "EMPLOYMENT REGISTER: COMPLAINT FILED",
          "STATUS: AUDIT REQUIRED",
          "BASIC PAY: ₹42,000",
          "INCREMENT DELAYED: ₹0",
          "TOTAL LOSS ESTIMATE: ₹14,200",
          "AUTHORIZED SIGNATORY STAMP: RECEIVED"
        ];
        const lineCount = Math.floor(Math.random() * 2) + 1;
        const selected = [];
        for (let i = 0; i < lineCount; i++) {
          selected.push(sampleLines[Math.floor(Math.random() * sampleLines.length)]);
        }
        simulatedText = "• CROPPED REGION READ:\n" + selected.join("\n");

        setExtractedOcrText(simulatedText);
        setIsOcrLoading(false);
        
        if (simulatedText.includes("INCREMENT DELAYED") || simulatedText.includes("LOSS") || simulatedText.includes("PAY")) {
          setSuggestedTicketMeta({
            category: "Salary & Compensation",
            severity: "High",
            title: "Salary Dispute / Wage Non-Payment Evidence"
          });
        }
      }, 900);
    });
  };

  // Zoom/Pan helpers inside Cropping Mode
  const handlePreviewWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!cropActive) return;
    const zoomIntensity = 0.15;
    let nextZoom = previewZoom + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity);
    nextZoom = Math.max(1, Math.min(4, nextZoom));
    setPreviewZoom(nextZoom);
    if (nextZoom === 1) {
      setPreviewPan({ x: 0, y: 0 });
    }
  };

  const handlePanStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (previewZoom <= 1 || activeDrag) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setIsPanning(true);
    panStart.current = { x: clientX - previewPan.x, y: clientY - previewPan.y };
  };

  const handlePanMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setPreviewPan({
      x: clientX - panStart.current.x,
      y: clientY - panStart.current.y
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Image processing: rotation
  const handleRotate = () => {
    setRotationAngle((prev) => (prev + 90) % 360);
  };

  const handleRestoreOriginal = () => {
    setEnhanceSettings({
      sharpness: 60,
      brightness: 50,
      contrast: 50,
      noiseReduction: 40,
      blurReduction: 70
    });
    setRotationAngle(0);
    setCropActive(false);
    setAutoEnhanced(false);
    if (originalImage) {
      setEditingImage(originalImage);
    }
  };

  // Image Processing: Auto Enhance pipeline
  const applyAutoEnhance = () => {
    setAutoEnhanced(true);
    setEnhanceSettings({
      sharpness: 90,
      brightness: 62,
      contrast: 72,
      noiseReduction: 15,
      blurReduction: 95
    });
  };

  // Prepare full canvas draw (rotations, enhancements, crops)
  const renderProcessedImageToDataUrl = (callback: (dataUrl: string) => void) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;

      // Handle rotation swapping width/height
      if (rotationAngle === 90 || rotationAngle === 270) {
        canvas.width = h;
        canvas.height = w;
      } else {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Apply rotations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      // Apply adjustments via standard canvas filters
      const b = enhanceSettings.brightness / 50; // normalized to 1
      const c = enhanceSettings.contrast / 50; // normalized to 1
      const s = enhanceSettings.sharpness / 50; // simulated sharpness

      ctx.filter = `brightness(${b}) contrast(${c}) saturate(${1 + (s - 1) * 0.2})`;
      
      // Draw filtered image on top of itself
      ctx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

      // Process Crop if active
      if (cropActive) {
        const cropCanvas = document.createElement("canvas");
        const cropW = (cropBox.w / 100) * canvas.width;
        const cropH = (cropBox.h / 100) * canvas.height;
        const cropX = (cropBox.x / 100) * canvas.width;
        const cropY = (cropBox.y / 100) * canvas.height;

        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d");
        if (cropCtx) {
          cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          callback(cropCanvas.toDataURL("image/jpeg", 0.92));
          return;
        }
      }

      callback(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = editingImage;
  };

  // Open Annotation Screen
  const handleOpenAnnotation = () => {
    // Generate the baseline enhanced flat image and set to canvas
    renderProcessedImageToDataUrl((processedDataUrl) => {
      setEditingImage(processedDataUrl);
      setRotationAngle(0); // Flattened rotation
      setCropActive(false);
      setScreen("annotate");
      setAnnotationMode("draw");
      
      // Initialize Canvas after element renders
      setTimeout(() => {
        initAnnotationCanvas(processedDataUrl);
      }, 300);
    });
  };

  // Initialize Canvas context for drawing
  const initAnnotationCanvas = (imgSrc: string) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Scale canvas to match viewport container size but preserve full resolution
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const aspectRatio = img.height / img.width;
      
      canvas.width = containerWidth;
      canvas.height = containerWidth * aspectRatio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Save original snapshot state
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      drawHistoryRef.current = [imgData];
    };
    img.src = imgSrc;
  };

  // Drawing mouse handlers
  const handleCanvasStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas || annotationMode === "none") return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    isDrawingRef.current = true;
    lastPosRef.current = { x, y };

    if (annotationMode === "circle" || annotationMode === "arrow") {
      // Save canvas state before drawing shape preview
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        drawHistoryRef.current.push(snap);
      }
    }
  };

  const handleCanvasDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = brushColor;
    ctx.fillStyle = brushColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    if (annotationMode === "draw") {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPosRef.current = { x, y };
    } else if (annotationMode === "circle" || annotationMode === "arrow") {
      // Restore previous state to draw dynamic preview
      if (drawHistoryRef.current.length > 0) {
        ctx.putImageData(drawHistoryRef.current[drawHistoryRef.current.length - 1], 0, 0);
      }

      if (annotationMode === "circle") {
        const radius = Math.sqrt(Math.pow(x - lastPosRef.current.x, 2) + Math.pow(y - lastPosRef.current.y, 2));
        ctx.beginPath();
        ctx.arc(lastPosRef.current.x, lastPosRef.current.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annotationMode === "arrow") {
        // Draw main arrow shaft
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(y - lastPosRef.current.y, x - lastPosRef.current.x);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 15 * Math.cos(angle - Math.PI / 6), y - 15 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x - 15 * Math.cos(angle + Math.PI / 6), y - 15 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  const handleCanvasEndDraw = () => {
    isDrawingRef.current = false;
    const canvas = annotationCanvasRef.current;
    if (canvas && annotationMode === "draw") {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        drawHistoryRef.current.push(snap);
      }
    }
  };

  const handleUndoAnnotation = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas || drawHistoryRef.current.length <= 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawHistoryRef.current.pop(); // Remove current
    const prev = drawHistoryRef.current[drawHistoryRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
  };

  const applyTextAnnotation = () => {
    if (!textLabelInput.trim()) return;
    const canvas = annotationCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Draw text label in center or custom coordinates
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = brushColor;
    
    // Draw background shadow badge for legibility
    const textWidth = ctx.measureText(textLabelInput).width;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(20, 50, textWidth + 16, 36);
    
    ctx.fillStyle = brushColor;
    ctx.fillText(textLabelInput, 28, 76);
    
    setTextLabelInput("");
    setAnnotationMode("draw");

    // Save state
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawHistoryRef.current.push(snap);
  };

  // Complete annotation editing & flatten to base64
  const handleSaveAnnotation = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const finalUrl = canvas.toDataURL("image/jpeg", 0.92);
    setEditingImage(finalUrl);
    setScreen("preview");
  };

  // Add captured photo to the main multi-photo inventory
  const handleAcceptPhoto = () => {
    // Quality Checker Guard
    if (qualityScore < 80 && qualityWarnings.length > 0 && !showQualityWarningModal) {
      setShowQualityWarningModal(true);
      return;
    }

    // Trigger sequential Auto Enhance before upload
    setIsAutoEnhancingBeforeUpload(true);
    setEnhancingStep(1);

    const steps = [
      { step: 1, text: "AI Denoising and Pixel-Level Reconstruction..." },
      { step: 2, text: "Contrast Equalization and Shadow Removal..." },
      { step: 3, text: "Dynamic Text Sharpening and OCR Validation..." },
      { step: 4, text: "Intelligent Resolution Compression (-92%)..." },
      { step: 5, text: "Embedding Smart Evidence Metadata Tagging..." }
    ];

    let currentStepIdx = 0;
    
    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setEnhancingStep(steps[currentStepIdx].step);
      } else {
        clearInterval(interval);
        // Completed - proceed with original attachment finalize
        setIsAutoEnhancingBeforeUpload(false);
        setEnhancingStep(0);
        
        renderProcessedImageToDataUrl((finalBase64) => {
          // Simulate file size calculations
          const mockOrigSize = Math.floor(Math.random() * 3000000) + 2500000; // ~2.5 - 5.5MB
          const mockCompSize = Math.floor(mockOrigSize * 0.08); // optimized compression: ~200 - 440KB

          const newAttachment: SupportAttachment = {
            id: "att-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            name: `Evidence_Snapshot_${capturedPhotos.length + 1}.jpg`,
            type: "image",
            dataUrl: finalBase64,
            size: mockCompSize
          };

          // Set custom intelligence tags on attachment for parent modules to extract!
          (newAttachment as any).detectedObject = detectedObject;
          (newAttachment as any).ocrText = extractedOcrText;
          (newAttachment as any).suggestedMeta = suggestedTicketMeta;

          const updated = [...capturedPhotos, newAttachment];
          setCapturedPhotos(updated);
          
          // Clear analysis temporary state
          setEditingImage("");
          setScreen("capture");
          setShowQualityWarningModal(false);
        });
      }
    }, 450); // Fast, snappy, yet clearly readable and satisfying animation
  };

  // Complete multi-capture and finalize
  const handleFinalizeAllCaptures = () => {
    if (capturedPhotos.length > 0) {
      onCapturePhotos(capturedPhotos);
    }
  };

  const removeCapturedPhoto = (id: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#020617] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* Fullscreen AI Processing Progress Overlay */}
      <AnimatePresence>
        {isAutoEnhancingBeforeUpload && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md z-[100000] flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center space-y-6">
              {/* Dynamic Animated Pulse Ring */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping"></span>
                <span className="absolute inset-2 rounded-full border-2 border-dashed border-violet-500/30 animate-spin"></span>
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg relative">
                  <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">
                  {"Preparing High-Quality Asset"}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {"Optimizing image parameters for complaints administration desk reviews."}</p>
              </div>

              {/* Progress Steps Indicator */}
              <div className="space-y-2 bg-slate-900/50 border border-slate-850 p-4 rounded-2xl text-left">
                {[
                  { step: 1, label: "AI Denoising & Pixel Reconstruction" },
                  { step: 2, label: "Contrast Equalization & Shadow Removal" },
                  { step: 3, label: "Dynamic Text Sharpening & OCR Tuning" },
                  { step: 4, label: "Intelligent Lossless Resolution Compression (-92%)" },
                  { step: 5, label: "Embedding Evidence Metadata & Tagging" }
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3 transition-all">
                    <div className="flex items-center justify-center">
                      {enhancingStep > s.step ? (
                        <span className="text-xs font-mono font-bold text-emerald-400">✓</span>
                      ) : enhancingStep === s.step ? (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-750"></span>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono font-bold leading-none ${
                      enhancingStep === s.step 
                        ? "text-blue-400 animate-pulse font-extrabold" 
                        : enhancingStep > s.step 
                        ? "text-slate-400 line-through decoration-slate-800" 
                        : "text-slate-600"
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Beautiful animated linear progress bar */}
              <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${(enhancingStep / 5) * 100}%` }}
                />
              </div>

              <p className="text-[9px] font-mono font-extrabold text-slate-500 animate-pulse uppercase tracking-wider">
                {"Do not close or leave the viewfinder..."}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ================= HEADER CONTROLS BAR ================= */}
      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-12 px-4 flex items-center justify-between z-50 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all cursor-pointer text-white border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {screen === "capture" && capturedPhotos.length > 0 && (
            <button
              onClick={handleFinalizeAllCaptures}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-extrabold text-[12px] uppercase tracking-wider text-white rounded-full shadow-lg transition-all cursor-pointer"
            >
              {"Done ("}{capturedPhotos.length})
            </button>
          )}

          {screen === "capture" && (
            <button
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
              className="w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all cursor-pointer text-white border border-white/10 shadow"
              title={"Camera Settings"}
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          {screen === "preview" && (
            <div className="flex gap-2">
              <button 
                onClick={applyAutoEnhance}
                disabled={autoEnhanced}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${autoEnhanced ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-lg hover:scale-105"}`}
              >
                <Sparkles className="w-4 h-4" />
                {autoEnhanced ? "Enhanced ✓" : "AI Enhance"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= MAIN CONTENT VIEWFINDER / PREVIEW SCREEN ================= */}
      <div className="flex-1 absolute inset-0 bg-black flex items-center justify-center overflow-hidden z-0">
        
        {/* SCREEN 1: CAPTURE VIEW (WEBCAM OR SIMULATION CHOOSE) */}
        {screen === "capture" && (
          <div className="w-full h-full relative flex flex-col justify-between">
            {/* Camera Viewfinder with Gesture Switch and Touch Interaction */}
            <div 
              onDoubleClick={handleToggleFacingMode}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleTapToFocus}
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black z-0 cursor-pointer"
              title={"Double tap to flip, pinch to zoom, tap to focus"}
            >
              {isStreamActive ? (
                <>
                  <video
                    ref={videoRefCallback}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transition-transform"
                    style={{ transform: `scale(${zoomFactor}) ${facingMode === "user" ? "scaleX(-1)" : ""}` }}
                  />

                  {/* Focus Ring Reticle */}
                  {showFocusRing && focusRingPos && (
                    <div 
                      className="absolute border-2 border-yellow-400 rounded-full w-14 h-14 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center animate-pulse"
                      style={{ left: focusRingPos.x, top: focusRingPos.y }}
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>
                  )}

                  {/* Google Camera Style Zoom Presets overlay */}
                  <AnimatePresence>
                  {showZoom && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-black/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 z-30 backdrop-blur-md"
                    >
                    {[0.5, 1, 2, 3, 5].map((z) => (
                      <button
                        key={z}
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomFactor(z);
                        }}
                        className={`w-7 h-7 rounded-full text-[10px] font-mono font-black transition-all flex items-center justify-center ${
                          zoomFactor === z ? "bg-amber-500 text-black font-black scale-110" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {z}{"x"}</button>
                    ))}
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Real-time Status Overlay Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/85 border border-slate-800/80 px-4 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 z-20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      {cameraStatusMessage || `${facingMode === "environment" ? "Rear" : "Front"} Camera Active ✓`}
                    </span>
                  </div>

                  
                  {/* Micro-Help Overlay */}
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/40 px-3 py-1 rounded-full backdrop-blur text-[8px] font-mono text-slate-400 tracking-wider pointer-events-none z-20 uppercase">
                    {"💡 Tip: Pinch to Zoom • Tap to Focus • Double Tap to Flip"}</div>
                </>
              ) : cameraPermissionError ? (
                /* Permission Blocked / Denied State with a stylish Card */
                <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-[#070b13] relative overflow-y-auto">
                  <div className="max-w-md w-full bg-[#0d1321] border border-red-500/20 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative z-10 my-auto">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 text-red-400">
                      <AlertTriangle className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-base text-white">{"Camera Access Permission Required"}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {"Secure browser permissions are required to capture live evidence. Please grant camera permissions or use our high-end simulated office templates below."}</p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                      <button
                        onClick={() => initCameraFeed()}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer border-none"
                      >
                        {"🔓 Grant Camera Permission"}</button>
                      <button
                        onClick={() => {
                          setCameraPermissionError(false);
                          setCameraStatusMessage("Simulation Active");
                        }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-black text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                      >
                        {"💡 Use Simulated Office"}</button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Beautiful Opening / Connecting state */
                <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-[#070b13] relative">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <p className="text-xs font-mono font-bold text-slate-400">{cameraStatusMessage || "📷 Opening Camera..."}</p>
                    <p className="text-[10px] text-slate-500">{"Configuring hardware WebRTC drivers..."}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Neon Camera Overlay Guidelines (Based on Mode) */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
              {/* Blur focus status overlay info */}
              <div className="self-center bg-black/75 px-3 py-1.5 rounded-full border border-slate-800/80 backdrop-blur flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${focusLocked ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-ping"}`}></span>
                <span className="text-[10px] font-black uppercase font-mono tracking-wider text-slate-300">{focusStatus}</span>
              </div>

              {/* 3x3 Rules of Thirds Alignment Grid Overlay */}
              {gridOn && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20">
                  <div className="border-r border-b border-white/10"></div>
                  <div className="border-r border-b border-white/10"></div>
                  <div className="border-b border-white/10"></div>
                  <div className="border-r border-b border-white/10"></div>
                  <div className="border-r border-b border-white/10"></div>
                  <div className="border-b border-white/10"></div>
                  <div className="border-r border-white/10"></div>
                  <div className="border-r border-white/10"></div>
                  <div></div>
                </div>
              )}

              {/* Simulated Environment Mock Board shown on top of the viewfinder if stream isn't active and no permission error */}
              {!isStreamActive && !cameraPermissionError && (
                <div className="absolute inset-0 bg-[#070b13] flex flex-col items-center justify-center p-4 overflow-y-auto pointer-events-auto z-30">
                  <div className="max-w-md w-full bg-[#0d1321] border border-slate-800 rounded-3xl p-5 text-center space-y-4 shadow-2xl relative my-auto">
                    <div className="w-12 h-12 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-white">{"Simulated"}{facingMode === "environment" ? "Rear" : "Front selfie"} {"Camera"}</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {facingMode === "environment" 
                          ? "Simulating high-resolution Back Camera. Select an incident scene label below to capture evidence or upload a custom snapshot."
                          : "Simulating high-resolution Front Camera. Select an HR biometric verification template below."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
                      {facingMode === "environment" ? (
                        CAMERA_TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => selectMockTemplate(t.id)}
                            className="w-full text-left p-2.5 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-2.5"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                              <img referrerPolicy="no-referrer" src={t.src} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="text-[11px] font-bold text-slate-200 line-clamp-1">{t.name}</p>
                              <span className="text-[8px] font-mono text-blue-400 uppercase tracking-wider">{t.category}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        SELFIE_TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => selectMockTemplate(t.id)}
                            className="w-full text-left p-2.5 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-2.5"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                              <img referrerPolicy="no-referrer" src={t.src} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="text-[11px] font-bold text-slate-200 line-clamp-1">{t.name}</p>
                              <span className="text-[8px] font-mono text-violet-400 uppercase tracking-wider">{t.category}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-3">
                      <button
                        onClick={initCameraFeed}
                        className="text-[10px] font-bold text-slate-400 hover:text-white underline transition-all"
                      >
                        {"🔄 Retry Camera Init"}</button>
                      
                      <button
                        onClick={handleToggleFacingMode}
                        className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-all"
                      >
                        {"🔄 Reverse Camera: Switch to"}{facingMode === "environment" ? "Front" : "Rear"}
                      </button>

                      <label className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer">
                        {"📁 Custom File"}<input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setEditingImage(evt.target.result as string);
                                  setDetectedObject("Custom Device Upload");
                                  setDetectionConfidence(0.95);
                                  setExtractedOcrText("MANUAL DOCUMENT UPLOAD\nNAME: " + file.name + "\nSIZE: " + (file.size/1024).toFixed(1) + " KB");
                                  setSuggestedTicketMeta({
                                    category: "Other",
                                    severity: "Medium",
                                    title: "Custom Evidence: " + file.name.split(".")[0]
                                  });
                                  setScreen("preview");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode framing guidelines */}
              {activeMode === "document" && (
                <div className="w-full max-w-sm aspect-[3/4] mx-auto my-auto border-2 border-dashed border-cyan-400/50 rounded-2xl relative flex flex-col justify-between p-4">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[9px] font-black tracking-widest uppercase font-mono px-2.5 py-0.5 rounded-full">
                    {"📄 Document Frame Guides"}</div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl"></div>
                    <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl"></div>
                  </div>
                  <p className="text-[9px] text-center text-cyan-300 bg-black/60 font-mono py-1 rounded backdrop-blur">
                    {"Align edges of ID, slip, or printer label"}</p>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl"></div>
                    <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-xl"></div>
                  </div>
                </div>
              )}

              {activeMode === "hd" && (
                <div className="w-32 h-32 border border-dashed border-red-500/40 rounded-full mx-auto my-auto relative flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="absolute -bottom-6 text-[8px] font-mono font-black text-red-400 uppercase tracking-widest">{"CENTER METERING"}</span>
                </div>
              )}

              {activeMode === "lowlight" && (
                <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none border border-yellow-500/20 flex items-center justify-center">
                  <span className="bg-yellow-500 text-black font-mono text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase">{"🌙 Night Sight Gain Adjusted"}</span>
                </div>
              )}

              {activeMode === "ultraclear" && (
                <div className="w-full max-w-md aspect-video border border-emerald-500/30 rounded-3xl mx-auto my-auto relative p-3">
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 text-emerald-400">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* ================= CAMERA SETTINGS SLIDE-UP BOTTOM SHEET ================= */}
            <AnimatePresence>
              {settingsMenuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSettingsMenuOpen(false)}
                    className="absolute inset-0 bg-black/80 z-40 cursor-pointer pointer-events-auto"
                  />
                  
                  {/* Bottom Sheet */}
                  <motion.div 
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 inset-x-0 bg-[#090e18]/95 border-t border-slate-800 backdrop-blur-md rounded-t-3xl p-5 z-50 flex flex-col gap-4 text-slate-200 shadow-2xl max-h-[80%] overflow-y-auto pointer-events-auto"
                  >
                    {/* Drag Handle Indicator */}
                    <div className="w-12 h-1 mx-auto bg-slate-700 rounded-full shrink-0" />
                    
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="text-xs font-black uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-blue-400" />
                        {"Camera Control Panel"}</span>
                      <button 
                        onClick={() => setSettingsMenuOpen(false)}
                        className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Camera Device Source Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider">{"Default Lens"}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setFacingMode("environment");
                              setSelectedDeviceId("");
                            }}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                              facingMode === "environment" 
                                ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-850"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">{"📷 Rear Camera"}</span>
                            <span className="text-[8px] font-mono opacity-60">{"Environment"}</span>
                          </button>
                          <button
                            onClick={() => {
                              setFacingMode("user");
                              setSelectedDeviceId("");
                            }}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                              facingMode === "user" 
                                ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-850"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">{"🤳 Front Camera"}</span>
                            <span className="text-[8px] font-mono opacity-60">{"User Selfie"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-850 pt-3">
                        <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider">{"Capture Mode"}</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {[
                            { id: "standard", label: "Standard" },
                            { id: "hd", label: "HD Detail" },
                            { id: "document", label: "Doc Scan" },
                            { id: "night", label: "Night Mode" },
                            { id: "ultraclear", label: "Ultra Clear" },
                            { id: "portrait", label: "Portrait" },
                            { id: "macro", label: "Macro" },
                            { id: "whiteboard", label: "Whiteboard" },
                            { id: "lowlight", label: "Low Light" },
                            { id: "textenhance", label: "Text Enhance" },
                            { id: "ocr", label: "AI OCR" }
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              onClick={() => {
                                setActiveMode(mode.id as any);
                                setSettingsMenuOpen(false);
                              }}
                              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center ${
                                activeMode === mode.id 
                                  ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-850"
                              }`}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Resolution presets */}
                      <div className="space-y-1.5 border-t border-slate-850 pt-3">
                        <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider">{"Resolution"}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "720p", label: "720P" },
                            { id: "1080p", label: "1080P" },
                            { id: "4k", label: "4K (Sup)" }
                          ].map((res) => (
                            <button
                              key={res.id}
                              onClick={() => setResolution(res.id)}
                              className={`py-2.5 rounded-xl text-[10px] font-black font-mono border transition-all ${
                                resolution === res.id 
                                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" 
                                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-850"
                              }`}
                            >
                              {res.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Advanced Feature Toggles */}
                      <div className="space-y-2.5 border-t border-slate-850 pt-3">
                        <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider">{"Advanced Settings"}</label>
                        
                        {/* HDR Toggle */}
                        <div className="flex items-center justify-between py-1">
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-200">{"HDR Enhancement"}</p>
                            <p className="text-[8px] text-slate-500">{"Auto shadow fill lighting"}</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isHdrOn} 
                            onChange={(e) => setIsHdrOn(e.target.checked)}
                            className="w-8 h-4 rounded-full appearance-none bg-slate-800 checked:bg-blue-500 relative cursor-pointer transition-all before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all"
                          />
                        </div>

                        {/* Flash Simulation */}
                        <div className="flex items-center justify-between py-1">
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-200">{"⚡ Flash / Torch"}</p>
                            <p className="text-[8px] text-slate-500">{"Enable flashlight simulation"}</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isFlashOn} 
                            onChange={(e) => setIsFlashOn(e.target.checked)}
                            className="w-8 h-4 rounded-full appearance-none bg-slate-800 checked:bg-blue-500 relative cursor-pointer transition-all before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all"
                          />
                        </div>

                        {/* 3x3 Grid Guidelines */}
                        <div className="flex items-center justify-between py-1">
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-200">{"3x3 Rule of Thirds Grid"}</p>
                            <p className="text-[8px] text-slate-500">{"Guides for straight alignment"}</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={gridOn} 
                            onChange={(e) => setGridOn(e.target.checked)}
                            className="w-8 h-4 rounded-full appearance-none bg-slate-800 checked:bg-blue-500 relative cursor-pointer transition-all before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all"
                          />
                        </div>

                        {/* Auto Focus Tracking */}
                        <div className="flex items-center justify-between py-1">
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-200">{"Auto Focus tracking"}</p>
                            <p className="text-[8px] text-slate-500">{"Dynamic lens calibration"}</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={autoFocusOn} 
                            onChange={(e) => setAutoFocusOn(e.target.checked)}
                            className="w-8 h-4 rounded-full appearance-none bg-slate-800 checked:bg-blue-500 relative cursor-pointer transition-all before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all"
                          />
                        </div>

                        {/* AI Enhance Pipeline */}
                        <div className="flex items-center justify-between py-1">
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-200">{"🤖 AI Enhance Pipeline"}</p>
                            <p className="text-[8px] text-slate-500">{"High contrast doc labels & OCR prep"}</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={aiEnhanceOn} 
                            onChange={(e) => setAiEnhanceOn(e.target.checked)}
                            className="w-8 h-4 rounded-full appearance-none bg-slate-800 checked:bg-blue-500 relative cursor-pointer transition-all before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 text-center">
                      <p className="text-[8px] font-mono text-slate-500">{"Ultra-Pro AI Camera Firmware v2.6.3"}</p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* SCREEN 2: PREVIEW & INTERACTIVE CONTROLS */}
        {screen === "preview" && (
          <div className="w-full h-full flex flex-col md:flex-row relative">
            {/* Visual Workspace canvas/render area */}
            <div className="flex-1 bg-[#04060b] relative flex items-center justify-center p-4">
              <div className="flex flex-col items-center gap-3 w-full h-full justify-center">
                {/* 1. TOP BAR: Aspect Ratio & Crop Mode Controls when cropping is active */}
                {cropActive && (
                  <div className="w-full max-w-lg bg-[#090e18]/90 border border-slate-800 backdrop-blur px-3 py-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 z-30">
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      {"Aspect Ratio"}</span>
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
                      {[
                        { id: "free", label: "Free" },
                        { id: "1:1", label: "1:1" },
                        { id: "4:3", label: "4:3" },
                        { id: "16:9", label: "16:9" },
                        { id: "doc", label: "Doc" },
                        { id: "receipt", label: "Receipt" },
                        { id: "idcard", label: "ID Card" }
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => setCropAspectRatio(ratio.id)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-black uppercase transition-all cursor-pointer ${
                            cropAspectRatio === ratio.id 
                              ? "bg-cyan-500 text-black font-black" 
                              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. SMART AUTO-DETECTION PROMPT BANNER */}
                {cropActive && showAutoCropPrompt && !autoCropApplied && (
                  <div className="w-full max-w-lg bg-indigo-950/80 border border-indigo-500/30 p-2.5 rounded-2xl flex items-center justify-between gap-3 z-30 animate-pulse">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-200">{"AI Document Boundary Detected"}</p>
                        <p className="text-[8px] text-slate-400">{"Suggest auto-aligning to standard crop bounds"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={applyAutoCrop}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-mono font-black uppercase rounded-lg transition-all cursor-pointer"
                      >
                        {"Auto Crop"}</button>
                      <button
                        onClick={() => setShowAutoCropPrompt(false)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. CORE WORKSPACE WORKBENCH */}
                <div 
                  ref={cropContainerRef}
                  onWheel={handlePreviewWheel}
                  onMouseDown={handlePanStart}
                  onMouseMove={handlePanMove}
                  onMouseUp={handlePanEnd}
                  onMouseLeave={handlePanEnd}
                  onTouchStart={handlePanStart}
                  onTouchMove={handlePanMove}
                  onTouchEnd={handlePanEnd}
                  className={`relative max-w-full max-h-[70vh] md:max-h-[75vh] aspect-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl transition-all ${
                    previewZoom > 1 ? "cursor-grab active:cursor-grabbing" : ""
                  }`}
                  style={{ 
                    transform: `rotate(${rotationAngle}deg)`,
                  }}
                >
                  {/* The Image under review */}
                  <img 
                    referrerPolicy="no-referrer" 
                    src={editingImage} 
                    alt={"Review captured evidence"} 
                    className="max-h-[70vh] md:max-h-[75vh] object-contain rounded-2xl pointer-events-none transition-all select-none"
                    style={{
                      transform: `scale(${previewZoom}) translate(${previewPan.x}px, ${previewPan.y}px)`,
                      filter: showOriginalToggle
                        ? "none"
                        : `brightness(${enhanceSettings.brightness / 50}) contrast(${enhanceSettings.contrast / 50}) saturate(${1 + (enhanceSettings.sharpness / 50 - 1) * 0.2})`
                    }}
                  />

                  {/* Hold to Compare floating action button */}
                  <button
                    onMouseDown={() => setShowOriginalToggle(true)}
                    onMouseUp={() => setShowOriginalToggle(false)}
                    onMouseLeave={() => setShowOriginalToggle(false)}
                    onTouchStart={() => setShowOriginalToggle(true)}
                    onTouchEnd={() => setShowOriginalToggle(false)}
                    className="absolute top-3 right-3 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer z-35 flex items-center gap-1.5 shadow-lg select-none active:scale-95"
                    title={"Hold to view original unenhanced photo"}
                  >
                    <Activity className="w-3.5 h-3.5 text-yellow-400" />
                    {"Hold to Compare"}</button>

                  {/* ACTIVE OCR READING INDICATOR */}
                  {isOcrLoading && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2 z-40">
                      <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
                      <p className="text-[10px] font-black uppercase tracking-wider font-mono text-cyan-400 animate-pulse">{"Running AI Document Scan & OCR..."}</p>
                      <p className="text-[8px] text-slate-500 font-mono">{"Enhancing contrast & parsing glyph segments"}</p>
                    </div>
                  )}

                  {/* FULLY UNLOCKED INTERACTIVE CROP OVERLAY BOUNDARY */}
                  {cropActive && !isOcrLoading && (
                    <div 
                      className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/10 rounded-xl"
                      style={{
                        left: `${cropBox.x}%`,
                        top: `${cropBox.y}%`,
                        width: `${cropBox.w}%`,
                        height: `${cropBox.h}%`
                      }}
                    >
                      {/* Inner gridlines matching Rule of Thirds */}
                      <div className="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-30">
                        <div className="border-r border-cyan-300 h-full"></div>
                        <div className="border-r border-cyan-300 h-full"></div>
                      </div>
                      <div className="absolute inset-0 grid grid-rows-3 pointer-events-none opacity-30">
                        <div className="border-b border-cyan-300 w-full"></div>
                        <div className="border-b border-cyan-300 w-full"></div>
                      </div>

                      {/* Outer Drag Handle overlay for the entire box movement */}
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "move")}
                        onTouchStart={(e) => handleDragStart(e, "move")}
                        className="absolute inset-4 cursor-move"
                        title={"Drag to reposition crop selection"}
                      />

                      {/* Four Corners (28-32px touch-friendly targets) */}
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "nw")}
                        onTouchStart={(e) => handleDragStart(e, "nw")}
                        className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 border-cyan-400 cursor-nw-resize z-30"
                      />
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "ne")}
                        onTouchStart={(e) => handleDragStart(e, "ne")}
                        className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 border-cyan-400 cursor-ne-resize z-30"
                      />
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "sw")}
                        onTouchStart={(e) => handleDragStart(e, "sw")}
                        className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 border-cyan-400 cursor-sw-resize z-30"
                      />
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "se")}
                        onTouchStart={(e) => handleDragStart(e, "se")}
                        className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 border-cyan-400 cursor-se-resize z-30"
                      />

                      {/* Four Edges */}
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "n")}
                        onTouchStart={(e) => handleDragStart(e, "n")}
                        className="absolute top-0 inset-x-5 h-3 cursor-n-resize z-20 hover:bg-cyan-400/25"
                      />
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "s")}
                        onTouchStart={(e) => handleDragStart(e, "s")}
                        className="absolute bottom-0 inset-x-5 h-3 cursor-s-resize z-20 hover:bg-cyan-400/25"
                      />
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "w")}
                        onTouchStart={(e) => handleDragStart(e, "w")}
                        className="absolute left-0 inset-y-5 w-3 cursor-w-resize z-20 hover:bg-cyan-400/25"
                      />
                      <div 
                        onMouseDown={(e) => handleDragStart(e, "e")}
                        onTouchStart={(e) => handleDragStart(e, "e")}
                        className="absolute right-0 inset-y-5 w-3 cursor-e-resize z-20 hover:bg-cyan-400/25"
                      />

                      <span className="absolute bottom-2.5 left-2.5 bg-black/85 border border-slate-800/60 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-300 font-bold z-10 select-none pointer-events-none">
                        {cropAspectRatio === "free" ? "Free Crop" : `${cropAspectRatio.toUpperCase()} Box`}
                      </span>
                    </div>
                  )}

                  {/* 5. MAGNIFIER POPUP OVERLAY */}
                  {cropActive && activeDrag && (
                    <div 
                      className="absolute w-24 h-24 rounded-full border-2 border-white shadow-2xl overflow-hidden pointer-events-none z-50 bg-[#090e18]"
                      style={{
                        left: `${magnifierOffset.x}%`,
                        top: `calc(${magnifierOffset.y}% - 75px)`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${editingImage})`,
                          backgroundSize: "400%",
                          backgroundPosition: `${magnifierOffset.x}% ${magnifierOffset.y}%`,
                          backgroundRepeat: "no-repeat"
                        }}
                      />
                      {/* Perfect crosshair */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border border-cyan-400 rounded-full relative">
                          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-400 -translate-x-1/2"></div>
                          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400 -translate-y-1/2"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. BOTTOM BAR: Interactive Zoom & Reset utilities */}
                {cropActive && (
                  <div className="w-full max-w-lg bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-2xl flex items-center justify-between gap-4 z-30">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewZoom(prev => Math.max(1, prev - 0.2))}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center text-xs font-black cursor-pointer"
                        title={"Zoom Out"}
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 font-bold w-12 text-center">
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <button
                        onClick={() => setPreviewZoom(prev => Math.min(4, prev + 0.2))}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center text-xs font-black cursor-pointer"
                        title={"Zoom In"}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={handleResetCrop}
                        className="px-2.5 py-1 text-[9px] font-mono font-black uppercase rounded-lg border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {"Reset Crop"}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Side Panel */}
            <div className="hidden md:flex w-80 shrink-0 bg-[#090e18] border-l border-slate-850 p-4 flex-col gap-4 overflow-y-auto">
               <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold font-mono uppercase tracking-widest text-slate-200">{"AI Assistant"}</span>
               </div>
               
               {/* Chat bubble */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-slate-900 border-l border-b border-slate-800 transform rotate-45"></div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                     {"I detected a"}<strong className="text-violet-400 font-bold">{detectedObject || "document"}</strong>. 
                     {qualityScore >= 80 ? " The image quality is excellent ⭐⭐⭐⭐⭐." : " The image quality is low and might be hard to read."}
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {extractedOcrText ? "The extracted text appears readable." : "No text was detected."}
                  </p>
                  {suggestedTicketMeta?.category && (
                    <div className="mt-2 p-2 bg-blue-950/30 border border-blue-900/40 rounded-lg">
                      <p className="text-[10px] text-blue-400 font-bold mb-1">{"Suggested Action:"}</p>
                      <p className="text-[10px] text-slate-300">{"Would you like to create a"}<strong className="text-white">{suggestedTicketMeta.category}</strong> {"complaint using this document?"}</p>
                    </div>
                  )}
               </div>
               
               {/* Quality stats summary */}
               <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 flex justify-between items-center mt-2">
                  <div className="space-y-0.5">
                     <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{"Image Quality"}</p>
                     <p className="text-xs font-bold text-emerald-400">{qualityScore}% - {qualityScore >= 80 ? "Excellent" : "Fair"}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                     <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{"Detected Evidence"}</p>
                     <p className="text-xs font-bold text-violet-400">{(detectionConfidence * 100).toFixed(0)}{"% Match"}</p>
                  </div>
               </div>

               <p className="text-[9px] text-slate-500 mt-auto text-center font-mono px-4">
                  {"Tools like Smart Crop and Fix Document are available under the \"More...\" menu."}</p>
            </div>

            {/* Mobile AI Assistant FAB */}
            <div className="md:hidden absolute top-4 right-4 z-40">
              <button 
                onClick={() => setShowMobilePanel(true)}
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border border-blue-500 animate-pulse cursor-pointer"
              >
                <Bot className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Mobile AI Assistant Bottom Sheet */}
            <AnimatePresence>
              {showMobilePanel && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobilePanel(false)}
                    className="md:hidden absolute inset-0 bg-black/80 z-40 cursor-pointer pointer-events-auto"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="md:hidden absolute bottom-0 inset-x-0 bg-[#090e18]/95 border-t border-slate-800 backdrop-blur-md rounded-t-3xl p-5 z-50 flex flex-col gap-4 text-slate-200 shadow-2xl pointer-events-auto"
                  >
                     <div className="w-12 h-1 mx-auto bg-slate-700 rounded-full shrink-0" />
                     <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <span className="text-xs font-black uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Bot className="w-4 h-4 text-blue-400" />
                          {"AI Assistant"}</span>
                        <button 
                          onClick={() => setShowMobilePanel(false)}
                          className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                        <p className="text-[11px] leading-relaxed text-slate-300">
                           {"I detected a"}<strong className="text-violet-400 font-bold">{detectedObject || "document"}</strong>. 
                           {qualityScore >= 80 ? " The image quality is excellent ⭐⭐⭐⭐⭐." : " The image quality is low and might be hard to read."}
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {extractedOcrText ? "The extracted text appears readable." : "No text was detected."}
                        </p>
                        {suggestedTicketMeta?.category && (
                          <div className="mt-2 p-2 bg-blue-950/30 border border-blue-900/40 rounded-lg">
                            <p className="text-[10px] text-blue-400 font-bold mb-1">{"Suggested Action:"}</p>
                            <p className="text-[10px] text-slate-300">{"Would you like to create a"}<strong className="text-white">{suggestedTicketMeta.category}</strong> {"complaint using this document?"}</p>
                          </div>
                        )}
                     </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SCREEN 3: RICH ANNOTATION DRAWING CANVAS */}
        {screen === "annotate" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="bg-[#090e18] border border-slate-800 p-3 rounded-2xl max-w-full space-y-3 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-xs font-black uppercase tracking-wider font-mono text-amber-500 flex items-center gap-1">
                  <Edit3 className="w-4 h-4" />
                  {"Annotation Overlays"}</span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleUndoAnnotation}
                    className="p-1 px-2.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-[10px] font-mono font-bold text-slate-300 cursor-pointer"
                  >
                    {"Undo"}</button>
                  <button 
                    onClick={() => {
                      setAnnotationMode("draw");
                      // Reload original
                      initAnnotationCanvas(editingImage);
                    }}
                    className="p-1 px-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-[10px] font-mono font-bold text-red-400 border border-red-900/30 cursor-pointer"
                  >
                    {"Clear All"}</button>
                </div>
              </div>

              {/* Drawing Board Container */}
              <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black cursor-crosshair">
                <canvas
                  ref={annotationCanvasRef}
                  onMouseDown={handleCanvasStartDraw}
                  onMouseMove={handleCanvasDrawing}
                  onMouseUp={handleCanvasEndDraw}
                  onMouseLeave={handleCanvasEndDraw}
                  onTouchStart={handleCanvasStartDraw}
                  onTouchMove={handleCanvasDrawing}
                  onTouchEnd={handleCanvasEndDraw}
                  className="max-h-[70vh] md:max-h-[75vh] object-contain mx-auto"
                />
              </div>

              {/* Overlay Annotate Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-850">
                  <button
                    onClick={() => setAnnotationMode("draw")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      annotationMode === "draw" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                    }`}
                    title={"Pen tool"}
                  >
                    {"✏️ Pen"}</button>
                  <button
                    onClick={() => setAnnotationMode("circle")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      annotationMode === "circle" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                    }`}
                    title={"Circle Highlight"}
                  >
                    {"⭕ Circle"}</button>
                  <button
                    onClick={() => setAnnotationMode("arrow")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      annotationMode === "arrow" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                    }`}
                    title={"Arrow pointer"}
                  >
                    {"➡️ Arrow"}</button>
                  <button
                    onClick={() => setAnnotationMode("text")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      annotationMode === "text" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                    }`}
                    title={"Text stamp"}
                  >
                    {"💬 Badge"}</button>
                </div>

                {/* Brush Colors */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-850">
                  {["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#FFFFFF"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className={`w-5.5 h-5.5 rounded-full border transition-all ${
                        brushColor === c ? "border-white scale-115 ring-2 ring-amber-500/30" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Text tool input block */}
              {annotationMode === "text" && (
                <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-xl space-y-2">
                  <p className="text-[10px] font-mono font-bold text-slate-400">{"INPUT DIAGNOSIS NOTE STAMP:"}</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={textLabelInput}
                      onChange={(e) => setTextLabelInput(e.target.value)}
                      placeholder={"e.g. BROKEN FUSER ROLLER"}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      onClick={applyTextAnnotation}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition-all"
                    >
                      {"Stamp ✓"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* ================= BOTTOM CAPTURE BAR & PHOTOS STRIP ================= */}

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-8 pt-16 shrink-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
        {/* Gallery Strip of Multi-Photos currently captured (Only show if > 0) */}
        {capturedPhotos.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto py-1 mb-4">
            <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-850">
              <span className="text-[10px] uppercase font-mono font-black text-slate-500 tracking-wider">
                {"Captures ("}{capturedPhotos.length})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {capturedPhotos.map((photo, i) => (
                <div 
                  key={photo.id}
                  className="w-16 h-16 rounded-xl border border-slate-800 overflow-hidden relative shrink-0 group"
                >
                  <img referrerPolicy="no-referrer" src={photo.dataUrl} alt={"Captured preview"} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeCapturedPhoto(photo.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-all opacity-0 group-hover:opacity-100 shadow"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[8px] font-mono font-bold text-slate-300 py-0.5">
                    #{i+1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Action Controls based on current active screen state */}
        <div className="flex items-center justify-between gap-4 w-full">

          {screen === "capture" && (
            <div className="flex flex-col gap-4 w-full pt-2">
              <div className="flex justify-between items-center w-full px-4 md:px-12">
                {/* 1. Gallery */}
                <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                  <div className="w-10 h-10 rounded-full border border-slate-850 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-750 transition-all flex items-center justify-center shadow-md">
                    <Upload className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{"Gallery"}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setEditingImage(evt.target.result as string);
                            setOriginalImage(evt.target.result as string);
                            setDetectedObject("Custom Device Upload");
                            setDetectionConfidence(0.95);
                            setExtractedOcrText("MANUAL DOCUMENT UPLOAD\nNAME: " + file.name + "\nSIZE: " + (file.size/1024).toFixed(1) + " KB");
                            setSuggestedTicketMeta({
                              category: "Other",
                              severity: "Medium",
                              title: "Custom Evidence: " + file.name.split(".")[0]
                            });
                            setScreen("preview");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {/* 3. Heavy active Capture Button in center */}
                <button
                  id="tour-camera-shutter"
                  onClick={triggerCapture}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer border-[3px] border-black ring-2 ring-red-600/30 shadow-2xl relative"
                  title={"Take photo of issue"}
                >
                  <span className="w-12 h-12 rounded-full border border-white/25 absolute"></span>
                  <Camera className="w-7 h-7 text-white stroke-[2.5]" />
                </button>

                {/* 2. Reverse Camera Switch */}
                <button
                  onClick={handleToggleFacingMode}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  title={"Reverse Camera (Switch Front / Rear)"}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-300 group-hover:text-amber-400 group-hover:border-slate-700 transition-all flex items-center justify-center shadow-lg active:scale-95">
                    <RefreshCw className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{"Flip"}</span>
                </button>
              </div>
              </div>
          )}

          {screen === "preview" && (
            <>
              {/* Left Action: Essential Editing Controls */}
              <div className="flex flex-wrap items-center gap-2 relative">
                <button
                  onClick={handleRotate}
                  className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                  title={"Rotate Clockwise"}
                >
                  <RefreshCw className="w-4 h-4 text-violet-400" />
                  {"Rotate"}</button>

                <button
                  onClick={() => {
                    applyAutoEnhance();
                    setQualityScore(98);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    autoEnhanced 
                      ? "bg-blue-600/25 border-blue-500 text-blue-400 font-black shadow" 
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {"AI Enhance"}</button>

                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Grid className="w-4 h-4 text-slate-400" />
                    {"More..."}</button>
                  
                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col"
                      >
                        <button
                          onClick={() => {
                            if (cropActive) applyCropAndOCR();
                            else setCropActive(true);
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-850 transition-all text-left"
                        >
                          <Crop className="w-4 h-4 text-cyan-400" />
                          {cropActive ? "Confirm Crop Area" : "Smart Crop"}
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsOcrLoading(true);
                            setTimeout(() => {
                              setIsOcrLoading(false);
                              setEnhanceSettings(prev => ({ ...prev, contrast: 85, sharpness: 90 }));
                            }, 800);
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-850 border-t border-slate-850 transition-all text-left"
                        >
                          <Type className="w-4 h-4 text-amber-400" />
                          {"Sharpen Text"}</button>

                        <button
                          onClick={() => {
                            setIsOcrLoading(true);
                            setTimeout(() => {
                              setIsOcrLoading(false);
                              setEnhanceSettings(prev => ({ ...prev, contrast: 80, brightness: 60 }));
                            }, 800);
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-850 border-t border-slate-850 transition-all text-left"
                        >
                          <Scan className="w-4 h-4 text-blue-400" />
                          {"Improve Document"}</button>

                        <button
                          onClick={() => {
                            setEnhanceSettings(prev => ({ ...prev, brightness: 75 }));
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-850 border-t border-slate-850 transition-all text-left"
                        >
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          {"Brighten Image"}</button>

                        <button
                          onClick={() => {
                            handleOpenAnnotation();
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-850 border-t border-slate-850 transition-all text-left"
                        >
                          <Edit3 className="w-4 h-4 text-amber-500" />
                          {"Draw & Annotate"}</button>
                        <button
                          onClick={() => {
                            handleRestoreOriginal();
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-400 hover:bg-slate-850 border-t border-slate-850 transition-all text-left"
                        >
                          <RefreshCw className="w-4 h-4 text-red-500" />
                          {"Restore Original"}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Center spacing */}
              <div></div>

              {/* Right Action: Accept Snapshot or Retake */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingImage("");
                    setScreen("capture");
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-red-400 font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  {"Retake Photo"}</button>
                
                <button
                  onClick={handleAcceptPhoto}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs text-white rounded-2xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {"Keep Photo & Attach"}</button>
              </div>
            </>
          )}

          {screen === "annotate" && (
            <>
              <p className="text-xs text-slate-400 font-medium">
                {"Tip: Draw circles or arrows to label broken components / discrepancies on the canvas."}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => setScreen("preview")}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  {"Cancel Overlay"}</button>
                <button
                  onClick={handleSaveAnnotation}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs text-white rounded-2xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {"Flatten Annotation ✓"}</button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ================= QUALITY CHECK WARNING DIALOG OVERLAY ================= */}
      {showQualityWarningModal && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm w-full bg-[#0e1422] border border-slate-800 p-6 rounded-3xl space-y-4 shadow-3xl text-center"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white uppercase tracking-wider">{"Low Image Quality Alert"}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {"Our real-time AI scanner detected potential focus blur or poor exposure (Quality score:"}<span className="text-amber-400 font-black">{qualityScore}%</span>{"). Legible text in documents or clear hardware identification is recommended."}</p>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl text-left border border-slate-850 text-[10px] space-y-1 text-slate-300 font-medium">
              {qualityWarnings.map((w, idx) => (
                <div key={idx}>• {w}</div>
              ))}
              {qualityWarnings.length === 0 && (
                <div>{"• General motion blur or camera shake detected. Please steady device."}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowQualityWarningModal(false);
                  setEditingImage("");
                  setScreen("capture");
                }}
                className="w-full py-2.5 bg-[#1a2333] hover:bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer"
              >
                {"Retake Snapshot"}</button>
              <button
                onClick={() => {
                  setShowQualityWarningModal(false);
                  // Manually force accept
                  setQualityScore(95); // Bypass validation
                  setTimeout(() => {
                    handleAcceptPhoto();
                  }, 100);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                {"Use Photo Anyway"}</button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
      </div>
  );
}
