export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    if (!body) body = {};
    const messages = body.messages || [];
    const profile = body.profile || {};

    const skill = profile.skill || "unknown";
    const weaknesses = (profile.weaknesses || []).join(", ") || "not specified";

    const systemPrompt = `You are OmniPickle, a friendly expert pickleball coach.
The player rates their skill ${skill} out of 10. They are working on: ${weaknesses}.
Give specific, encouraging, actionable advice on technique, strategy, drills, and positioning.
Keep answers short and practical, like a coach talking courtside. Tailor advice to their level and focus areas.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    const data = await response.json();
    if (!data.choices) {
      return res.status(500).json({ openai_error: data });
    }
    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}