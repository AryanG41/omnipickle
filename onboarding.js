// Onboarding screen
const app = document.getElementById("app");

const skillLevels = ["2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"];
const weaknessOptions = [
  "Third-shot drop",
  "Dinking",
  "Serve",
  "Return",
  "Volleys",
  "Footwork",
  "Strategy / positioning",
];

function renderOnboarding() {
  app.innerHTML = `
    <h2>Let's set up your coaching</h2>

    <p><strong>Your skill level:</strong></p>
    <select id="skill">
      ${skillLevels.map((l) => `<option value="${l}">${l}</option>`).join("")}
    </select>

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