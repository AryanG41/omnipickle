const PUBLIC_KEY = "BF7InIDy1dfUBL68wJwux5WsSwLP_aoLfXyuJryXVbcvkmrvvSY3bC0c71ZKkYWx_6OH2MJUG5dXz8_L2l-kGCc";
const statusEl = document.getElementById("status");

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

document.getElementById("enableBtn").addEventListener("click", async () => {
  try {
    statusEl.textContent = "Registering…";
    const reg = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") { statusEl.textContent = "Permission denied."; return; }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });

    statusEl.textContent = "Subscribed. Sending test…";
    const resp = await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub, title: "OmniPickle", message: "Push works! 🎾" }),
    });
    const data = await resp.json();
    statusEl.textContent = resp.ok ? "Sent! Watch for the notification." : "Error: " + JSON.stringify(data);
  } catch (err) {
    statusEl.textContent = "Error: " + err;
  }
});