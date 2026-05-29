import { getCalendarClient, type GoogleEvent } from "@/lib/google-calendar";
import { prisma } from "@/lib/db";

function toDate(part: { dateTime?: string | null; date?: string | null }) {
  if (part.dateTime) return new Date(part.dateTime);
  if (part.date) return new Date(part.date);
  return null;
}

/**
 * Pull events from Google Calendar within [timeMin, timeMax] and upsert them
 * into the local DB. Local-only events (no googleId) are left untouched.
 */
export async function pullFromGoogle(
  userId: string,
  timeMin: Date,
  timeMax: Date,
) {
  const calendar = await getCalendarClient(userId);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const items = res.data.items ?? [];
  const now = new Date();

  for (const item of items) {
    if (!item.id || !item.start || !item.end) continue;
    const start = toDate(item.start);
    const end = toDate(item.end);
    if (!start || !end) continue;

    await prisma.event.upsert({
      where: { googleId: item.id },
      update: {
        title: item.summary ?? "(제목 없음)",
        description: item.description ?? null,
        location: item.location ?? null,
        start,
        end,
        allDay: !!item.start.date,
        syncedAt: now,
      },
      create: {
        userId,
        googleId: item.id,
        calendarId: "primary",
        title: item.summary ?? "(제목 없음)",
        description: item.description ?? null,
        location: item.location ?? null,
        start,
        end,
        allDay: !!item.start.date,
        syncedAt: now,
      },
    });
  }

  return items.length;
}

type PushPayload = {
  title: string;
  description?: string | null;
  location?: string | null;
  start: Date;
  end: Date;
  allDay?: boolean;
};

function toGoogleEvent(p: PushPayload): GoogleEvent {
  return p.allDay
    ? {
        summary: p.title,
        description: p.description ?? undefined,
        location: p.location ?? undefined,
        start: { date: p.start.toISOString().slice(0, 10) },
        end: { date: p.end.toISOString().slice(0, 10) },
      }
    : {
        summary: p.title,
        description: p.description ?? undefined,
        location: p.location ?? undefined,
        start: { dateTime: p.start.toISOString() },
        end: { dateTime: p.end.toISOString() },
      };
}

export async function pushCreate(userId: string, eventId: string) {
  const event = await prisma.event.findFirstOrThrow({
    where: { id: eventId, userId },
  });
  const calendar = await getCalendarClient(userId);
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: toGoogleEvent(event),
  });
  if (res.data.id) {
    await prisma.event.update({
      where: { id: event.id },
      data: { googleId: res.data.id, syncedAt: new Date() },
    });
  }
}

export async function pushUpdate(userId: string, eventId: string) {
  const event = await prisma.event.findFirstOrThrow({
    where: { id: eventId, userId },
  });
  if (!event.googleId) return pushCreate(userId, eventId);
  const calendar = await getCalendarClient(userId);
  await calendar.events.update({
    calendarId: event.calendarId,
    eventId: event.googleId,
    requestBody: toGoogleEvent(event),
  });
  await prisma.event.update({
    where: { id: event.id },
    data: { syncedAt: new Date() },
  });
}

export async function pushDelete(
  userId: string,
  googleId: string,
  calendarId = "primary",
) {
  const calendar = await getCalendarClient(userId);
  await calendar.events.delete({ calendarId, eventId: googleId });
}
