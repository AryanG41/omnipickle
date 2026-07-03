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
let mode = localStorage.getItem("omnipickle_mode") || "partner";

function drillBodyHTML(d) {
  return `<strong>${d.name}</strong><p>${d.desc}</p>
    <div class="drillFeedback">
      <button class="fbBtn" data-adjust="skip">Skip</button>
      <button class="fbBtn" data-adjust="easier">Too hard</button>
      <button class="fbBtn" data-adjust="harder">Too easy</button>
    </div>`;
}

function attachFeedback(card) {
  card.querySelectorAll(".fbBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const adjust = btn.dataset.adjust;
      replaceDrill(card, adjust === "skip" ? null : adjust);
    });
  });
}

async function replaceDrill(card, adjust) {
  const focus = card.dataset.focus;
  card.classList.add("fading");
  const newDrill = await getOneDrill(focus, adjust);
  card.querySelector(".drillBody").innerHTML = drillBodyHTML(newDrill);
  attachFeedback(card);
  const box = card.querySelector(".drillCheck");
  box.checked = false;
  box.disabled = false;
  card.classList.remove("fading");
}

async function loadPlan() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }
  userId = user.id;

  const { data: profiles } = await db
    .from("profiles").select("skill, weaknesses, weekly_goal").eq("user_id", userId);
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
      body: JSON.stringify({ skill, weaknesses, mode }),
    });
    const result = await resp.json();
    if (!result.plan) throw new Error("No plan");

    let html = `
      <h2>Your Practice Plan</h2>
      <p>Your level: <span class="badge">${skill} — ${skillWord(skill)}</span></p>
      <p class="progress" id="progress"></p>
      <div class="modeToggle">
        <button class="modeBtn ${mode === "partner" ? "active" : ""}" data-mode="partner">With a partner</button>
        <button class="modeBtn ${mode === "solo" ? "active" : ""}" data-mode="solo">Solo</button>
      </div>
      <p class="intro">Check off drills as you finish — fresh ones appear automatically.</p>
    `;
    result.plan.forEach((section) => {
      html += `<h3>${section.focus}</h3>`;
      section.drills.forEach((d) => {
        html += `
          <div class="drill" data-focus="${section.focus}">
            <input type="checkbox" class="drillCheck">
            <div class="drillBody">${drillBodyHTML(d)}</div>
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
    document.querySelectorAll(".drill").forEach((card) => attachFeedback(card));
    document.querySelectorAll(".modeBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        localStorage.setItem("omnipickle_mode", mode);
        loadPlan();
      });
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
  box.disabled = true;

  await db.from("completions").insert({ user_id: userId, focus: card.dataset.focus });
  doneThisWeek++;
  updateProgress();

  await replaceDrill(card, null);
}

async function getOneDrill(focus, adjust) {
  const resp = await fetch("/api/generate-drills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill, weaknesses: [focus], mode, adjust }),
  });
  const result = await resp.json();
  const drills = result.plan[0].drills;
  return drills[Math.floor(Math.random() * drills.length)];
}

loadPlan();