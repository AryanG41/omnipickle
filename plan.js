function skillWord(value) {
  const n = parseFloat(value);
  if (n <= 2.5) return "Beginner";
  if (n <= 4.5) return "Improver";
  if (n <= 6.5) return "Intermediate";
  if (n <= 8.5) return "Advanced";
  return "Expert";
}

const planArea = document.getElementById("planArea");
let userId = null;
let skill = null;
let goal = 7;
let doneThisWeek = 0;

async function loadPlan() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }
  userId = user.id;

  const { data: profiles } = await db
    .from("profiles")
    .select("skill, weaknesses, weekly_goal")
    .eq("user_id", userId);
  if (!profiles || profiles.length === 0) { window.location.href = "onboarding.html"; return; }

  skill = profiles[0].skill;
  const weaknesses = JSON.parse(profiles[0].weaknesses || "[]");
  goal = parseInt(profiles[0].weekly_goal) || 7;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: completions } = await db
    .from("completions").select("id").eq("user_id", userId).gte("created_at", weekAgo);
  doneThisWeek = completions ? completions.length : 0;

  planArea.innerHTML = `
    <h2>Your Practice Plan</h2>
    <p>Your level: <span class="badge">${skill} — ${skillWord(skill)}</span></p>
    <p class="progress" id="progress"></p>
    <p class="intro">Generating fresh drills for you…</p>
  `;
  updateProgress();

  if (weaknesses.length === 0) {
    document.querySelector(".intro").innerHTML = `You didn't pick any focus areas. <a href="onboarding.html">Pick some</a>.`;
    return;
  }

  try {
    const resp = await fetch("/api/generate-drills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, weaknesses }),
    });
    const result = await resp.json();
    if (!result.plan) throw new Error("No plan");

    let html = `
      <h2>Your Practice Plan</h2>
      <p>Your level: <span class="badge">${skill} — ${skillWord(skill)}</span></p>
      <p class="progress" id="progress"></p>
      <p class="intro">Check off drills as you finish — fresh ones appear automatically.</p>
    `;
    result.plan.forEach((section) => {
      html += `<h3>${section.focus}</h3>`;
      section.drills.forEach((d) => {
        html += `
          <div class="drill" data-focus="${section.focus}">
            <input type="checkbox" class="drillCheck">
            <div class="drillBody"><strong>${d.name}</strong><p>${d.desc}</p></div>
          </div>`;
      });
    });
    html += `<a href="onboarding.html" class="editBtn">Edit my focus areas</a>`;
    html += `<a href="chat.html" class="editBtn" style="margin-left:10px;">Talk to your coach</a>`;
    planArea.innerHTML = html;
    updateProgress();

    document.querySelectorAll(".drillCheck").forEach((box) => {
      box.addEventListener("change", () => onCheck(box));
    });
  } catch (err) {
    document.querySelector(".intro").textContent = "Couldn't generate drills right now. Refresh to try again.";
  }
}

function updateProgress() {
  const el = document.getElementById("progress");
  if (!el) return;
  if (doneThisWeek >= goal) {
    el.innerHTML = `All ${goal} drills done this week — rest up! 🎉`;
  } else {
    el.innerHTML = `Completed this week: <strong>${doneThisWeek} / ${goal}</strong>`;
  }
}

async function onCheck(box) {
  if (!box.checked) return;
  const card = box.closest(".drill");
  const focus = card.dataset.focus;
  box.disabled = true;

  await db.from("completions").insert({ user_id: userId, focus: focus });
  doneThisWeek++;
  updateProgress();

  card.classList.add("fading");
  const newDrill = await getOneDrill(skill, focus);

  card.querySelector(".drillBody").innerHTML = `<strong>${newDrill.name}</strong><p>${newDrill.desc}</p>`;
  box.checked = false;
  box.disabled = false;
  card.classList.remove("fading");
}

async function getOneDrill(skill, focus) {
  const resp = await fetch("/api/generate-drills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill, weaknesses: [focus] }),
  });
  const result = await resp.json();
  const drills = result.plan[0].drills;
  return drills[Math.floor(Math.random() * drills.length)];
}

loadPlan();