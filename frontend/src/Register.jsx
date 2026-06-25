import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, User, Mail, Lock, UserPlus, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function Register({ setAuthView, onRegister }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/register",
        { username, email, password },
        { withCredentials: true }
      );
      onRegister(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-[80vh] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md bg-[#0a0a0a]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500" />
        
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Activity size={32} className="text-cyan-400" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Join Automata</h2>
          <p className="text-gray-400 text-sm font-mono tracking-widest uppercase">Register Directive</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Codename</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                placeholder="ghost_in_shell"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Email Matrix</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                placeholder="operative@automata.net"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Security Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="font-mono text-sm uppercase tracking-widest">Initializing...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span className="font-mono text-sm uppercase tracking-widest">Register Access</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setAuthView('login')}
            className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center justify-center w-full space-x-1"
          >
            <ArrowLeft size={14} />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}