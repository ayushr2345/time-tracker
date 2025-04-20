export interface ActivityLog {
  id: string;
  activityId: string;
  activityName: string; // optional duplicate for UI display
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  createdAt: string; // when the log was recorded
  mode: "timer" | "manual";
}
