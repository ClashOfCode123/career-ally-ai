import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Code, Users, Terminal, CheckCircle2 } from "lucide-react";

export default function CollaborativeDoc({ roomId }) {
  const [text, setText] = useState("");
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [syncStatus, setSyncStatus] = useState("Connected"); // Connected, Syncing, Saved
  
  const socketRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Initialize secure socket connection to your backend server
    socketRef.current = io("http://localhost:3000", {
  transports: ["websocket"],
  withCredentials: true,
});

    // 1. Join the designated private room for this interview session
    socketRef.current.emit("join-room", { roomId });

    // 2. Listen for initial document state from the server or peer
    socketRef.current.on("init-document", (initialContent) => {
      setText(initialContent || "");
    });

    // 3. Listen for incoming text updates from the peer
    socketRef.current.on("document-update", (updatedText) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Capture current cursor position before updating state
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      setText(updatedText);
      setSyncStatus("Saved");

      // Restore cursor position on the next render cycle to avoid jumps
      setTimeout(() => {
        textarea.setSelectionRange(start, end);
      }, 0);
    });

    // 4. Track active participants in the room
    socketRef.current.on("room-metrics", (metrics) => {
      if (metrics?.userCount) {
        setConnectedUsers(metrics.userCount);
      }
    });

    // Cleanup connection when the component unmounts or room changes
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  // Handle local typing changes and broadcast updates
  const handleTextChange = (e) => {
    const newContent = e.target.value;
    setText(newContent);
    setSyncStatus("Syncing...");

    // Emit changes immediately to the backend room channel
    if (socketRef.current) {
      socketRef.current.emit("document-change", {
        roomId,
        text: newContent,
      });
    }
  };

  // Generate line numbers dynamically based on line breaks
  const lineNumbers = text.split("\n").map((_, index) => index + 1);

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col font-mono text-sm text-gray-300 select-none">
      
      {/* Workspace Status Sub-Header */}
      <div className="h-10 px-4 bg-[#0d0d0d] border-b border-white/5 flex items-center justify-between text-xs tracking-wider text-gray-500">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-emerald-400" />
          <span className="font-bold text-gray-400">SHARED_WORKSPACE.py</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Real-time Sync Status Indicator */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className={syncStatus === "Syncing..." ? "text-amber-400 animate-pulse" : "text-emerald-400"} />
            <span className={syncStatus === "Syncing..." ? "text-amber-400" : "text-gray-400"}>
              {syncStatus}
            </span>
          </div>

          {/* Active Peer Counter */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-white/5">
            <Users size={12} className="text-cyan-400" />
            <span>{connectedUsers} ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Editing Canvas */}
      <div className="flex-1 flex overflow-hidden relative bg-black/20">
        
        {/* Code Line Gutter */}
        <div className="w-12 bg-[#080808] text-right pr-3 pt-4 select-none border-r border-white/5 text-gray-600 font-mono text-xs leading-6 overflow-hidden">
          {lineNumbers.map((num) => (
            <div key={num} className="h-6">
              {num}
            </div>
          ))}
        </div>

        {/* Text Input Engine */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="# Write code or paste requirements here..."
          spellCheck="false"
          className="flex-1 h-full bg-transparent resize-none outline-none p-4 font-mono text-sm leading-6 text-emerald-100/90 placeholder-gray-700 selection:bg-emerald-500/20 overflow-y-auto"
          style={{ tabSize: 4 }}
        />
      </div>

      {/* Sandbox Terminal Bar */}
      <div className="h-8 px-4 bg-[#080808] border-t border-white/5 flex items-center gap-2 text-xs text-gray-600">
        <Terminal size={12} />
        <span>Console initialized. Port listening via WebSockets.</span>
      </div>
    </div>
  );
}