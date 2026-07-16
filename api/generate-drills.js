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
    const mode = body.mode || "partner";
    const adjust = body.adjust;

    const modeLine = mode === "solo"
      ? "IMPORTANT: The player is training ALONE with no partner. Only give drills they can do solo — wall drills, footwork and agility, serving practice, target practice, shadow swings. Do NOT include any drill that needs a partner or a feeder."
      : "The player has a partner to train with.";

    let adjustLine = "";
    if (adjust === "harder") adjustLine = "Make these drills noticeably more challenging than usual for this level.";
    else if (adjust === "easier") adjustLine = "Make these drills a bit easier and more approachable.";

    const prompt = `You are an expert pickleball coach. A player rates their skill ${skill} out of 10.
${modeLine}
${adjustLine}
Create a practice plan with 3 specific drills for EACH of these focus areas: ${weaknesses.join(", ")}.

Rules for every drill:
- Use realistic, internally-consistent numbers. NEVER ask for more successes than attempts (for example "20 good drops out of 10 tries" is impossible). Reps, targets, and durations must be achievable and make sense.
- Match the difficulty to the player's level.
- Each drill must clearly belong to its focus area.
- Make the three drills for a focus genuinely different from each other, not reworded versions of the same drill.
- Give each drill a short punchy name and a 1-2 sentence description with concrete, sensible reps or targets.

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