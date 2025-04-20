import { ActivityLog } from "../types/activityLog";

export const sampleActivityLogs: ActivityLog[] = [
  {
    id: "log1",
    activityId: "1",
    activityName: "Gym",
    startTime: "2025-04-20T16:30:00Z",
    endTime: "2025-04-20T17:45:00Z",
    durationMinutes: 75,
    createdAt: "2025-04-20T17:45:30Z",
    mode: "manual",
  },
  {
    id: "log2",
    activityId: "2",
    activityName: "Study",
    startTime: "2025-04-20T10:00:00Z",
    endTime: "2025-04-20T12:30:00Z",
    durationMinutes: 150,
    createdAt: "2025-04-20T12:30:30Z",
    mode: "timer",
  },
  {
    id: "log3",
    activityId: "3",
    activityName: "Meditation",
    startTime: "2025-04-19T06:00:00Z",
    endTime: "2025-04-19T06:20:00Z",
    durationMinutes: 20,
    createdAt: "2025-04-19T06:20:30Z",
    mode: "manual",
  },
];
