"use client";

import { useState, useEffect, useRef } from "react";
import { Activity } from "../types/activity";
import { ActivityLog } from "../types/activityLog";
import axios from "axios";
import Head from "next/head";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Define colors for charts
const chartColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#a4de6c",
  "#d0ed57",
  "#8dd1e1",
  "#83a6ed",
];

const apiUrl = "http://localhost:5000/api";

const formatTimeNew = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

// Convert seconds to HH:MM:SS
const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const addActivityLog = async (
  activityId: string,
  startTime: string,
  endTime: string,
  selectedTab: string
) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const start = new Date(`${today}T${startTime}`);
    const end = new Date(`${today}T${endTime}`);
    const diff = (end.getTime() - start.getTime()) / 1000; // convert ms to minutes

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Invalid time format.");
      return;
    }

    if (start >= end) {
      toast.error("Start time must be before end time.");
      return;
    }

    if (selectedTab === "Manual Entry" && diff < 15 * 60) {
      toast.error("Duration must be at least 15 minutes.");
      return;
    }

    await axios.post(`${apiUrl}/activityLogs`, {
      activityId,
      startTime,
      endTime,
    });

    const activityName = await getActivityName(activityId);
    toast.success(`✅ Logged ${activityName} for ${formatTime(diff)}`);
    // Optionally, reset form or show success message
  } catch (error) {
    console.error("Error submitting activity log:", error);
  }
};

