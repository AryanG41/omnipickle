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
let planData = null;
let planCreated = null;

function cacheKey() { return `omnipickle_plan_${userId}_${mode}`; }
function savePlanCache() {
  localStorage.setItem(cacheKey(), JSON.stringify({ plan: planData, created: planCreated }));
}

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
  const fi = parseInt(card.dataset.fi);
  const di = parseInt(card.dataset.di);
  card.classList.add("fading");
  const newDrill = await getOneDrill(focus, adjust);
  if (planData && planData[fi]) { planData[fi].drills[di] = newDrill; savePlanCache(); }
  card.querySelector(".drillBody").innerHTML = drillBodyHTML(newDrill);
  attachFeedback(card);
  const box = card.querySelector(".drillCheck");
  box.checked = false;
  box.disabled = false;
  card.classList.remove("fading");
}

function addDoneItem(name) {
  const list = document.getElementById("doneList");
  if (!list) return;
  const empty = list.querySelector(".doneEmpty");
  if (empty) empty.remove();
  const div = document.createElement("div");
  div.className = "doneItem";
  div.innerHTML = `<i class="fa-solid fa-check"></i> ${name}`;
  list.prepend(div);
}

async function loadPlan(forceNew) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }
  userId = user.id;

  const { data: profiles } = await db
    .from("profiles").select("skill, weaknesses, weekly_goal").eq("user_id", userId);
  if (!profiles || profiles.length === 0) { window.location.href = "onboarding.html"; return; }

  skill = profiles[0].skill;
  const weaknesses = JSON.parse(profiles[0].weaknesses || "[]");
  goal = parseInt(profiles[0].weekly_goal) || 7;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: completions } = await db
    .from("completions").select("drill_name, created_at").eq("user_id", userId)
    .gte("created_at", weekAgo).order("created_at", { ascending: false });
  doneThisWeek = completions ? completions.length : 0;
  const doneHtml = (completions && completions.length)
    ? completions.map(c => `<div class="doneItem"><i class="fa-solid fa-check"></i> ${(c.drill_name || "Drill").replace(/[\s,.;:]+$/, "")}</div>`).join("")
    : `<div class="doneEmpty">Nothing yet — check off a drill to see it here.</div>`;

  if (weaknesses.length === 0) {
    planArea.innerHTML = `<h2>Your Practice Plan</h2><p>You didn't pick any focus areas. <a href="onboarding.html">Pick some</a>.</p>`;
    return;
  }

  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(cacheKey()) || "null"); } catch (e) {}
  const fresh = cached && cached.plan && (Date.now() - cached.created < 7 * 86400000);

  if (fresh && !forceNew) {
    planData = cached.plan;
    planCreated = cached.created;
  } else {
    planArea.innerHTML = `<h2>Your Practice Plan</h2><p class="intro">Building your plan for the week…</p>`;
    try {
      const resp = await fetch("/api/generate-drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, weaknesses, mode }),
      });
      const result = await resp.json();
      if (!result.plan) throw new Error("No plan");
      planData = result.plan;
      planCreated = Date.now();
      savePlanCache();
    } catch (err) {
      planArea.innerHTML = `<h2>Your Practice Plan</h2><p>Couldn't build your plan right now. Refresh to try again.</p>`;
      return;
    }
  }

  renderPlan(doneHtml);
}

function renderPlan(doneHtml) {
  const introText = doneThisWeek >= goal
    ? `You've hit your goal of ${goal} this week — nice work. These are bonus drills if you want extra.`
    : `Aim for ${goal} drills this week. Check off what you finish and a fresh one appears.`;

  let html = `
    <h2>Your Practice Plan</h2>
    <p>Your level: <span class="badge">${skill} — ${skillWord(skill)}</span></p>
    <p class="progress" id="progress"></p>
    <div class="modeToggle">
      <button class="modeBtn ${mode === "partner" ? "active" : ""}" data-mode="partner">With a partner</button>
      <button class="modeBtn ${mode === "solo" ? "active" : ""}" data-mode="solo">Solo</button>
    </div>
    <p class="intro">${introText}</p>
  `;
  planData.forEach((section, fi) => {
    html += `<h3>${section.focus}</h3>`;
    section.drills.forEach((d, di) => {
      html += `
        <div class="drill" data-focus="${section.focus}" data-fi="${fi}" data-di="${di}">
          <input type="checkbox" class="drillCheck">
          <div class="drillBody">${drillBodyHTML(d)}</div>
        </div>`;
    });
  });

  html += `<h3>Done this week</h3><div id="doneList">${doneHtml}</div>`;
  html += `<button id="newPlanBtn" class="editBtn" style="margin-top:8px;">New plan</button>`;
  html += `<a href="onboarding.html" class="editBtn" style="margin-left:10px;">Edit focus areas</a>`;
  html += `<a href="chat.html" class="editBtn" style="margin-left:10px;">Talk to coach</a>`;
  planArea.innerHTML = html;
  updateProgress();

  document.querySelectorAll(".drillCheck").forEach((box) => box.addEventListener("change", () => onCheck(box)));
  document.querySelectorAll(".drill").forEach((card) => attachFeedback(card));
  document.querySelectorAll(".modeBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode === mode) return;
      mode = btn.dataset.mode;
      localStorage.setItem("omnipickle_mode", mode);
      loadPlan();
    });
  });
  document.getElementById("newPlanBtn").addEventListener("click", () => {
    if (confirm("Generate a brand-new set of drills? This replaces your current plan.")) loadPlan(true);
  });
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
  const name = card.querySelector(".drillBody strong").textContent.replace(/[\s,.;:]+$/, "");
  box.disabled = true;

  await db.from("completions").insert({ user_id: userId, focus: card.dataset.focus, drill_name: name });
  doneThisWeek++;
  updateProgress();
  addDoneItem(name);

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