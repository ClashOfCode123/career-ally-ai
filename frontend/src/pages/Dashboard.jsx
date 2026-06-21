import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Target, ExternalLink, Activity, Cpu, Layers, MapPin, Briefcase, Building } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [yoe, setYoe] = useState("");
  const [companies, setCompanies] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [country, setCountry] = useState("us");
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [extractedProfile, setExtractedProfile] = useState(null);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        if (data.country_code) {
          setCountry(data.country_code.toLowerCase());
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError("Resume payload required.");
    
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("yoe", yoe);
    formData.append("jobType", jobType);
    formData.append("targetCompanies", companies);
    formData.append("country", country);

    try {
      const res = await axios.post("http://localhost:3000/api/jobs/upload", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMatches(res.data.matches);
      setExtractedProfile(res.data.extractedProfile);
    } catch (err) {
      setError(err.response?.data?.error || "Neural link failed. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans selection:bg-emerald-500/30">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-12"
      >
        <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Cpu size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">AUTOMATA NEXUS</h1>
              <p className="text-emerald-400/70 text-xs font-mono tracking-widest uppercase">Match Engine v2.0</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 font-mono text-xs">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="w-full bg-[#0a0a0a]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              
              <div className="mb-8">
                <h2 className="text-xl font-black tracking-tight mb-1">Initialize Scan</h2>
                <p className="text-gray-400 text-xs font-mono tracking-widest uppercase">Upload parameters</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Resume Payload (PDF)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-[#050505] border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-white/[0.02] transition-all">
                    <UploadCloud className="text-gray-500 mb-2" size={24} />
                    <span className="text-xs font-mono text-gray-400 truncate px-4">
                      {file ? file.name : "AWAITING FILE..."}
                    </span>
                    <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Experience Cycle (Years)</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="number"
                      value={yoe}
                      onChange={(e) => setYoe(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                      placeholder="e.g. 2"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Target Nodes</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      value={companies}
                      onChange={(e) => setCompanies(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-all font-mono text-sm"
                      placeholder="Stripe, Vercel, Google"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Engagement Type</label>
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
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Target Region</label>
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
                    <span className="font-mono text-sm uppercase tracking-widest animate-pulse">Processing...</span>
                  ) : (
                    <span className="font-mono text-sm uppercase tracking-widest">Execute Scan</span>
                  )}
                </motion.button>
              </form>
            </div>

            {extractedProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 backdrop-blur-2xl"
              >
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Extracted Matrix</h3>
                <div className="flex flex-wrap gap-2">
                  {extractedProfile.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-emerald-400">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black tracking-tight">Optimal Matches</h2>
              <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {matches.length} FOUND
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {matches.map((job, index) => (
                  <motion.div
                    key={job._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#0a0a0a]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col group"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      job.matchScore >= 80 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                      job.matchScore >= 50 ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : 
                      "bg-gray-500"
                    }`} />
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div className="pr-4">
                        <h3 className="font-bold text-lg text-white line-clamp-1 mb-1">{job.title}</h3>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <Building size={14} />
                          <span>{job.company}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`font-mono text-2xl font-black ${
                          job.matchScore >= 80 ? "text-emerald-400" : 
                          job.matchScore >= 50 ? "text-cyan-400" : 
                          "text-gray-400"
                        }`}>
                          {job.matchScore}%
                        </span>
                        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Match</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-500 text-xs font-mono mb-6 pl-2">
                      <MapPin size={12} />
                      <span className="truncate">{job.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6 pl-2 flex-grow">
                      {job.tags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded text-[10px] font-mono uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                      {job.tags.length > 4 && (
                        <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-500 rounded text-[10px] font-mono uppercase">
                          +{job.tags.length - 4}
                        </span>
                      )}
                    </div>

                    <a 
                      href={job.applyUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 w-[calc(100%-8px)] flex items-center justify-center space-x-2 bg-white/5 hover:bg-emerald-500/20 text-white hover:text-emerald-400 py-2 rounded-xl transition-all border border-white/5 hover:border-emerald-500/30 text-sm font-mono uppercase tracking-widest"
                    >
                      <span>Deploy App</span>
                      <ExternalLink size={14} />
                    </a>
                  </motion.div>
                ))}

                {matches.length === 0 && !isLoading && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <Briefcase size={48} className="mb-4 opacity-50" />
                    <p className="font-mono text-sm tracking-widest uppercase">Awaiting parameter input</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}