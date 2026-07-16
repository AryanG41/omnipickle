const app = document.getElementById("app");

const weaknessOptions = [
  { name: "Third-shot drop", desc: "The soft shot after the serve+return that drops into the no-volley zone" },
  { name: "Dinking", desc: "Soft, controlled shots just over the net" },
  { name: "Serve", desc: "How you start the point" },
  { name: "Return", desc: "Hitting back your opponent's serve" },
  { name: "Volleys", desc: "Hitting the ball before it bounces" },
  { name: "Footwork", desc: "Moving and positioning around the court" },
  { name: "Strategy / positioning", desc: "Knowing where to stand and which shot to pick" },
];

function getSkillLabel(value) {
  const n = parseFloat(value);
  if (n <= 2.5) return "Beginner";
  if (n <= 4.5) return "Improver";
  if (n <= 6.5) return "Intermediate";
  if (n <= 8.5) return "Advanced";
  return "Expert";
}

function renderOnboarding() {
  app.innerHTML = `
    <h2>Let's set up your coaching</h2>

    <p><strong>Rate your skill from 1 to 10 (1 = beginner, 10 = advanced):</strong></p>
    <p style="font-size:0.9em; opacity:0.75;">This is our own scale, not an official DUPR rating. Not sure? Just estimate — the coach adjusts as you go.</p>
    <input type="range" id="skill" min="1" max="10" value="5" step="0.5">
    <span id="skillValue">5</span>

    <p><strong>What do you want to work on?</strong></p>
    <p style="font-size:0.9em; opacity:0.75;">New to pickleball? Just pick whatever sounds relevant — your coach helps with the rest.</p>
    <div id="weaknesses">
      ${weaknessOptions
        .map(
          (w) =>
            `<div><label><input type="checkbox" value="${w.name}"> <strong>${w.name}</strong><br><span class="desc">${w.desc}</span></label></div>`
        )
        .join("")}
    </div>

    <p><strong>How many drills do you want to complete per week?</strong></p>
    <input type="range" id="goal" min="3" max="20" value="7">
    <span id="goalValue">7</span>

    <br>
    <button id="saveBtn">Save & continue</button>
  `;

  const slider = document.getElementById("skill");
  const skillValue = document.getElementById("skillValue");
  function updateSkillLabel() {
    skillValue.textContent = slider.value + " — " + getSkillLabel(slider.value);
  }
  slider.addEventListener("input", updateSkillLabel);
  updateSkillLabel();

  const goal = document.getElementById("goal");
  const goalValue = document.getElementById("goalValue");
  goal.addEventListener("input", () => {
    goalValue.textContent = goal.value;
  });

  document.getElementById("saveBtn").addEventListener("click", saveProfile);
}

async function saveProfile() {
  const skill = document.getElementById("skill").value;
  const checked = [...document.querySelectorAll("#weaknesses input:checked")].map(
    (c) => c.value
  );
  const goalVal = document.getElementById("goal").value;

  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert("Please log in first.");
    window.location.href = "index.html";
    return;
  }

  const { error } = await db.from("profiles").upsert(
    {
      user_id: user.id,
      skill: skill,
      weaknesses: JSON.stringify(checked),
      weekly_goal: goalVal,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    alert("Couldn't save: " + error.message);
    return;
  }

  window.location.href = "home.html";
}

async function init() {
  renderOnboarding();

  const { data: { user } } = await db.auth.getUser();
  if (!user) return;

  const { data: profiles } = await db
    .from("profiles")
    .select("skill, weaknesses, weekly_goal")
    .eq("user_id", user.id);
  if (!profiles || profiles.length === 0) return; // new user → keep defaults

  const p = profiles[0];

  // pre-set the skill slider
  const slider = document.getElementById("skill");
  slider.value = p.skill;
  slider.dispatchEvent(new Event("input"));

  // pre-set the weekly goal slider
  const goal = document.getElementById("goal");
  goal.value = p.weekly_goal || 7;
  goal.dispatchEvent(new Event("input"));

  // re-check the weaknesses they already picked
  const chosen = JSON.parse(p.weaknesses || "[]");
  document.querySelectorAll("#weaknesses input").forEach((box) => {
    if (chosen.includes(box.value)) box.checked = true;
  });
}

init();