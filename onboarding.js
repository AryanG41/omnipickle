// Onboarding screen
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
    <input type="range" id="skill" min="1" max="10" step="0.5" value="5">
    <span id="skillValue">5</span>

    <p><strong>What do you want to work on?</strong></p>
        <p style="font-size:0.9em; opacity:0.75;">New to pickleball? Just pick whatever sounds relevant — your coach will help you figure out the rest.</p>
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

function saveProfile() {
  const skill = document.getElementById("skill").value;
  const checked = [...document.querySelectorAll("#weaknesses input:checked")].map(
    (c) => c.value
  );
  localStorage.setItem(
    "omnipickleProfile",
    JSON.stringify({ skill, weaknesses: checked })
  );

  app.innerHTML = `
    <h2>You're all set!</h2>
    <p>Skill level: ${skill}</p>
    <p>Working on: ${checked.join(", ") || "nothing selected yet"}</p>
    <p>Next we'll build your practice plan.</p>
  `;
}

renderOnboarding();