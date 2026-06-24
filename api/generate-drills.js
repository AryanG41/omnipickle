export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    if (!body) body = {};
    const skill = body.skill;
    const weaknesses = body.weaknesses || [];

    const prompt = `You are an expert pickleball coach. A player rates their skill ${skill} out of 10.
Create a practice plan with 3 specific, varied drills for EACH of these focus areas: ${weaknesses.join(", ")}.
Match the difficulty to their level. Each drill needs a short punchy name and a 1-2 sentence description with concrete reps or targets.
Respond ONLY with JSON in exactly this shape:
{"plan":[{"focus":"<area>","drills":[{"name":"...","desc":"..."}]}]}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!data.choices) {
      return res.status(500).json({ openai_error: data });
    }

    const plan = JSON.parse(data.choices[0].message.content);
    res.status(200).json(plan);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}