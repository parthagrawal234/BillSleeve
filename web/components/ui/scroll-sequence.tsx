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
           {/* Add a progress bar at the top */}
           <ScrollProgressBar containerRef={containerRef} />
           
           <OverlayContent containerRef={containerRef} />
        </div>
      </div>
    </div>
  );
}

// Separate component for the thin accent bar at the top
function ScrollProgressBar({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
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

  return (
    <div 
      className="absolute top-0 left-0 h-1 bg-linear-to-r from-emerald-400 to-cyan-400 z-50 transition-transform duration-75 origin-left"
      style={{ width: '100%', transform: `scaleX(${progress})` }}
    />
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
      <div className={`absolute max-w-lg text-center transition-all duration-700 ease-out backdrop-blur-md bg-black/40 border border-white/10 p-8 rounded-3xl ${getPhaseClass(1)}`}>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
          Zero Setup.<br/>
          <span className="text-emerald-400">Total Automation.</span>
        </h2>
        <p className="text-zinc-300 text-lg drop-shadow">
          BillSleeve connects directly with your receipt data in seconds—no tedious manual entry required. Let our AI do the heavy lifting.
        </p>
      </div>

      <div className={`absolute max-w-lg text-center transition-all duration-700 ease-out backdrop-blur-md bg-black/40 border border-white/10 p-8 rounded-3xl ${getPhaseClass(2)}`}>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
          Military-Grade<br/>
          <span className="text-cyan-400">Encryption.</span>
        </h2>
        <p className="text-zinc-300 text-lg drop-shadow">
          Your receipts are encrypted entirely on your device. Only scrambled noise ever hits our servers over the network.
        </p>
      </div>

      <div className={`absolute max-w-lg text-center transition-all duration-700 ease-out backdrop-blur-md bg-black/40 border border-white/10 p-8 rounded-3xl ${getPhaseClass(3)}`}>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
          Sandboxed<br/>
          <span className="text-purple-400">Browser Agents.</span>
        </h2>
        <p className="text-zinc-300 text-lg drop-shadow">
          Register warranties effortlessly using our dedicated browser agents that securely auto-fill complex forms safely inside Docker.
        </p>
      </div>

      <div className={`absolute max-w-lg text-center transition-all duration-700 ease-out backdrop-blur-md bg-black/40 border border-white/10 p-8 rounded-3xl ${getPhaseClass(4)}`}>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
          100% Offline.<br/>
          <span className="text-rose-400">Always Yours.</span>
        </h2>
        <p className="text-zinc-300 text-lg drop-shadow mb-8">
          No mandatory clouds, no costly APIs. The ultimate privacy-first solution for peace of mind.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/login" className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors pointer-events-auto">
            Get Started
          </a>
          <a href="#features" className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20 pointer-events-auto">
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}
