import webpush from "web-push";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { subscription, title, message } = body || {};
    if (!subscription) return res.status(400).json({ error: "No subscription" });

    webpush.setVapidDetails(
      "mailto:aryan.goyal1811@gmail.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: title || "OmniPickle", body: message || "Time to train!" })
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}