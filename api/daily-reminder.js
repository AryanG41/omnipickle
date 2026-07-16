import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    webpush.setVapidDetails(
      "mailto:aryan.goyal1811@gmail.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: subs, error } = await supabase.from("push_subscriptions").select("subscription");
    if (error) throw error;

    const payload = JSON.stringify({
      title: "OmniPickle",
      body: "Time to train — keep your streak alive! 🎾",
    });

    let sent = 0;
    for (const row of subs || []) {
      try {
        await webpush.sendNotification(JSON.parse(row.subscription), payload);
        sent++;
      } catch (e) {}
    }

    res.status(200).json({ sent });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}