function skillWord(value) {
  const n = parseFloat(value);
  if (n <= 2.5) return "Beginner";
  if (n <= 4.5) return "Improver";
  if (n <= 6.5) return "Intermediate";
  if (n <= 8.5) return "Advanced";
  return "Expert";
}

const planArea = document.getElementById("planArea");

async function loadPlan() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { data: profiles } = await db
    .from("profiles")
    .select("skill, weaknesses, weekly_goal")
    .eq("user_id", user.id);

  if (!profiles || profiles.length === 0) {
    window.location.href = "onboarding.html";
    return;
  }

  const skill = profiles[0].skill;
  const weaknesses = JSON.parse(profiles[0].weaknesses || "[]");
  const goal = parseInt(profiles[0].weekly_goal) || 7;

  // count drills completed in the last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: completions } = await db
    .from("completions")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", weekAgo);
  const doneThisWeek = completions ? completions.length : 0;

  planArea.innerHTML = `
    <h2>Your Practice Plan</h2>
    <p>Your level: <span class="badge">${skill} — ${skillWord(skill)}</span></p>
    <p class="progress">Completed this week: <strong>${doneThisWeek} / ${goal}</strong></p>
    <p class="intro">Generating fresh drills for you…</p>
  `;

  if (weaknesses.length === 0) {
    planArea.innerHTML += `<p>You didn't pick any focus areas. <a href="onboarding.html">Pick some</a> to get drills.</p>`;
    return;
  }

  try {
    const resp = await fetch("/api/generate-drills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, weaknesses }),
    });
    const result = await resp.json();
    if (!result.plan) throw new Error("No plan returned");

    let html = `
      <h2>Your Practice Plan</h2>
      <p>Your level: <span class="badge">${skill} — ${skillWord(skill)}</span></p>
      <p class="progress">Completed this week: <strong>${doneThisWeek} / ${goal}</strong></p>
      <p class="intro">Work through these this week. Quality reps over speed.</p>
    `;

    result.plan.forEach((section) => {
      html += `<h3>${section.focus}</h3>`;
      section.drills.forEach((d, i) => {
        html += `<div class="drill"><span class="num">${i + 1}</span><div><strong>${d.name}</strong><p>${d.desc}</p></div></div>`;
      });
    });

    html += `<a href="onboarding.html" class="editBtn">Edit my focus areas</a>`;
    html += `<button id="regenBtn" class="editBtn" style="margin-left:10px;cursor:pointer;background:none;font-family:inherit;font-size:1em;">New drills</button>`;

    planArea.innerHTML = html;
    document.getElementById("regenBtn").addEventListener("click", loadPlan);
  } catch (err) {
    planArea.innerHTML += `<p>Couldn't generate drills right now. Refresh to try again.</p>`;
  }
}

loadPlan();