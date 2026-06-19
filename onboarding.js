// Onboarding screen
const app = document.getElementById("app");

const weaknessOptions = [
  "Third-shot drop",
  "Dinking",
  "Serve",
  "Return",
  "Volleys",
  "Footwork",
  "Strategy / Positioning",
];

function renderOnboarding() {
  app.innerHTML = `
    <h2>Let's set up your coaching</h2>

    <p><strong>Rate your skill (1 = beginner, 10 = advanced):</strong></p>
    <input type="range" id="skill" min="1" max="10" step="0.5" value="5">
    <span id="skillValue">5</span>

    <p><strong>What do you want to work on?</strong></p>
    <div id="weaknesses">
      ${weaknessOptions
        .map(
          (w) =>
            `<div><label><input type="checkbox" value="${w}"> ${w}</label></div>`
        )
        .join("")}
    </div>

    <br>
    <button id="saveBtn">Save & continue</button>
  `;
  const slider = document.getElementById("skill");
  const skillValue = document.getElementById("skillValue");
  slider.addEventListener("input", () => {
    skillValue.textContent = slider.value;
  });
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