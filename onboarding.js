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

    <p><strong>Rate your skill (1 = beginner, 10 = advanced):</strong></p>
    <p style="font-size:0.9em; opacity:0.75;">Not sure? Just estimate — the coach adjusts as you go.</p>
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

  document.getElementById("saveBtn").addEventListener("click", saveProfile);
}

async function saveProfile() {
  const skill = document.getElementById("skill").value;
  const checked = [...document.querySelectorAll("#weaknesses input:checked")].map(
    (c) => c.value
  );

  // Who is logged in?
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert("Please log in first.");
    window.location.href = "index.html";
    return;
  }

  // Save their profile to the database (one row per user)
  const { error } = await db.from("profiles").upsert(
    {
      user_id: user.id,
      skill: skill,
      weaknesses: JSON.stringify(checked),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    alert("Couldn't save: " + error.message);
    return;
  }

  window.location.href = "plan.html";
}

renderOnboarding();