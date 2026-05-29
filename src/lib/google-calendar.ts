import { prisma } from "@/lib/db";
import type { calendar_v3 } from "googleapis";

/**
 * Build a Google Calendar client for a specific user using their stored
 * OAuth tokens. Refreshes the access token automatically when expired.
 *
 * `googleapis` is dynamically imported so the 100MB+ package doesn't get
 * bundled into routes that only *might* call this (events POST, sync, etc.).
 */
export async function getCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) {
    throw new Error("Google account not connected");
  }

  const { google } = await import("googleapis");
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  oauth2.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? account.access_token,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : account.expires_at,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
      },
    });
  });

  return google.calendar({ version: "v3", auth: oauth2 });
}

export type GoogleEvent = calendar_v3.Schema$Event;
