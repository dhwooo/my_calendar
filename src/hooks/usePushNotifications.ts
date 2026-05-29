"use client";

import * as React from "react";

type Status = "unsupported" | "denied" | "default" | "granted" | "loading";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications() {
  const [status, setStatus] = React.useState<Status>("loading");
  const [subscribed, setSubscribed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as Status);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    const perm = await Notification.requestPermission();
    setStatus(perm as Status);
    if (perm !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await fetch("/api/push/vapid").then((r) => r.json());
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      }),
    });
    setSubscribed(true);
  }

  async function disable() {
    if (typeof window === "undefined") return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch(
        `/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`,
        { method: "DELETE" },
      );
      await sub.unsubscribe();
    }
    setSubscribed(false);
  }

  async function sendTest() {
    await fetch("/api/push/test", { method: "POST" });
  }

  return { status, subscribed, enable, disable, sendTest };
}
