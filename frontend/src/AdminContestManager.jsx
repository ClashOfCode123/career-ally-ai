import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getLocalDateTimeValue = (date = new Date()) => {
  const copy = new Date(date);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  const hours = String(copy.getHours()).padStart(2, "0");
  const minutes = String(copy.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultStartTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  date.setSeconds(0, 0);
  return getLocalDateTimeValue(date);
};

const getDefaultEndTime = () => {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  date.setMinutes(date.getMinutes() + 10);
  date.setSeconds(0, 0);
  return getLocalDateTimeValue(date);
};

const toISOFromLocalDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date/time selected.");
  }

  return date.toISOString();
};

export default function AdminContestManager({ onBack }) {
  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);

  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [isLoadingContests, setIsLoadingContests] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
    isPublic: true,
  });

  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [selectedProblems, setSelectedProblems] = useState([]);

  const availableProblems = useMemo(() => {
    const selectedIds = new Set(selectedProblems.map((item) => item.problem));

    return problems.filter((problem) => !selectedIds.has(problem._id));
  }, [problems, selectedProblems]);

  const fetchProblems = async () => {
    try {
      setIsLoadingProblems(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/api/problems`, {
        withCredentials: true,
      });

      setProblems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load problems."
      );
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const fetchContests = async () => {
    try {
      setIsLoadingContests(true);

      const res = await axios.get(`${API_BASE_URL}/api/contests`, {
        withCredentials: true,
      });

      setContests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch contests:", err);
    } finally {
      setIsLoadingContests(false);
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchContests();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startTime: getDefaultStartTime(),
      endTime: getDefaultEndTime(),
      isPublic: true,
    });

    setSelectedProblemId("");
    setSelectedProblems([]);
  };

  const addProblemToContest = () => {
    if (!selectedProblemId) {
      alert("Please select a problem first.");
      return;
    }

    const problem = problems.find((item) => item._id === selectedProblemId);

    if (!problem) {
      alert("Selected problem not found.");
      return;
    }

    const nextIndex = String.fromCharCode(65 + selectedProblems.length);

    setSelectedProblems((prev) => [
      ...prev,
      {
        problem: problem._id,
        index: nextIndex,
        points: 100,
        title: problem.title,
        difficulty: problem.difficulty,
      },
    ]);

    setSelectedProblemId("");
  };

  const removeProblemFromContest = (problemId) => {
    setSelectedProblems((prev) =>
      prev
        .filter((item) => item.problem !== problemId)
        .map((item, index) => ({
          ...item,
          index: String.fromCharCode(65 + index),
        }))
    );
  };

  const updateContestProblem = (problemId, field, value) => {
    setSelectedProblems((prev) =>
      prev.map((item) =>
        item.problem === problemId
          ? {
              ...item,
              [field]: field === "points" ? Number(value) : value,
            }
          : item
      )
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      throw new Error("Contest title is required.");
    }

    if (!formData.startTime || !formData.endTime) {
      throw new Error("Start time and end time are required.");
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Invalid start or end time.");
    }

    if (end <= start) {
      throw new Error("End time must be after start time.");
    }

    if (selectedProblems.length === 0) {
      throw new Error("Add at least one problem to the contest.");
    }

    selectedProblems.forEach((item, index) => {
      if (!item.problem) {
        throw new Error(`Problem ${index + 1} is invalid.`);
      }

      if (!item.index.trim()) {
        throw new Error(`Problem ${index + 1} needs an index.`);
      }

      if (!Number.isFinite(Number(item.points)) || Number(item.points) <= 0) {
        throw new Error(`Problem ${item.index} points must be greater than 0.`);
      }
    });
  };

  const handleCreateContest = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      validateForm();

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startTime: toISOFromLocalDateTime(formData.startTime),
        endTime: toISOFromLocalDateTime(formData.endTime),
        isPublic: formData.isPublic,
        problems: selectedProblems.map((item) => ({
          problem: item.problem,
          index: item.index.trim().toUpperCase(),
          points: Number(item.points),
        })),
      };

      await axios.post(`${API_BASE_URL}/api/contests`, payload, {
        withCredentials: true,
      });

      setSuccess("Contest created successfully.");
      resetForm();
      await fetchContests();
    } catch (err) {
      console.error("Create contest error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to create contest."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString();
  };

  return (
    <div className="h-[calc(100vh-48px)] w-full flex flex-col p-8 overflow-hidden">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Trophy size={24} className="text-amber-400" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Contest Control
            </h1>
            <p className="text-amber-500/70 text-xs font-mono tracking-widest uppercase">
              Admin Contest Creation Panel
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              fetchProblems();
              fetchContests();
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-mono text-gray-400 hover:text-white"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-mono text-gray-400 hover:text-white"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 min-h-0 overflow-hidden">
        <form
          onSubmit={handleCreateContest}
          className="h-full overflow-y-auto custom-scrollbar bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarPlus size={18} className="text-amber-400" />
              Create New Contest
            </h2>

            <button
              type="button"
              onClick={resetForm}
              className="p-2 text-gray-400 hover:text-rose-400 transition-colors"
              title="Clear form"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                Contest Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Weekly Contest 1"
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500/50 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                Start Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500/50 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                End Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500/50 font-mono text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Beginner friendly coding contest..."
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500/50 font-mono text-sm custom-scrollbar"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <input
                id="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) =>
                  setFormData({ ...formData, isPublic: e.target.checked })
                }
                className="h-4 w-4 accent-amber-400"
              />
              <label
                htmlFor="isPublic"
                className="text-sm text-gray-300 font-mono"
              >
                Public contest
              </label>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Add Problems</h3>
              <span className="text-xs font-mono text-gray-500">
                {selectedProblems.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <select
                value={selectedProblemId}
                onChange={(e) => setSelectedProblemId(e.target.value)}
                disabled={isLoadingProblems}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500/50 font-mono text-sm"
              >
                <option value="">
                  {isLoadingProblems ? "Loading problems..." : "Select problem"}
                </option>

                {availableProblems.map((problem) => (
                  <option key={problem._id} value={problem._id}>
                    {problem.title} ({problem.difficulty})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={addProblemToContest}
                disabled={!selectedProblemId}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {selectedProblems.map((item) => (
                <div
                  key={item.problem}
                  className="grid grid-cols-1 md:grid-cols-[80px_1fr_120px_auto] gap-3 items-center p-4 bg-black/30 border border-white/10 rounded-xl"
                >
                  <input
                    value={item.index}
                    onChange={(e) =>
                      updateContestProblem(
                        item.problem,
                        "index",
                        e.target.value.toUpperCase()
                      )
                    }
                    className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-amber-500/50 font-mono text-sm"
                  />

                  <div>
                    <div className="text-white font-semibold">{item.title}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {item.difficulty}
                    </div>
                  </div>

                  <input
                    type="number"
                    min={1}
                    value={item.points}
                    onChange={(e) =>
                      updateContestProblem(
                        item.problem,
                        "points",
                        e.target.value
                      )
                    }
                    className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-amber-500/50 font-mono text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => removeProblemFromContest(item.problem)}
                    className="p-2 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove problem"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {selectedProblems.length === 0 && (
                <div className="p-6 text-center text-gray-500 font-mono border border-dashed border-white/10 rounded-xl">
                  No problems added yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-5 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-black font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="font-mono uppercase tracking-widest text-sm">
                    Creating...
                  </span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span className="font-mono uppercase tracking-widest text-sm">
                    Create Contest
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="h-full overflow-y-auto custom-scrollbar bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" />
              Existing Contests
            </h2>

            {isLoadingContests && (
              <Loader2 size={16} className="text-emerald-400 animate-spin" />
            )}
          </div>

          <div className="space-y-4">
            {contests.map((contest) => (
              <div
                key={contest._id}
                className="p-5 rounded-xl bg-black/30 border border-white/10"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="text-white font-bold">{contest.title}</h3>

                  <span
                    className={`text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-widest ${
                      contest.status === "running"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : contest.status === "upcoming"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {contest.status || "unknown"}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-500 font-mono">
                  <div>Start: {formatDateTime(contest.startTime)}</div>
                  <div>End: {formatDateTime(contest.endTime)}</div>
                  <div>Problems: {contest.problems?.length || 0}</div>
                  <div>Participants: {contest.participantCount || 0}</div>
                </div>
              </div>
            ))}

            {!isLoadingContests && contests.length === 0 && (
              <div className="p-6 text-center text-gray-500 font-mono border border-dashed border-white/10 rounded-xl">
                No contests created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
