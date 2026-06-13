import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Activity,
  LayoutDashboard,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const EMPTY_STARTER_CODE = {
  cpp: "",
  javascript: "",
  python: "",
};

const EMPTY_TEST_CASES = [
  {
    input: "",
    expectedOutput: "",
    isHidden: false,
  },
];

export default function AdminDashboard({ user, onBack }) {
  const [problems, setProblems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    difficulty: "Easy",
    timeLimitMs: 2000,
    memoryLimitKb: 256000,
    starterCodeJSON: JSON.stringify(EMPTY_STARTER_CODE, null, 2),
    testCasesJSON: JSON.stringify(EMPTY_TEST_CASES, null, 2),
  });

  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/api/problems`, {
        withCredentials: true,
      });

      setProblems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load problems."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      difficulty: "Easy",
      timeLimitMs: 2000,
      memoryLimitKb: 256000,
      starterCodeJSON: JSON.stringify(EMPTY_STARTER_CODE, null, 2),
      testCasesJSON: JSON.stringify(EMPTY_TEST_CASES, null, 2),
    });

    setCurrentProblem(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleEdit = (problem) => {
    setFormData({
      title: problem.title || "",
      slug: problem.slug || "",
      description: problem.description || "",
      difficulty: problem.difficulty || "Easy",
      timeLimitMs: problem.timeLimitMs || 2000,
      memoryLimitKb: problem.memoryLimitKb || 256000,
      starterCodeJSON: JSON.stringify(
        problem.starterCode || EMPTY_STARTER_CODE,
        null,
        2
      ),
      testCasesJSON: JSON.stringify(
        problem.testCases || EMPTY_TEST_CASES,
        null,
        2
      ),
    });

    setCurrentProblem(problem);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this problem?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await axios.delete(`${API_BASE_URL}/api/problems/${id}`, {
        withCredentials: true,
      });

      await fetchProblems();
    } catch (err) {
      console.error("Delete error:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete problem."
      );
    }
  };

  const validateParsedData = (starterCode, testCases) => {
    if (
      typeof starterCode !== "object" ||
      starterCode === null ||
      Array.isArray(starterCode)
    ) {
      throw new Error("Starter Code must be a JSON object.");
    }

    if (!Array.isArray(testCases)) {
      throw new Error("Test Cases must be a JSON array.");
    }

    for (let i = 0; i < testCases.length; i += 1) {
      const tc = testCases[i];

      if (typeof tc.input !== "string") {
        throw new Error(`Test case ${i + 1}: input must be a string.`);
      }

      if (typeof tc.expectedOutput !== "string") {
        throw new Error(`Test case ${i + 1}: expectedOutput must be a string.`);
      }

      if (typeof tc.isHidden !== "boolean") {
        throw new Error(`Test case ${i + 1}: isHidden must be true or false.`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let parsedStarterCode;
    let parsedTestCases;

    try {
      parsedStarterCode = JSON.parse(formData.starterCodeJSON);
      parsedTestCases = JSON.parse(formData.testCasesJSON);

      validateParsedData(parsedStarterCode, parsedTestCases);
    } catch (jsonErr) {
      alert(
        `JSON Format Error:\n${jsonErr.message}\n\nCheck quotes, commas, brackets, and boolean values.`
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description,
        difficulty: formData.difficulty,
        timeLimitMs: Number(formData.timeLimitMs),
        memoryLimitKb: Number(formData.memoryLimitKb),
        starterCode: parsedStarterCode,
        testCases: parsedTestCases,
      };

      if (!payload.title || !payload.slug || !payload.description) {
        alert("Title, slug, and description are required.");
        return;
      }

      if (currentProblem) {
        await axios.put(
          `${API_BASE_URL}/api/problems/${currentProblem._id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post(`${API_BASE_URL}/api/problems`, payload, {
          withCredentials: true,
        });
      }

      setIsEditing(false);
      resetForm();
      await fetchProblems();
    } catch (err) {
      console.error("Save error:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to save problem.";

      alert(`Server/Database Error:\n${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-48px)] w-full flex flex-col p-8 overflow-hidden"
    >
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <Database size={24} className="text-cyan-400" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              System Override
            </h1>
            <p className="text-cyan-500/70 text-xs font-mono tracking-widest uppercase">
              Admin Operations Panel
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-mono text-gray-400 hover:text-white"
          >
            <LayoutDashboard size={14} />
            <span>Return to Matrix</span>
          </button>

          {!isEditing && (
            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            >
              <Plus size={16} />
              <span className="text-sm font-mono uppercase tracking-widest">
                Inject Data
              </span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full overflow-y-auto pr-4 custom-scrollbar"
            >
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-cyan-400 font-mono animate-pulse">
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Loading problem database...
                </div>
              ) : problems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 font-mono">
                  No problems found. Create your first problem.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {problems.map((p) => (
                    <div
                      key={p._id}
                      className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all backdrop-blur-md shadow-xl flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-widest border ${
                            p.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : p.difficulty === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {p.difficulty}
                        </span>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 bg-white/5 hover:bg-cyan-500/20 rounded text-gray-400 hover:text-cyan-400 transition-colors"
                            title="Edit problem"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(p._id)}
                            className="p-1.5 bg-white/5 hover:bg-rose-500/20 rounded text-gray-400 hover:text-rose-400 transition-colors"
                            title="Delete problem"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">
                        {p.title}
                      </h3>

                      <p className="text-xs text-gray-500 font-mono mb-4 flex-1">
                        /{p.slug}
                      </p>

                      <div className="flex justify-between text-[10px] font-mono text-gray-600 border-t border-white/5 pt-3">
                        <span>{p.testCases?.length || 0} Cases</span>
                        <span>{p.timeLimitMs || 2000}ms Limit</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto pr-4 custom-scrollbar"
            >
              <form
                onSubmit={handleSubmit}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-md shadow-xl space-y-6"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Activity size={18} className="text-cyan-400" />
                    <span>
                      {currentProblem
                        ? "Reconfigure Problem"
                        : "Initialize New Problem"}
                    </span>
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-rose-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, "-"),
                        })
                      }
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          difficulty: e.target.value,
                        })
                      }
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Time Limit (ms)
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={formData.timeLimitMs}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeLimitMs: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Memory Limit (kb)
                    </label>
                    <input
                      type="number"
                      required
                      min={64000}
                      value={formData.memoryLimitKb}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          memoryLimitKb: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                    Description HTML
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm custom-scrollbar"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Starter Code JSON
                    </label>
                    <textarea
                      required
                      rows={12}
                      value={formData.starterCodeJSON}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          starterCodeJSON: e.target.value,
                        })
                      }
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-emerald-400 focus:outline-none focus:border-cyan-500/50 font-mono text-xs custom-scrollbar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Test Cases JSON
                    </label>
                    <textarea
                      required
                      rows={12}
                      value={formData.testCasesJSON}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          testCasesJSON: e.target.value,
                        })
                      }
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-emerald-400 focus:outline-none focus:border-cyan-500/50 font-mono text-xs custom-scrollbar"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span className="font-mono uppercase tracking-widest text-sm">
                          Saving...
                        </span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span className="font-mono uppercase tracking-widest text-sm">
                          Commit Changes
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}