'use client';

import { useState, useEffect, useRef } from "react";
import { sampleActivities } from "../data/activities";
import { sampleActivityLogs } from "../data/activityLogs";
import { Activity } from "../types/activity";
import { ActivityLog } from "../types/activityLog";
import axios from 'axios';
import { start } from "repl";
// Import this at the top
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const apiUrl = 'http://localhost:5000/api';

const addActivityLog = async (activityId: string, startTime: string, endTime: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const start = new Date(`${today}T${startTime}`);
    const end = new Date(`${today}T${endTime}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60); // convert ms to minutes
  
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Invalid time format.");
      return;
    }
  
    if (start >= end) {
      toast.error("Start time must be before end time.");
      return;
    }
  
    if (diff < 15) {
      toast.error("Duration must be at least 15 minutes.");
      return;
    }

    const response = await axios.post(`${apiUrl}/activityLogs`, {
      activityId,
      startTime,
      endTime,
    });
    console.log("Activity Log Submitted:", response.data);
    // Optionally, reset form or show success message
  } catch (error) {
    console.error("Error submitting activity log:", error);
  }
};

const fetchActivities = async () => {
  try {
    const response = await axios.get(`${apiUrl}/activities`);
    console.log(response);
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};

const addActivity = async (name: string, color: string) => {
  try {
    const response = await axios.post(`${apiUrl}/activities`, { name, color });
    return response.data;
  } catch (error) {
    console.error('Error adding activity:', error);
  }
};

const deleteActivity = async (id: string) => {
  try {
    const response = await axios.delete(`${apiUrl}/activities/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting activity:', error);
  }
};

export default function HomePage() {
  const [selectedTab, setSelectedTab] = useState("Overview");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  const tabs = ["Overview", "Timer", "Manual Entry", "Activities"];

  // Convert seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

    const end = new Date();
    const startStr = startTime.toTimeString().slice(0, 5); // HH:MM
    const endStr = end.toTimeString().slice(0, 5); // HH:MM

    clearInterval(timerRef.current!);
    setIsRunning(false);
    setElapsedTime(0);
    setStartTime(null);

    addActivityLog(selectedActivityId, startStr, endStr);
    toast.success("Activity logged successfully!");
  };


  const handleAddActivity = async (name: string, color: string) => {
    const newActivity = await addActivity(name, color);
    if (newActivity) {
      setActivities([...activities, newActivity]);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const deletedActivity = await deleteActivity(id);
    if (deletedActivity) {
      setActivities(activities.filter((act) => act._id !== id));
    }
  };

  // TODO: Cannot change activity when timer running
  // TODO: Activity Logged should be green in color
  // TODO: Not able to log activity in seconds for timer
  // const handleChangeActivity = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   if (isRunning) {
  //     toast.error("Cannot change activity while the timer is running!");
  //     return;
  //   }
  //   setSelectedActivity(e.target.value);
  // };

  useEffect(() => {
    const getActivities = async () => {
      const activities = await fetchActivities();
      setActivities(activities);
    };
    getActivities();
  }, []);

  return (
    <main className="min-h-screen bg-gray-800 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 shadow-xl rounded-3xl p-8 space-y-10">
        <h1 className="text-4xl font-bold text-center text-blue-400">🎯 Activity Tracker</h1>

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
            <div className="space-y-6">
              <p className="text-2xl font-semibold">⏱ Time Spent</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-600 p-4 rounded-xl shadow-inner text-white">Today: <strong>3h 25m</strong></div>
                <div className="bg-blue-600 p-4 rounded-xl shadow-inner text-white">This Week: <strong>14h 10m</strong></div>
                <div className="bg-blue-600 p-4 rounded-xl shadow-inner text-white">This Month: <strong>62h 35m</strong></div>
                <div className="bg-blue-600 p-4 rounded-xl shadow-inner text-white">Last Month: <strong>48h 20m</strong></div>
                <div className="bg-blue-600 p-4 rounded-xl shadow-inner text-white md:col-span-2">This Year: <strong>273h 40m</strong></div>
              </div>

              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 mt-6">
                <p className="text-lg font-semibold mb-2 text-gray-300">📊 Charts (Coming Soon)</p>
                <div className="h-40 bg-gray-600 rounded"></div>
              </div>
            </div>
          )}

          {selectedTab === "Timer" && (
            // <div className="space-y-4 max-w-md mx-auto">
            //   <p className="text-xl font-semibold">⏳ Timer Mode</p>
            //   <select className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-gray-300">
            //     {activities.map((act) => (
            //       <option key={act._id} value={act._id}>{act.name}</option>
            //     ))}
            //   </select>
            //   <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow">Start Timer</button>
            // </div>
            <div className="space-y-4 max-w-md mx-auto">
  <p className="text-xl font-semibold">⏳ Timer Mode</p>
  <select
    className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-gray-300"
    value={selectedActivityId ?? ""}
    onChange={(e) => setSelectedActivityId(e.target.value)}
  >
    <option value="">-- Select an Activity --</option>
    {activities.map((act) => (
      <option key={act._id} value={act._id}>{act.name}</option>
    ))}
  </select>

  <div className="text-3xl font-mono text-center text-blue-400">{formatTime(elapsedTime)}</div>

  {!isRunning ? (
    <button
      onClick={handleStart}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow w-full"
    >
      ▶️ Start Timer
    </button>
  ) : (
    <button
      onClick={handleStop}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow w-full"
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
  toastClassName="custom-toast"
  />
</div>

          )}

          {selectedTab === "Manual Entry" && (
            <div className="mt-6 max-w-xl mx-auto space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="activity" className="text-sm font-medium text-gray-300">
                    Select Activity
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
                    <label htmlFor="startTime" className="text-sm font-medium text-gray-300">
                      Start Time
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      className="w-full px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-1/2">
                    <label htmlFor="endTime" className="text-sm font-medium text-gray-300">
                      End Time
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
                    // Placeholder for submit handler
                    const activityId = (document.getElementById("activity") as HTMLSelectElement).value;
                    const startTime = (document.getElementById("startTime") as HTMLInputElement).value;
                    const endTime = (document.getElementById("endTime") as HTMLInputElement).value;
                    if (activityId && startTime && endTime) {
                      console.log(activityId);
                      console.log(startTime);
                      console.log(endTime);
                      addActivityLog(activityId, startTime, endTime);
                    } else {
                      console.error("Please fill out all fields.");
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
                  toastClassName="custom-toast"
                />
              </div>
            </div>

          )}

          {selectedTab === "Activities" && (
            <div className="flex flex-col gap-4 mt-6">
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
                    const name = (document.getElementById('newActivityName') as HTMLInputElement).value;
                    const color = (document.getElementById('newActivityColor') as HTMLInputElement).value;
                    if (name && color) {
                      handleAddActivity(name, color);
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
  );
}
