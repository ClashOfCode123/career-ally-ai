import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import axios from "axios";
import {
  Play,
  Upload,
  Code2,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Activity,
  Zap,
  LogOut,
  ShieldAlert,
  Users,
  Calendar,
  X,
} from "lucide-react";

import Login from "./Login";
import Register from "./Register";
import AdminDashboard from "./AdminDashboard";
import InterviewRoom from "./pages/InterviewRoom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");

  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("automata_user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("automata_user");
      }
    }
  }, []);

  useEffect(() => {
    if (!user || isAdminView) return;

    setIsLoading(true);

    axios
      .get(`${API_BASE_URL}/api/problems`, { withCredentials: true })
      .then((res) => {
        setProblems(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch problems:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, isAdminView]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("automata_user", JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("automata_user");
      setSelectedProblemId(null);
      setIsAdminView(false);
      setProblems([]);
    }
  };

  const handleBookInterview = async (scheduledTimeIso) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/interviews/book`,
        { timeSlot: scheduledTimeIso },
        { withCredentials: true }
      );

      alert(`System Message: ${res.data.message}`);
    } catch (err) {
      console.error("Interview booking error:", err);
      alert(err.response?.data?.error || "Failed to connect to matching engine.");
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-emerald-500/30 relative flex flex-col">
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse"
          style={{ animationDuration: "12s" }}
        />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

        <div className="flex-1 relative z-10">
          <Routes>
            <Route
              path="/room/:roomId"
              element={
                !user ? (
                  authView === "login" ? (
                    <Login
                      key="login"
                      setAuthView={setAuthView}
                      onLogin={handleAuthSuccess}
                    />
                  ) : (
                    <Register
                      key="register"
                      setAuthView={setAuthView}
                      onRegister={handleAuthSuccess}
                    />
                  )
                ) : (
                  <InterviewRoom />
                )
              }
            />

            <Route
              path="/"
              element={
                <AnimatePresence mode="wait">
                  {!user ? (
                    authView === "login" ? (
                      <Login
                        key="login"
                        setAuthView={setAuthView}
                        onLogin={handleAuthSuccess}
                      />
                    ) : (
                      <Register
                        key="register"
                        setAuthView={setAuthView}
                        onRegister={handleAuthSuccess}
                      />
                    )
                  ) : isAdminView ? (
                    <AdminDashboard
                      key="admin"
                      user={user}
                      onBack={() => setIsAdminView(false)}
                    />
                  ) : !selectedProblemId ? (
                    <Dashboard
                      key="dashboard"
                      onSelect={(id) => setSelectedProblemId(id)}
                      problems={problems}
                      isLoading={isLoading}
                      user={user}
                      onLogout={handleLogout}
                      onToggleAdmin={() => setIsAdminView(true)}
                      onBookInterview={handleBookInterview}
                    />
                  ) : (
                    <Workspace
                      key="workspace"
                      problemId={selectedProblemId}
                      onBack={() => setSelectedProblemId(null)}
                      user={user}
                    />
                  )}
                </AnimatePresence>
              }
            />
          </Routes>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="relative z-50 border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-xs font-mono tracking-widest text-gray-500">
            <div className="flex items-center space-x-2">
              <Activity size={14} className="text-emerald-500" />
              <span>AUTOMATA RCE ENGINE v2.0</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>ENGINEERED BY</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold ml-1">
                AGNI & ARCHITA
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </Router>
  );
}

function SchedulingModal({ onClose, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);

  const days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    return {
      index: i,
      dayName:
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "short" }),
      dateStr: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      actualDate: d,
    };
  });

  const timeSlots = [
    "09:00 AM",
    "11:30 AM",
    "02:00 PM",
    "05:00 PM",
    "08:30 PM",
    "10:00 PM",
  ];

  const handleConfirm = () => {
    if (selectedTime === null) return;

    const finalDate = new Date(days[selectedDate].actualDate);
    const [time, modifier] = timeSlots[selectedTime].split(" ");
    let [hours, minutes] = time.split(":");

    hours = parseInt(hours, 10);

    if (hours === 12) hours = 0;
    if (modifier === "PM") hours += 12;

    finalDate.setHours(hours, parseInt(minutes, 10), 0, 0);

    onConfirm(finalDate.toISOString());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Calendar className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Schedule Peer Session
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                Select a time to lock into the matching matrix.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-4 flex items-center">
              <Calendar size={14} className="mr-2" /> 1. Select Date
            </h3>

            <div className="grid grid-cols-5 gap-3">
              {days.map((day) => (
                <button
                  key={day.index}
                  onClick={() => setSelectedDate(day.index)}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                    selectedDate === day.index
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                      : "bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <span className="font-bold text-sm mb-1">
                    {day.dayName}
                  </span>
                  <span className="text-xs opacity-70">{day.dateStr}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-4 flex items-center">
              <Clock size={14} className="mr-2" /> 2. Select Time
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTime(idx)}
                  className={`py-3 rounded-xl border font-mono text-sm transition-all ${
                    selectedTime === idx
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={selectedTime === null}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${
              selectedTime !== null
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-black hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <Users size={18} />
            <span>Confirm Match Request</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Dashboard({
  onSelect,
  problems,
  isLoading,
  user,
  onLogout,
  onToggleAdmin,
  onBookInterview,
}) {
  const [isScheduling, setIsScheduling] = useState(false);

  const solvedCount = problems.filter((p) => p.solved === true).length;
  const totalCount = problems.length || 1;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const handleScheduleConfirm = (isoStringTime) => {
    setIsScheduling(false);
    onBookInterview(isoStringTime);
  };

  return (
    <>
      <AnimatePresence>
        {isScheduling && (
          <SchedulingModal
            onClose={() => setIsScheduling(false)}
            onConfirm={handleScheduleConfirm}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
        className="max-w-6xl mx-auto p-8 pt-10 h-full flex flex-col"
      >
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <Terminal size={20} className="text-emerald-400" />
            </div>
            <span className="font-mono text-sm tracking-widest text-gray-400">
              OPERATIVE:{" "}
              <span className="text-white font-bold">{user.username}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {!user.isAdmin && (
  <button
    onClick={() => setIsScheduling(true)}
    className="flex items-center space-x-2 text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
  >
    <Users size={14} />
    <span>FIND PEER</span>
  </button>
)}

            {user.isAdmin   && (
              <button
                onClick={onToggleAdmin}
                className="flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20"
              >
                <ShieldAlert size={14} />
                <span>ADMIN OVERRIDE</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
            >
              <LogOut size={14} />
              <span>TERMINATE SESSION</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-end mb-16">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-3">
              Welcome to the Arena.
            </h1>
            <p className="text-gray-400 text-lg flex items-center">
              <Zap size={18} className="text-amber-400 mr-2" /> Select a
              challenge to begin execution.
            </p>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-5 bg-white/[0.03] border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-2xl"
          >
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Trophy className="text-emerald-400" size={28} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-mono tracking-widest uppercase mb-1">
                Global Progress
              </div>
              <div className="text-2xl font-bold">
                {solvedCount}{" "}
                <span className="text-gray-600 text-lg font-normal">
                  / {totalCount} Solved
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-emerald-500 animate-pulse font-mono">
            Initializing Matrix...
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 px-2 custom-scrollbar"
          >
            {problems.map((problem) => (
              <motion.div
                key={problem._id}
                variants={item}
                whileHover={{ scale: 1.03, y: -5, rotateX: 2, rotateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(problem._id)}
                className="group cursor-pointer relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all duration-300 backdrop-blur-md shadow-xl"
              >
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                    {problem.solved ? (
                      <CheckCircle2
                        className="text-emerald-400"
                        size={20}
                      />
                    ) : (
                      <Code2
                        className="text-gray-500 group-hover:text-emerald-400 transition-colors"
                        size={20}
                      />
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-widest border ${
                      problem.difficulty === "Easy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : problem.difficulty === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-white/90 group-hover:text-white transition-colors relative z-10">
                  {problem.title}
                </h3>

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-cyan-500/5 transition-all duration-500" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

function Workspace({ problemId, onBack, user }) {
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [status, setStatus] = useState("idle");
  const [output, setOutput] = useState("");
  const [executionStats, setExecutionStats] = useState({ time: 0, memory: 0 });
  const [lastAction, setLastAction] = useState(null);
  const [submissionTime, setSubmissionTime] = useState(null);

  useEffect(() => {
    setProblem(null);

    axios
      .get(`${API_BASE_URL}/api/problems/${problemId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setProblem(res.data);
        setCode(res.data.starterCode?.[language] || "");
      })
      .catch((err) => {
        console.error("Failed to fetch problem:", err);
      });
  }, [problemId]);

  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode?.[language] || "");
    }
  }, [language, problem]);

  const executeCode = async (actionType) => {
    if (!problem) return;

    setStatus("running");
    setLastAction(actionType);
    setOutput("");
    setExecutionStats({ time: 0, memory: 0 });

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/submissions`,
        {
          problemId: problem._id,
          language,
          code,
          action: actionType,
        },
        { withCredentials: true }
      );

      const subId = res.data.submissionId;
      let attempts = 0;

      const poll = setInterval(async () => {
        attempts += 1;

        try {
          const statusRes = await axios.get(
            `${API_BASE_URL}/api/submissions/${subId}`,
            { withCredentials: true }
          );

          const data = statusRes.data;

          if (
            data.status !== "Pending" &&
            data.status !== "Executing" &&
            data.status !== "Processing"
          ) {
            clearInterval(poll);

            setStatus(data.status);
            setOutput(data.outputLogs || "No output logs generated.");

            setExecutionStats({
              time: data.executionTimeMs || 0,
              memory: data.memoryUsedKb
                ? (data.memoryUsedKb / 1024).toFixed(2)
                : 0,
            });

            if (data.status === "Accepted" && actionType === "submit") {
              const now = new Date();

              setSubmissionTime(
                now.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              );
            }
          }

          if (attempts >= 60) {
            clearInterval(poll);
            setStatus("Error");
            setOutput("Submission status polling timed out.");
          }
        } catch (pollErr) {
          clearInterval(poll);
          setStatus("Error");
          setOutput(
            pollErr.response?.data?.error ||
              "Failed to fetch submission status."
          );
        }
      }, 2000);
    } catch (err) {
      setStatus("Error");
      setOutput(err.response?.data?.error || "Server connection failed.");
    }
  };

  const parseDiff = (logs) => {
    try {
      const parts = logs.split("\n\n");

      if (parts.length >= 4) {
        return {
          title: parts[0],
          input: parts[1].replace("Input:\n", "").trim(),
          expected: parts[2].replace("Expected:\n", "").trim(),
          actual: parts[3].replace("Actual:\n", "").trim(),
        };
      }
    } catch (e) {
      console.error("Diff parse error:", e);
    }

    return { raw: logs };
  };

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center text-emerald-500 font-mono animate-pulse">
        Establishing Secure Connection...
      </div>
    );
  }

  const parsedDiff = status === "Wrong Answer" ? parseDiff(output) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-48px)] w-full flex flex-col p-4 space-y-4"
    >
      <nav className="flex justify-between items-center px-6 py-3 bg-[#0a0a0a]/80 border border-white/5 rounded-2xl backdrop-blur-2xl shadow-lg">
        <div className="flex items-center space-x-6">
          <button
            onClick={onBack}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center space-x-3">
            <Terminal size={18} className="text-emerald-500" />
            <h2 className="font-semibold text-lg tracking-wide">
              {problem.title}
            </h2>
          </div>
        </div>

        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => executeCode("run")}
            disabled={status === "running"}
            className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={14} className="text-gray-300" />
            <span>Run</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => executeCode("submit")}
            disabled={status === "running"}
            className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={16} />
            <span>Submit</span>
          </motion.button>
        </div>
      </nav>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-[35%] flex flex-col bg-[#0a0a0a]/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <span
              className={`text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-widest border inline-block ${
                problem.difficulty === "Easy"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : problem.difficulty === "Medium"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div
              className="prose prose-invert max-w-none text-gray-300 text-sm leading-7 mb-10 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-emerald-100"
              dangerouslySetInnerHTML={{ __html: problem.description }}
            />

            <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4 flex items-center">
              <Code2 size={14} className="mr-2" /> Visible Test Cases
            </h4>

            <div className="space-y-3">
              {problem.testCases
                ?.filter((t) => !t.isHidden)
                .map((tc, idx) => (
                  <div
                    key={idx}
                    className="bg-[#050505] border border-white/5 p-4 rounded-xl font-mono text-xs shadow-inner"
                  >
                    <div className="text-gray-500 mb-2">
                      Input: <br />
                      <span className="text-gray-200">{tc.input}</span>
                    </div>
                    <div className="text-gray-500">
                      Expected: <br />
                      <span className="text-emerald-400">
                        {tc.expectedOutput}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="w-[65%] flex flex-col bg-[#0a0a0a]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
          <div className="px-4 py-2 border-b border-white/5 bg-black/40 flex justify-between items-center">
            <div className="text-xs font-mono text-gray-500">workspace.js</div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#1a1a1a] text-xs font-mono text-gray-300 outline-none border border-white/10 rounded px-2 py-1 cursor-pointer"
            >
              <option value="python">Python 3.10</option>
              <option value="cpp">GCC C++17</option>
              <option value="javascript">Node.js 18</option>
            </select>
          </div>

          <div className="flex-1 relative">
            <Editor
              theme="vs-dark"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                padding: { top: 24, bottom: 24 },
                fontSize: 14,
                fontFamily: "JetBrains Mono, monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          <AnimatePresence>
            {status !== "idle" && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 z-50 bg-[#1e1e1e] border-t border-white/10 max-h-[50%] overflow-y-auto custom-scrollbar flex flex-col"
              >
                <div className="flex justify-between items-center px-6 py-3 border-b border-white/5 bg-black/20 sticky top-0 backdrop-blur-md z-10">
                  <div className="flex items-center space-x-3">
                    {status === "running" ? (
                      <Clock className="text-blue-400 animate-spin" size={16} />
                    ) : status === "Accepted" ? (
                      <CheckCircle2 className="text-emerald-500" size={16} />
                    ) : (
                      <XCircle className="text-rose-500" size={16} />
                    )}

                    <span
                      className={`font-bold tracking-wide ${
                        status === "Accepted"
                          ? "text-emerald-500"
                          : status === "running"
                          ? "text-blue-400"
                          : "text-rose-500"
                      }`}
                    >
                      {status === "running" ? "Evaluating Engine..." : status}
                    </span>
                  </div>

                  <button
                    onClick={() => setStatus("idle")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6">
                  {status === "running" && (
                    <div className="flex items-center space-x-4 text-blue-200">
                      <div className="animate-pulse">
                        Allocating secure container resources and executing test
                        matrix...
                      </div>
                    </div>
                  )}

                  {status === "Accepted" && lastAction === "submit" && (
                    <div className="flex flex-col space-y-6">
                      <div className="flex items-end space-x-4">
                        <h2 className="text-3xl font-bold text-emerald-500">
                          Accepted
                        </h2>
                      </div>

                      <div className="text-sm text-gray-400 flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span>
                          <strong className="text-gray-200">
                            {user.username}
                          </strong>{" "}
                          submitted at {submissionTime}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 max-w-xl">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                          <div className="text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center">
                            <Clock size={12} className="mr-1" /> Runtime
                          </div>
                          <div className="text-2xl font-bold text-gray-200">
                            {executionStats.time}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              ms
                            </span>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                          <div className="text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center">
                            <Activity size={12} className="mr-1" /> Memory
                          </div>
                          <div className="text-2xl font-bold text-gray-200">
                            {executionStats.memory}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              MB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {status === "Accepted" && lastAction === "run" && (
                    <div className="text-emerald-400 font-mono text-sm bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                      {output}
                      <div className="mt-4 text-gray-400 text-xs">
                        Execution Time: {executionStats.time}ms
                      </div>
                    </div>
                  )}

                  {status === "Wrong Answer" && parsedDiff && (
                    <div className="space-y-6">
                      {parsedDiff.raw ? (
                        <pre className="text-rose-300 font-mono text-xs whitespace-pre-wrap">
                          {parsedDiff.raw}
                        </pre>
                      ) : (
                        <>
                          <div className="flex space-x-2 border-b border-white/10 pb-2">
                            <div className="px-4 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-medium flex items-center border border-rose-500/30">
                              <XCircle size={14} className="mr-2" /> Failed Case
                            </div>

                            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500/50 rounded-lg text-sm font-medium flex items-center">
                              <CheckCircle2 size={14} className="mr-2" /> Passed
                            </div>
                          </div>

                          <div className="space-y-4 font-mono text-sm">
                            <div>
                              <div className="text-gray-500 text-xs mb-1">
                                Input
                              </div>
                              <div className="bg-[#2a2a2a] p-3 rounded-lg text-gray-200 break-all">
                                {parsedDiff.input}
                              </div>
                            </div>

                            <div>
                              <div className="text-gray-500 text-xs mb-1">
                                Output
                              </div>
                              <div className="bg-rose-950/30 border border-rose-900/50 p-3 rounded-lg text-rose-300 break-all">
                                {parsedDiff.actual || "null"}
                              </div>
                            </div>

                            <div>
                              <div className="text-gray-500 text-xs mb-1">
                                Expected
                              </div>
                              <div className="bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-lg text-emerald-400 break-all">
                                {parsedDiff.expected}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {status !== "idle" &&
                    status !== "running" &&
                    status !== "Accepted" &&
                    status !== "Wrong Answer" && (
                      <div className="space-y-4">
                        <pre className="bg-black/40 p-4 rounded-xl border border-white/5 text-rose-300/80 font-mono text-sm whitespace-pre-wrap">
                          {output}
                        </pre>
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}