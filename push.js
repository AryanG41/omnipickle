const PUBLIC_KEY = "BF7InIDy1dfUBL68wJwux5WsSwLP_aoLfXyuJryXVbcvkmrvvSY3bC0c71ZKkYWx_6OH2MJUG5dXz8_L2l-kGCc";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function enableReminders() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Your browser doesn't support notifications. On iPhone, add OmniPickle to your home screen first, then open it from there.");
      return;
    }
    const reg = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Notifications are blocked. Turn them on in your settings to get reminders.");
      return;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });

    const { data: { user } } = await db.auth.getUser();
    if (!user) { alert("Please log in first."); return; }

    await db.from("push_subscriptions").upsert(
      { user_id: user.id, subscription: JSON.stringify(sub) },
      { onConflict: "user_id" }
    );

    alert("Reminders are on! We'll nudge you if your streak's about to break.");
  } catch (err) {
    alert("Couldn't turn on reminders: " + err);
  }
}