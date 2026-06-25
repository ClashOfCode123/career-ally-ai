import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Target,
  ExternalLink,
  Activity,
  Cpu,
  Layers,
  MapPin,
  Briefcase,
  Building,
  MessageSquare,
  Send,
  Bot,
  User,
  RefreshCcw,
  Sparkles,
  Loader2,
  ShieldCheck
} from "lucide-react";
import axios from "axios";

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getMessageText(message) {
  if (!message) return "";
  return message.message || message.content || "";
}

function getMessageKey(message, index) {
  return message._id || message.id || `${message.role}-${index}`;
}

export default function Dashboard({ user, apiBaseUrl }) {
  const API_BASE_URL = apiBaseUrl || DEFAULT_API_BASE_URL;

  const [file, setFile] = useState(null);
  const [yoe, setYoe] = useState("");
  const [companies, setCompanies] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [country, setCountry] = useState("us");
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [extractedProfile, setExtractedProfile] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code) {
          setCountry(data.country_code.toLowerCase());
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const fetchChatHistory = async () => {
    try {
      setIsHistoryLoading(true);
      setChatError("");

      const res = await axios.get(`${API_BASE_URL}/api/resume-chat/history`, {
        withCredentials: true
      });

      const messages = Array.isArray(res.data?.messages) ? res.data.messages : [];
      setChatMessages(messages);
    } catch (err) {
      // Do not block the whole dashboard if chat history is unavailable.
      console.error("Chat history error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Resume payload required.");
      return;
    }

    setIsLoading(true);
    setError("");
    setChatError("");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("yoe", yoe);
    formData.append("jobType", jobType);
    formData.append("targetCompanies", companies);
    formData.append("country", country);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/jobs/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMatches(Array.isArray(res.data?.matches) ? res.data.matches : []);
      setExtractedProfile(res.data?.extractedProfile || null);

      // Backend resets old chat when a new resume is uploaded.
      setChatMessages([]);
      await fetchChatHistory();
    } catch (err) {
      setError(err.response?.data?.error || "Neural link failed. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();

    const cleanMessage = chatInput.trim();
    if (!cleanMessage || isChatLoading) return;

    const optimisticUserMessage = {
      role: "user",
      message: cleanMessage,
      _id: `local-user-${Date.now()}`
    };

    setChatMessages((prev) => [...prev, optimisticUserMessage]);
    setChatInput("");
    setChatError("");
    setIsChatLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/resume-chat/message`,
        { message: cleanMessage },
        { withCredentials: true }
      );

      const assistantMessage = {
        role: "assistant",
        message: res.data?.reply || "No response received.",
        _id: `local-assistant-${Date.now()}`
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const apiError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Resume chat failed. Upload a resume first, then try again.";

      setChatError(apiError);
      setChatMessages((prev) => prev.filter((msg) => msg._id !== optimisticUserMessage._id));
    } finally {
      setIsChatLoading(false);
    }
  };

  const resetChat = async () => {
    try {
      setChatError("");
      await axios.delete(`${API_BASE_URL}/api/resume-chat/reset`, {
        withCredentials: true
      });
      setChatMessages([]);
    } catch (err) {
      setChatError(err.response?.data?.error || "Failed to reset chat.");
    }
  };

  const skills = getSafeArray(extractedProfile?.skills);
  const strengths = getSafeArray(extractedProfile?.strengths);
  const weaknesses = getSafeArray(extractedProfile?.weaknesses);
  const suggestedRoles = getSafeArray(extractedProfile?.suggestedRoles);

  return (
    <div className="h-full min-h-0 overflow-hidden bg-black text-white px-6 py-4 box-border font-sans selection:bg-emerald-500/30">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full min-h-0 max-w-7xl mx-auto flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Cpu size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">AUTOMATA NEXUS</h1>
              <p className="text-emerald-400/70 text-xs font-mono tracking-widest uppercase">
                Match Engine + Resume Chat
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-gray-500 font-mono text-xs">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3 h-full min-h-0 space-y-6 overflow-y-auto pr-1 custom-scrollbar"
          >
            <div className="w-full bg-[#0a0a0a]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

              <div className="mb-6">
                <h2 className="text-xl font-black tracking-tight mb-1">Initialize Scan</h2>
                <p className="text-gray-400 text-xs font-mono tracking-widest uppercase">
                  Upload parameters
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">
                    Resume Payload (PDF)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-[#050505] border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-white/[0.02] transition-all">
                    <UploadCloud className="text-gray-500 mb-2" size={24} />
                    <span className="text-xs font-mono text-gray-400 truncate px-4">
                      {file ? file.name : "AWAITING FILE..."}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">
                    Experience Fallback (Years)
                  </label>
                  <div className="relative">
                    <Layers
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />
                    <input
                      type="number"
                      min="0"
                      value={yoe}
                      onChange={(e) => setYoe(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">
                    Target Companies
                  </label>
                  <div className="relative">
                    <Target
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />
                    <input
                      type="text"
                      value={companies}
                      onChange={(e) => setCompanies(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                      placeholder="Stripe, Vercel, Google"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">
                    Engagement Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="intern">Internship</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">
                    Target Region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                  >
                    <option value="us">United States</option>
                    <option value="in">India</option>
                    <option value="gb">United Kingdom</option>
                    <option value="ca">Canada</option>
                    <option value="au">Australia</option>
                    <option value="sg">Singapore</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 py-3 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="font-mono text-sm uppercase tracking-widest animate-pulse">
                      Processing...
                    </span>
                  ) : (
                    <span className="font-mono text-sm uppercase tracking-widest">
                      Execute Scan
                    </span>
                  )}
                </motion.button>
              </form>
            </div>

            {extractedProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 backdrop-blur-2xl space-y-5"
              >
                <div>
                  <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
                    Extracted Matrix
                  </h3>
                  <p className="text-sm text-gray-300 leading-6">
                    {extractedProfile.careerSummary || "Resume profile generated successfully."}
                  </p>
                </div>

                {skills.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 16).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-emerald-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {suggestedRoles.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                      Suggested Roles
                    </h4>
                    <div className="space-y-2">
                      {suggestedRoles.slice(0, 4).map((role, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs text-gray-300">
                          <ShieldCheck size={13} className="text-cyan-400" />
                          <span>{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(strengths.length > 0 || weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 gap-3">
                    {strengths.length > 0 && (
                      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
                        <div className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-2">
                          Strengths
                        </div>
                        <p className="text-xs text-gray-300 leading-5">{strengths.slice(0, 3).join(", ")}</p>
                      </div>
                    )}

                    {weaknesses.length > 0 && (
                      <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                        <div className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest mb-2">
                          Gaps
                        </div>
                        <p className="text-xs text-gray-300 leading-5">{weaknesses.slice(0, 3).join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          <div className="xl:col-span-5 h-full min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xl font-black tracking-tight">Optimal Matches</h2>
              <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {matches.length} FOUND
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {matches.map((job, index) => {
                  const tags = getSafeArray(job.tags);

                  return (
                    <motion.div
                      key={job._id || job.jobHash || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      className="bg-[#0a0a0a]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col group"
                    >
                      <div
                        className={`absolute top-0 left-0 w-1 h-full ${
                          job.matchScore >= 80
                            ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            : job.matchScore >= 50
                              ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                              : "bg-gray-500"
                        }`}
                      />

                      <div className="flex justify-between items-start mb-4 pl-2 gap-4">
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg text-white line-clamp-1 mb-1">
                            {job.title || "Unknown Role"}
                          </h3>
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <Building size={14} />
                            <span className="truncate">{job.company || "Unknown Company"}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span
                            className={`font-mono text-2xl font-black ${
                              job.matchScore >= 80
                                ? "text-emerald-400"
                                : job.matchScore >= 50
                                  ? "text-cyan-400"
                                  : "text-gray-400"
                            }`}
                          >
                            {job.matchScore || 0}%
                          </span>
                          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                            Match
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-gray-500 text-xs font-mono mb-6 pl-2">
                        <MapPin size={12} />
                        <span className="truncate">{job.location || "Remote"}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6 pl-2 flex-grow">
                        {tags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded text-[10px] font-mono uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                        {tags.length > 4 && (
                          <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-500 rounded text-[10px] font-mono uppercase">
                            +{tags.length - 4}
                          </span>
                        )}
                      </div>

                      <a
                        href={job.applyUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 w-[calc(100%-8px)] flex items-center justify-center space-x-2 bg-white/5 hover:bg-emerald-500/20 text-white hover:text-emerald-400 py-2 rounded-xl transition-all border border-white/5 hover:border-emerald-500/30 text-sm font-mono uppercase tracking-widest"
                      >
                        <span>Deploy App</span>
                        <ExternalLink size={14} />
                      </a>
                    </motion.div>
                  );
                })}

                {matches.length === 0 && !isLoading && (
                  <div className="py-20 flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <Briefcase size={48} className="mb-4 opacity-50" />
                    <p className="font-mono text-sm tracking-widest uppercase">
                      Awaiting parameter input
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-4 h-full min-h-0 overflow-hidden"
          >
            <div className="h-full min-h-0 bg-[#0a0a0a]/80 border border-white/5 rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <MessageSquare size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Resume Chat</h2>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                      Rolling Summary Memory
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetChat}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Reset chat"
                >
                  <RefreshCcw size={16} />
                </button>
              </div>

              {chatError && (
                <div className="mx-5 mt-4 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs leading-5">
                  {chatError}
                </div>
              )}

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {isHistoryLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                    Loading chat memory...
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 px-6">
                    <Sparkles size={42} className="mb-4 text-cyan-400/50" />
                    <h3 className="text-white font-bold mb-2">Ask about your resume</h3>
                    <p className="text-sm leading-6">
                      Upload a resume, then ask things like: “Which role fits me?”, “What gaps do I have?”, or “Improve my summary.”
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isUser = msg.role === "user";

                    return (
                      <div
                        key={getMessageKey(msg, index)}
                        className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                            <Bot size={16} className="text-cyan-400" />
                          </div>
                        )}

                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap border ${
                            isUser
                              ? "bg-emerald-500 text-black border-emerald-400/50 font-medium"
                              : "bg-white/[0.04] text-gray-200 border-white/10"
                          }`}
                        >
                          {getMessageText(msg)}
                        </div>

                        {isUser && (
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <User size={16} className="text-emerald-400" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {isChatLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-cyan-400" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 text-sm leading-6 bg-white/[0.04] text-gray-400 border border-white/10 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={sendChatMessage} className="p-5 border-t border-white/5 bg-black/30">
                <div className="flex items-end gap-3">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage(e);
                      }
                    }}
                    rows={2}
                    maxLength={3000}
                    placeholder="Ask about resume, jobs, gaps, or improvements..."
                    className="flex-1 resize-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600 custom-scrollbar"
                  />

                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="h-[50px] w-[50px] rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>

                <p className="text-[10px] text-gray-600 mt-3 font-mono uppercase tracking-widest">
                  Context sent: resume profile + summary + recent messages + top matches
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}