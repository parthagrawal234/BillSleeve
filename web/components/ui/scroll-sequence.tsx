"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollSequenceProps {
  frameCount: number;
}

export function ScrollSequence({ frameCount }: ScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // References to keep track of frames and rendering state without causing React re-renders
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const drawnFrameRef = useRef(-1);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const preloadFrames = async () => {
      const TOTAL = frameCount;
      const BATCH = 20;
      const frames: HTMLImageElement[] = [];

      for (let i = 0; i < TOTAL; i += BATCH) {
        if (isCancelled) return;
        const batch = [];
        for (let j = i; j < Math.min(i + BATCH, TOTAL); j++) {
          batch.push(
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              // frames are 1-indexed (frame-0001.webp)
              const frameNum = String(j + 1).padStart(4, "0");
              img.src = `/frames/frame-${frameNum}.webp`;
              img.onload = () => resolve(img);
              img.onerror = reject;
            })
          );
        }
        try {
          const loadedBatch = await Promise.all(batch);
          frames.push(...loadedBatch);
          setProgress(Math.round(((i + BATCH) / TOTAL) * 100));
        } catch (error) {
          console.error("Error loading frames:", error);
        }
      }

      if (!isCancelled) {
        framesRef.current = frames;
        setLoaded(true);
      }
    };

    preloadFrames();

    return () => {
      isCancelled = true;
    };
  }, [frameCount]);

  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas internal resolution based on the first frame
    const firstFrame = framesRef.current[0];
    canvas.width = firstFrame.width;
    canvas.height = firstFrame.height;

    // Draw initial frame
    ctx.drawImage(firstFrame, 0, 0, canvas.width, canvas.height);
    drawnFrameRef.current = 0;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // When rect.top is 0, we are at the beginning.
      // When rect.bottom equals windowHeight, we are at the end.
      // Total scrollable distance is rect.height - windowHeight
      const scrollableDistance = rect.height - windowHeight;
      let scrollProgress = -rect.top / scrollableDistance;

      // Clamp progress
      scrollProgress = Math.max(0, Math.min(1, scrollProgress));
      
      const frameIndex = Math.min(
        Math.floor(scrollProgress * frameCount),
        frameCount - 1
      );
      currentFrameRef.current = frameIndex;
    };

    const renderLoop = () => {
      if (currentFrameRef.current !== drawnFrameRef.current) {
        const frame = framesRef.current[currentFrameRef.current];
        if (frame) {
          ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
          drawnFrameRef.current = currentFrameRef.current;
        }
      }
      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    rafIdRef.current = requestAnimationFrame(renderLoop);
    
    // Initial calculation
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [loaded, frameCount]);

  // Subtitle rotation mapped to progress for a 3D effect
  useEffect(() => {
    if (!loaded) return;
    
    const container = containerRef.current;
    if (!container) return;

    const handleScrollTransform = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollableDistance = rect.height - windowHeight;
      let scrollProgress = -rect.top / scrollableDistance;
      scrollProgress = Math.max(0, Math.min(1, scrollProgress));
      
      if (canvasRef.current) {
        const rotation = -4 + scrollProgress * 12; // Sweeps -4deg to +8deg as per best practices
        canvasRef.current.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      }
    };

    window.addEventListener("scroll", handleScrollTransform, { passive: true });
    handleScrollTransform();

    return () => {
      window.removeEventListener("scroll", handleScrollTransform);
    };
  }, [loaded]);

  return (
    <div ref={containerRef} className="relative w-full h-[400vh]">
      {!loaded && (
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center bg-black z-50">
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-white/50 text-sm font-medium tracking-widest uppercase">
            Loading Experience {Math.min(progress, 100)}%
          </p>
        </div>
      )}
      
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/*
          Using positioning trick to allow the canvas to rotate from its center 
          while remaining centered in the viewport
        */}
        <div className="absolute inset-0 w-screen h-screen">
          <canvas
            ref={canvasRef}
            className="absolute top-1/2 left-1/2 w-full h-full object-cover"
            style={{
              transform: "translate(-50%, -50%)"
            }}
          />
        </div>

        {/* Dynamic content overlays based on phases */}
        <div className="absolute inset-0 pointer-events-none">
           <OverlayContent containerRef={containerRef} />
        </div>
      </div>
    </div>
  );
}

// Separate component to handle the overlay cards logic
function OverlayContent({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;
      let p = -rect.top / scrollableDistance;
      setProgress(Math.max(0, Math.min(1, p)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  // Phase ranges defined per best practices
  const phases = [
    { id: 1, start: 0.08, end: 0.24 },
    { id: 2, start: 0.28, end: 0.46 },
    { id: 3, start: 0.50, end: 0.68 },
    { id: 4, start: 0.72, end: 0.92 },
  ];

  const getPhaseClass = (phaseId: number) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return "opacity-0 translate-y-8";
    const isVisible = progress >= phase.start && progress <= phase.end;
    return isVisible 
      ? "opacity-100 translate-y-0" 
      : progress > phase.end 
        ? "opacity-0 -translate-y-8" 
        : "opacity-0 translate-y-8";
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className={`absolute w-full px-6 flex flex-col items-center text-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${getPhaseClass(1)}`}>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)] leading-[1.1] mb-6">
          Zero setup. <br />
          <span className="text-white/70">Total automation.</span>
        </h2>
        <p className="max-w-xl text-xl md:text-2xl text-white/80 font-medium tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
          Connects directly with your receipt data in seconds—no manual entry. Let AI do the heavy lifting.
        </p>
      </div>

      <div className={`absolute w-full px-6 flex flex-col items-center text-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${getPhaseClass(2)}`}>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)] leading-[1.1] mb-6">
          Military-grade <br />
          <span className="text-white/70">encryption.</span>
        </h2>
        <p className="max-w-xl text-xl md:text-2xl text-white/80 font-medium tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
          Your receipts are encrypted entirely on your device. Only scrambled noise hits our servers.
        </p>
      </div>

      <div className={`absolute w-full px-6 flex flex-col items-center text-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${getPhaseClass(3)}`}>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)] leading-[1.1] mb-6">
          Sandboxed <br />
          <span className="text-white/70">agents.</span>
        </h2>
        <p className="max-w-xl text-xl md:text-2xl text-white/80 font-medium tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
          Register warranties effortlessly using our dedicated browser agents that securely auto-fill forms inside Docker.
        </p>
      </div>

      <div className={`absolute w-full px-6 flex flex-col items-center text-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${getPhaseClass(4)}`}>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)] leading-[1.1] mb-8">
          100% offline. <br />
          <span className="text-white/70">Always yours.</span>
        </h2>
        <p className="max-w-xl text-xl md:text-2xl text-white/80 font-medium tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] mb-10">
          No mandatory clouds, no costly APIs. The ultimate privacy-first solution for peace of mind.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <a href="/login" className="px-8 py-4 rounded-full bg-white text-black font-semibold tracking-tight hover:scale-105 transition-transform duration-300 pointer-events-auto">
            Get Started
          </a>
          <a href="#features" className="px-8 py-4 rounded-full bg-transparent text-white font-semibold tracking-tight backdrop-blur-md border border-white/20 hover:bg-white/10 transition-colors duration-300 pointer-events-auto">
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}
