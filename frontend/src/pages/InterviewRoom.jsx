import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Code2, MonitorPlay, Clock, ShieldCheck, Activity } from "lucide-react";
import VideoContainer from "../components/VideoContainer";
import CollaborativeDoc from "../components/CollaborativeDoc";

export default function InterviewRoom() {
  const { roomId } = useParams();
  const [interview, setInterview] = useState(null);
  const [isTooEarly, setIsTooEarly] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [error, setError] = useState("");
  const [isDocOpen, setIsDocOpen] = useState(false);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/interviews/room/${roomId}`,
          {
            credentials: "include",
          }
        );
        
        if (!response.ok) throw new Error("Room not found or unauthorized");
        
        const data = await response.json();
        setInterview(data);
        checkTime(data.timeSlot);
      } catch (err) {
        setError("Invalid, unauthorized, or expired meeting link.");
      }
    };
    
    fetchInterview();
  }, [roomId]);

  const checkTime = (scheduledTime) => {
    const interviewTime = new Date(scheduledTime).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = interviewTime - now;

      if (difference <= 300000) {
        setIsTooEarly(false);
        clearInterval(timer);
      } else {
        setIsTooEarly(true);
        
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        const formattedTime = 
          (hours > 0 ? `${hours.toString().padStart(2, '0')}:` : "") +
          `${minutes.toString().padStart(2, '0')}:` +
          `${seconds.toString().padStart(2, '0')}`;
          
        setTimeLeft(formattedTime);
      }
    }, 1000);

    return () => clearInterval(timer);
  };

  if (error) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
        <div className="bg-rose-950/20 border border-rose-500/30 p-8 rounded-2xl max-w-md text-center backdrop-blur-xl">
          <Activity className="text-rose-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-rose-100 text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-rose-400/80 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-mono text-sm tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
      </div>
    );
  }

  if (isTooEarly) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="bg-[#0a0a0a]/80 border border-white/10 p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl backdrop-blur-2xl relative z-10">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldCheck className="text-emerald-400 w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Session Confirmed</h1>
          <p className="text-gray-400 mb-8 text-sm">
            Your peer-to-peer technical interview is scheduled. The secure video room will unlock automatically 5 minutes before start time.
          </p>
          
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-6">
            <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-3 flex items-center justify-center gap-2">
              <Clock className="w-3 h-3" /> Time until entry
            </div>
            <div className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider">
              {timeLeft}
            </div>
          </div>

          <div className="text-xs font-mono text-gray-600 tracking-widest flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEM STANDBY
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
      <div className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-mono text-xs tracking-widest font-bold">LIVE SESSION</span>
          </div>
          <span className="text-gray-500 font-mono text-xs tracking-widest hidden md:block">
            ID: {interview.roomId.split('-')[0]}
          </span>
        </div>
        
        <button 
          onClick={() => setIsDocOpen(!isDocOpen)}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
            isDocOpen 
            ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30" 
            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          }`}
        >
          {isDocOpen ? <MonitorPlay size={16} /> : <Code2 size={16} />}
          <span>{isDocOpen ? "Focus on Video" : "Open Workspace"}</span>
        </button>
      </div>

      <div className="flex-1 flex w-full relative transition-all duration-700 ease-in-out bg-black/50">
        <div 
          className={`h-full transition-all duration-700 ease-in-out overflow-hidden flex flex-col ${
            isDocOpen ? "w-3/4 opacity-100 border-r border-white/10" : "w-0 opacity-0 border-r-0"
          }`}
        >
          <div className="flex-1 min-w-[75vw]"> 
            {isDocOpen && <CollaborativeDoc roomId={roomId} />}
          </div>
        </div>

        <div 
          className={`h-full transition-all duration-700 ease-in-out relative ${
            isDocOpen ? "w-1/4" : "w-full"
          }`}
        >
          <VideoContainer roomId={roomId} /> 
        </div>
      </div>
    </div>
  );
}