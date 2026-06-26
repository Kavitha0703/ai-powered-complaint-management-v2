import React, { useEffect, useRef } from "react";

export function AudioVisualizer({ stream, isMuted }: { stream: MediaStream | null, isMuted: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    // We only actively display visualization when there is a stream and it's not muted
    if (!stream || isMuted) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (canvasRef.current) {
         const ctx = canvasRef.current.getContext("2d");
         if (ctx) {
           ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
         }
      }
      return;
    }

    if (!audioCtxRef.current) {
       const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
       if (!AudioContextClass) return;
       audioCtxRef.current = new AudioContextClass();
    }
    
    if (audioCtxRef.current.state === "suspended") {
       audioCtxRef.current.resume();
    }

    const audioCtx = audioCtxRef.current;
    
    let currentSource = sourceRef.current;
    if (!currentSource || currentSource.mediaStream !== stream) {
        currentSource = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = currentSource;
    }

    let analyser = analyserRef.current;
    if (!analyser) {
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // less bars for simpler visual
        analyserRef.current = analyser;
    }

    currentSource.disconnect();
    currentSource.connect(analyser);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Loop
      if (!isMuted) {
         animationRef.current = requestAnimationFrame(draw);
      }
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // scale height based on canvas height (e.g. 20px) and max data an array (255)
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        ctx.fillStyle = `rgb(52, 211, 153)`; // Tailwind emerald-400
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      currentSource.disconnect();
    };
  }, [stream, isMuted]);

  return (
    <canvas ref={canvasRef} width={40} height={16} className="opacity-90" />
  );
}
