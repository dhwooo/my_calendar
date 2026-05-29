import webpush from "web-push";

type VapidKeys = { publicKey: string; privateKey: string };

let cached: VapidKeys | null = null;

/**
 * Reads VAPID keys from env vars (production-friendly).
 *
 * Required env:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *
 * Generate once locally:
 *   node -e "console.log(require('web-push').generateVAPIDKeys())"
 * and paste both values into your .env / Vercel env vars.
 */
export async function getVapid(): Promise<VapidKeys> {
  if (cached) return cached;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID 키가 설정되지 않았습니다. VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY 환경변수를 추가하세요.",
    );
  }

  const subject = process.env.VAPID_SUBJECT ?? "mailto:dev@dhwoo.local";
  webpush.setVapidDetails(subject, publicKey, privateKey);

  cached = { publicKey, privateKey };
  return cached;
}

export { webpush };