const deleteActivityLogs = async (id: string) => {
  try {
    const response = await axios.delete(`${apiUrl}/activityLogs/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting activity logs:", error);
  }
};

const sumLogsByPeriod = (
  logs: ActivityLog[],
  period: "today" | "week" | "month" | "lastMonth" | "year"
) => {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = day === 0 ? 6 : day - 1; // Treat Monday as start
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const toFullDate = (baseDate: Date, timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const fullDate = new Date(baseDate);
    fullDate.setHours(hours, minutes, 0, 0);
    return fullDate;
  };

  return logs.reduce((total, log) => {
    const logDate = new Date(log.createdAt); // use log.createdAt as the actual date
    const start = toFullDate(logDate, log.startTime);
    const end = toFullDate(logDate, log.endTime);
    const duration = (end.getTime() - start.getTime()) / 1000; // seconds

    switch (period) {
      case "today":
        if (start >= startOfToday) return total + duration;
        break;
      case "week":
        if (start >= startOfWeek) return total + duration;
        break;
      case "month":
        if (start >= startOfMonth) return total + duration;
        break;
      case "lastMonth":
        if (start >= startOfLastMonth && start <= endOfLastMonth)
          return total + duration;
        break;
      case "year":
        if (start >= startOfYear) return total + duration;
        break;
    }

    return total;
  }, 0);
};

const fetchActivities = async () => {
  try {
    const response = await axios.get(`${apiUrl}/activities`);
    return response.data;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

const addActivity = async (name: string, color: string) => {
  try {
    const response = await axios.post(`${apiUrl}/activities`, { name, color });
    return response.data;
  } catch (error) {
    console.error("Error adding activity:", error);
  }
};

const deleteActivity = async (id: string) => {
  try {
    const response = await axios.delete(`${apiUrl}/activities/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting activity:", error);
  }
};

const getActivityName = async (id: string) => {
  try {
    const response = await axios.get(`${apiUrl}/activities/name/${id}`);
    return response.data.name;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

export default function HomePage() {
  const [selectedTab, setSelectedTab] = useState("Overview");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [refreshKey, setRefreshKey] = useState(1);

  const tabs = ["Overview", "Timer", "Manual Entry", "Activities"];

  // Calculate data for charts
  const chartData = activities.map((activity, index) => {
    const logsForActivity = logs.filter(
      (log) => log.activityId === activity._id
    );
    const total = sumLogsByPeriod(logsForActivity, "week");
    return {
      name: activity.name,
      time: parseFloat((total / 3600).toFixed(2)), // convert to hours
      color: activity.color || chartColors[index % chartColors.length],
    };
  });

  // Start Timer
  const handleStart = () => {
    if (!selectedActivityId) {
      toast.error("Please select an activity.");
      return;
    }

    const now = new Date();
    setStartTime(now);
    setIsRunning(true);

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  // Stop Timer
  const handleStop = () => {
    if (!startTime || !selectedActivityId) return;

    const formatTimeForLog = (date: Date) => date.toTimeString().slice(0, 8); // HH:MM:SS

    const end = new Date();
    const startStr = formatTimeForLog(startTime); // HH:MM:SS
    const endStr = formatTimeForLog(end); // HH:MM:SS

    clearInterval(timerRef.current!);
    setIsRunning(false);
    setElapsedTime(0);
    setStartTime(null);

    (async () => {
      await addActivityLog(selectedActivityId, startStr, endStr, selectedTab);
      setRefreshKey((prev) => prev + 1);
    })();
  };

  const handleAddActivity = async (name: string, color: string) => {
    const newActivity = await addActivity(name, color);
    if (newActivity) {
      setActivities([...activities, newActivity]);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    await deleteActivityLogs(id);
    const deletedActivity = await deleteActivity(id);
    if (deletedActivity) {
      setActivities(activities.filter((act) => act._id !== id));
    }
    setRefreshKey((prev) => prev + 1);
  };

  const handleChangeActivity = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isRunning) {
      toast.error("Cannot change activity while the timer is running!");
      return;
    }
    setSelectedActivityId(e.target.value);
  };

  useEffect(() => {
    const getActivities = async () => {
      const activities = await fetchActivities();
      setActivities(activities);
    };
    getActivities();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const getActivityLogs = async () => {
      try {
        const response = await axios.get(`${apiUrl}/activityLogs`);
        setLogs(response.data);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      }
    };

    getActivityLogs();
  }, []);

  useEffect(() => {
    const getData = async () => {
      setIsLoadingOverview(true);
      try {
        const [activitiesRes, logsRes] = await Promise.all([
          axios.get(`${apiUrl}/activities`),
          axios.get(`${apiUrl}/activityLogs`),
        ]);
        console.log(activitiesRes.data);
        console.log(logsRes.data);
        setActivities(activitiesRes.data);
        setLogs(logsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingOverview(false);
      }
    };

    getData();
  }, [refreshKey]); // now it reruns on refreshKey change

  return (
    <div>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-800 text-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-gray-900 shadow-xl rounded-3xl p-8 space-y-10">
          <h1 className="text-4xl font-bold text-center text-blue-400">
            🎯 Activity Tracker
          </h1>

          <div className="flex justify-center flex-wrap gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-sm ${
                  selectedTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-blue-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-center">
            {selectedTab === "Overview" && (
              <div className="space-y-10 px-4 py-6">
                {isLoadingOverview ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid" />
                  </div>
                ) : (
                  <>
                    {/* 1. 📊 Time Spent per Activity */}
                    <section>
                      <h2 className="justify-center text-2xl font-bold mb-6 text-white flex items-center gap-">
                        📊 Time Spent per Activity (This Week)
                        <span className="text-sm text-gray-400 font-normal">
                          (auto-calculated)
                        </span>
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                        {isLoadingOverview ? (
                          <div className="h-32 w-full col-span-full flex justify-center items-center">
                            <span className="text-gray-400">Loading...</span>
                          </div>
                        ) : activities.length === 0 ? (
                          <div className="col-span-full w-full flex items-center justify-center p-6 bg-gray-800 rounded-2xl shadow-inner border border-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 8h.01M16 8h.01M12 16h.01M12 12h.01M12 8h.01"
                                />
                              </svg>
                              <p className="text-gray-400 font-medium text-sm">
                                No activities found for this week.
                              </p>
                            </div>
                          </div>
                        ) : (
                          activities.map((activity) => {
                            const activityLogs = logs.filter(
                              (log) => log.activityId === activity._id
                            );
                            const totalTime = sumLogsByPeriod(
                              activityLogs,
                              "week"
                            );

                            return (
                              <div
                                key={activity._id}
                                className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700 p-5 rounded-2xl shadow-lg border-l-8 transition-all duration-300 hover:scale-[1.02]"
                                style={{ borderColor: activity.color }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-xl font-semibold text-white">
                                    {activity.name}
                                  </h3>
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: activity.color }}
                                  ></div>
                                </div>
                                <p className="text-gray-400 mt-2">
                                  <span className="text-gray-300">
                                    ⏱️ Total This Week:
                                  </span>{" "}
                                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    {formatTimeNew(totalTime)}
                                  </span>
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>

                    {/* 2. 📈 Weekly Chart */}
                    <section>
                      <h2 className="text-2xl font-bold mb-4 text-white">
                        📈 Weekly Chart per Activity
                      </h2>

                      {chartData.length === 0 ? (
                        <div className="bg-gray-800 text-gray-400 p-4 rounded-xl text-center">
                          No data available for charts.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Bar Chart */}
                          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                            <h3 className="text-white mb-2">
                              Hours Spent Per Activity
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="#ccc" />
                                <YAxis stroke="#ccc" />
                                <Tooltip />
                                <Bar dataKey="time">
                                  {chartData.map((entry, index) => (
                                    <Cell
                                      key={`bar-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Pie Chart */}
                          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                            <h3 className="text-white mb-2">
                              Activity Time Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  dataKey="time"
                                  nameKey="name"
                                  outerRadius={90}
                                  label
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* 3. ⏱ Total Time Spent + 📅 Recent Logs (side by side) */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {/* ⏱ Time Summary */}
                      <div>
                        <h2 className="text-2xl font-bold mb-4 text-white">
                          ⏱ Time Spent
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                          {isLoadingOverview ? (
                            <div className="h-24 w-full" />
                          ) : activities.length === 0 ? (
                            <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-md">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6 text-gray-500 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 8h.01M16 8h.01M12 16h.01M12 12h.01M12 8h.01"
                                />
                              </svg>
                              <p className="text-sm text-gray-400 font-semibold">
                                No logs found.
                              </p>
                            </div>
                          ) : (
                            [
                              {
                                label: "Today",
                                value: sumLogsByPeriod(logs, "today"),
                              },
                              {
                                label: "This Week",
                                value: sumLogsByPeriod(logs, "week"),
                              },
                              {
                                label: "This Month",
                                value: sumLogsByPeriod(logs, "month"),
                              },
                              {
                                label: "This Year",
                                value: sumLogsByPeriod(logs, "year"),
                              },
                            ].map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-xl shadow-inner text-white"
                              >
                                <p className="text-sm">{item.label}</p>
                                <p className="text-xl font-bold mt-1">
                                  {formatTimeNew(item.value)}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* 📅 Recent Logs */}
                      <div>
                        <h2 className="text-2xl font-bold mb-4 text-white">
                          📅 Recent Logs
                        </h2>
                        <ul className="divide-y divide-gray-700 bg-gray-800 rounded-xl overflow-hidden">
                          {isLoadingOverview ? (
                            <div className="h-12 w-full" />
                          ) : activities.length === 0 ? (
                            <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-md">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6 text-gray-500 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 8h.01M16 8h.01M12 16h.01M12 12h.01M12 8h.01"
                                />
                              </svg>
                              <p className="text-sm text-gray-400 font-semibold">
                                No logs found.
                              </p>
                            </div>
                          ) : (
                            logs
                              .slice(-5)
                              .reverse()
                              .map((log) => {
                                const activity = activities.find(
                                  (a) => a._id === log.activityId
                                );

                                // 👇 Combine today's date with the time strings
                                const today = new Date()
                                  .toISOString()
                                  .split("T")[0]; // "2025-04-20"
                                const start = new Date(
                                  `${today}T${log.startTime}`
                                );
                                const end = new Date(`${today}T${log.endTime}`);
                                const duration =
                                  (end.getTime() - start.getTime()) / 1000;

                                return (
                                  <li
                                    key={log._id}
                                    className="px-4 py-3 flex justify-between items-center hover:bg-gray-700 transition"
                                  >
                                    <div className="text-left">
                                      {" "}
                                      {/* 👈 Fix activity text alignment */}
                                      <p className="font-semibold text-white">
                                        {activity?.name ?? "Unknown Activity"}
                                      </p>
                                      <p className="text-sm text-gray-400">
                                        {start.toLocaleTimeString()} -{" "}
                                        {end.toLocaleTimeString()}
                                      </p>
                                    </div>
                                    <span className="text-sm font-medium text-blue-400">
                                      {isNaN(duration)
                                        ? "Invalid duration"
                                        : formatTimeNew(duration)}
                                    </span>
                                  </li>
                                );
                              })
                          )}
                        </ul>
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}

            {selectedTab === "Timer" && (
              <div className="mt-6 max-w-xl mx-auto space-y-6">
                {/* Heading */}
                <h2 className="text-xl font-semibold text-center text-white flex items-center justify-center gap-2">
                  ⏳ Timer Mode
                </h2>

                {/* Activity Dropdown */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="timerActivity"
                    className="text-base font-semibold text-blue-300 tracking-wide"
                  >
                    🔍 Select Activity
                  </label>
                  <select
                    id="timerActivity"
                    disabled={isRunning}
                    className="w-full px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    value={selectedActivityId ?? ""}
                    onChange={handleChangeActivity}
                  >
                    <option value="">-- Select an Activity --</option>
                    {activities.map((act) => (
                      <option key={act._id} value={act._id}>
                        {act.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timer Display */}
                <div className="text-4xl font-mono text-center text-blue-400 bg-gray-900 p-4 rounded-xl shadow-inner">
                  {formatTime(elapsedTime)}
                </div>

                {/* Buttons */}
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                  >
                    ▶️ Start Timer
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                  >
                    ⏹ Stop & Save
                  </button>
                )}

                <ToastContainer
                  transition={Slide}
                  position="top-center"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                />
              </div>
            )}

            {selectedTab === "Manual Entry" && (
              <div className="mt-6 max-w-xl mx-auto space-y-6">
                {/* Heading */}
                <h2 className="text-xl font-semibold text-center text-white flex items-center justify-center gap-2">
                  📝 Manual Entry
                </h2>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="activity"
                      className="text-base font-semibold text-blue-300 tracking-wide"
                    >
                      🔍 Select Activity
                    </label>
                    <select
                      id="activity"
                      className="w-full px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choose an Activity --</option>
                      {activities.map((act) => (
                        <option key={act._id} value={act._id} id="activity">
                          {act.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Inputs Side by Side */}
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 w-1/2">
                      <label
                        htmlFor="startTime"
                        className="text-base font-semibold text-green-300 tracking-wide"
                      >
                        ⏰ Start Time
                      </label>
                      <input
                        id="startTime"
                        type="time"
                        className="w-full px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2 w-1/2">
                      <label
                        htmlFor="endTime"
                        className="text-base font-semibold text-pink-300 tracking-wide"
                      >
                        🛑 End Time
                      </label>
                      <input
                        id="endTime"
                        type="time"
                        className="w-full px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={() => {
                      const activityId = (
                        document.getElementById("activity") as HTMLSelectElement
                      ).value;
                      const startTime = (
                        document.getElementById("startTime") as HTMLInputElement
                      ).value;
                      const endTime = (
                        document.getElementById("endTime") as HTMLInputElement
                      ).value;

                      if (activityId && startTime && endTime) {
                        (async () => {
                          await addActivityLog(
                            activityId,
                            startTime,
                            endTime,
                            selectedTab
                          );
                          setRefreshKey((prev) => prev + 1);
                        })();
                      } else {
                        toast.error("❗ Please fill out all fields.");
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                  >
                    ➕ Submit Entry
                  </button>

                  <ToastContainer
                    transition={Slide}
                    position="top-center"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                  />
                </div>
              </div>
            )}

            {selectedTab === "Activities" && (
              <div className="flex flex-col gap-4 mt-6">
                {/* Heading */}
                <h2 className="text-xl font-semibold text-center text-white flex items-center justify-center gap-2">
                  🎯 Activities
                </h2>
                <div className="flex gap-4">
                  <input
                    id="newActivityName"
                    type="text"
                    placeholder="New Activity"
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    id="newActivityColor"
                    type="color"
                    className="w-12 h-12 rounded-lg border border-gray-600"
                  />
                  <button
                    onClick={() => {
                      const nameInput = document.getElementById(
                        "newActivityName"
                      ) as HTMLInputElement | null;
                      const colorInput = document.getElementById(
                        "newActivityColor"
                      ) as HTMLInputElement | null;

                      if (nameInput && colorInput) {
                        const name = nameInput.value.trim();
                        const color = colorInput.value || "#3b82f6"; // Tailwind blue-500

                        if (name && color) {
                          handleAddActivity(name, color);

                          // Clear the inputs
                          nameInput.value = "";
                          colorInput.value = "";
                        }
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                  >
                    ➕ Add Activity
                  </button>
                </div>

                <ul className="space-y-2">
                  {activities.map((act) => (
                    <li
                      key={act._id}
                      className="flex justify-between items-center bg-gray-700 p-4 rounded-xl shadow-sm hover:bg-gray-600 transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          style={{ backgroundColor: act.color }}
                          className="w-4 h-4 rounded-full border border-white"
                        ></span>
                        <span className="font-medium">{act.name}</span>
                      </span>
                      <button
                        onClick={() => handleDeleteActivity(act._id)}
                        className="text-red-400 hover:text-red-200 transition-colors font-semibold"
                      >
                        ❌ Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// TODO: Recent logs time is invalid, does not update on deletiong or addition of entry or activity
// TODO: Add chart
