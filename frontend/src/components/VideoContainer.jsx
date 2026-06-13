import { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import { VideoOff, AlertCircle } from "lucide-react";

export default function VideoContainer({ videoUrl }) {
  const containerRef = useRef(null);
  const callFrameRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const setupDaily = async () => {
      if (!videoUrl || !containerRef.current) return;

      try {
        setHasError(false);
        setErrorMessage("");

        // Clean old iframe if React/Vite/StrictMode left anything inside.
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Destroy old frame if it exists.
        if (callFrameRef.current) {
          try {
            await callFrameRef.current.leave();
            await callFrameRef.current.destroy();
          } catch {
            // ignore cleanup errors
          }

          callFrameRef.current = null;
        }

        if (!isMounted || !containerRef.current) return;

        const callFrame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: "#050505",
          },
          showLeaveButton: false,
          showFullscreenButton: true,

          // Allows local React dev mode to avoid duplicate-instance crashes.
          allowMultipleCallInstances: true,

          theme: {
            colors: {
              accent: "#10b981",
              accentText: "#ffffff",
              background: "#0a0a0a",
              backgroundAccent: "#1a1a1a",
              baseText: "#ffffff",
              border: "#262626",
              mainAreaBg: "#050505",
              mainAreaBgAccent: "#111111",
              mainAreaText: "#ffffff",
              supportiveText: "#a3a3a3",
            },
          },
        });

        callFrameRef.current = callFrame;

        callFrame.on("error", (event) => {
          console.error("Daily video error:", event);

          if (!isMounted) return;

          setHasError(true);
          setErrorMessage(
            event?.errorMsg ||
              event?.error?.message ||
              "Daily video room failed to start."
          );
        });

        await callFrame.join({ url: videoUrl });
      } catch (err) {
        console.error("Failed to initialize WebRTC engine:", err);

        if (!isMounted) return;

        setHasError(true);
        setErrorMessage(err?.message || "Failed to initialize video room.");
      }
    };

    setupDaily();

    return () => {
      isMounted = false;

      const frame = callFrameRef.current;
      callFrameRef.current = null;

      if (frame) {
        try {
          frame.leave();
          frame.destroy();
        } catch {
          // ignore cleanup errors
        }
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [videoUrl]);

  if (hasError) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center border-l border-white/10">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 border border-rose-500/20">
          <AlertCircle className="text-rose-500 w-8 h-8" />
        </div>

        <h3 className="text-rose-100 font-bold mb-2">
          Video Room Unavailable
        </h3>

        <p className="text-gray-400 text-sm max-w-md">
          {errorMessage === "account-missing-payment-method"
            ? "Daily.co rejected this room because the Daily account is missing a payment method. Collaborative workspace can still be tested."
            : errorMessage}
        </p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center border-l border-white/10">
        <VideoOff className="text-gray-600 w-12 h-12 mb-4" />
        <p className="text-gray-500 font-mono text-sm tracking-widest">
          AWAITING VIDEO STREAM...
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center"
      ref={containerRef}
    />
  );
}