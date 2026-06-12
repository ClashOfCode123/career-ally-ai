import { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import { VideoOff, AlertCircle } from "lucide-react";

export default function VideoContainer({ videoUrl }) {
  const containerRef = useRef(null);
  const callFrameRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Safety check: Don't load if there's no URL or the DOM isn't ready
    if (!videoUrl || !containerRef.current) return;

    // React Strict Mode safety: Prevent creating multiple iframes if the component remounts
    if (callFrameRef.current) return;

    try {
      // 1. Initialize the Daily.co iframe
      const callFrame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "none",
          backgroundColor: "#050505", // Matches your deep dark theme
        },
        // We hide the Daily leave button so users use your "Terminate Session" button instead
        showLeaveButton: false, 
        showFullscreenButton: true,
        theme: {
          colors: {
            accent: '#10b981', // emerald-500 to match your Automata theme
            accentText: '#ffffff',
            background: '#0a0a0a',
            backgroundAccent: '#1a1a1a',
            baseText: '#ffffff',
            border: '#262626',
            mainAreaBg: '#050505',
            mainAreaBgAccent: '#111111',
            mainAreaText: '#ffffff',
            supportiveText: '#a3a3a3',
          },
        },
      });

      callFrameRef.current = callFrame;

      // 2. Join the secure video room
      callFrame.join({ url: videoUrl });

    } catch (err) {
      console.error("Failed to initialize WebRTC engine:", err);
      setHasError(true);
    }

    // 3. Cleanup on dismount
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [videoUrl]);

  if (hasError) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center border-l border-white/10">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 border border-rose-500/20">
          <AlertCircle className="text-rose-500 w-8 h-8" />
        </div>
        <h3 className="text-rose-100 font-bold mb-2">Video Hardware Failure</h3>
        <p className="text-gray-400 text-sm">
          Could not establish secure WebRTC connection. Please check your browser permissions.
        </p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center border-l border-white/10">
        <VideoOff className="text-gray-600 w-12 h-12 mb-4" />
        <p className="text-gray-500 font-mono text-sm tracking-widest">AWAITING VIDEO STREAM...</p>
      </div>
    );
  }

  return (
    // The container MUST be w-full h-full so it perfectly fills whatever grid size 
    // the InterviewRoom.jsx gives it (either 100% wide or 50% narrow).
    <div 
      className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center" 
      ref={containerRef}
    >
      {/* The Daily.co iframe gets injected dynamically right here */}
    </div>
  );
}