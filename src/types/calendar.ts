export type CalendarView = "year" | "month" | "week" | "day";

export type EventDTO = {
  id: string;
  googleId: string | null;
  calendarId: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string; // ISO
  end: string;   // ISO
  allDay: boolean;
  color: string | null;
  mood: string | null;
  notifyMinutes?: number | null;
  shared?: boolean;
  userId?: string;
};

export type EventInput = {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
  mood?: string | null;
  notifyMinutes?: number | null;
  shared?: boolean;
};
