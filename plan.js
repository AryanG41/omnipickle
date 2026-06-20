const drillLibrary = {
  "Third-shot drop": [
    { name: "Drop & Reset", desc: "From the baseline, hit 20 soft drops aiming to land in the kitchen. Focus on a gentle arc." },
    { name: "Third-Shot Targets", desc: "Put a towel in the kitchen and try to land your third shot on it 10 times." },
  ],
  "Dinking": [
    { name: "Cross-Court Dinks", desc: "Rally cross-court dinks with a partner for 5 minutes without popping the ball up." },
    { name: "Dink Targets", desc: "Aim dinks at the corners of the kitchen, 15 reps each side." },
  ],
  "Serve": [
    { name: "Deep Serve", desc: "Serve 20 balls aiming for the back third of the service box." },
    { name: "Consistent Toss", desc: "Hit 20 serves focusing on the exact same contact point each time." },
  ],
  "Return": [
    { name: "Deep Returns", desc: "Return 20 serves aiming deep, then sprint to the kitchen line." },
    { name: "Return & Rush", desc: "After each return, rush the net. Repeat 15 times." },
  ],
  "Volleys": [
    { name: "Wall Volleys", desc: "Volley against a wall for 2 minutes, keeping the paddle out front." },
    { name: "Punch Volleys", desc: "With a partner, hit 20 controlled punch volleys at the net." },
  ],
  "Footwork": [
    { name: "Split-Step Drill", desc: "Split-step as your partner hits, 15 reps. Stay on the balls of your feet." },
    { name: "Lateral Shuffles", desc: "3 sets of side-to-side shuffles to sharpen court movement." },
  ],
  "Strategy / positioning": [
    { name: "Move As A Team", desc: "Play points focusing on getting to the net together with your partner." },
    { name: "Drop vs Drive", desc: "Play out points, choosing drop or drive based on how deep the return was." },
  ],
};

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
    .select("skill, weaknesses")
    .eq("user_id", user.id);

  if (!profiles || profiles.length === 0) {
    window.location.href = "onboarding.html";
    return;
  }

  const skill = profiles[0].skill;
  const weaknesses = JSON.parse(profiles[0].weaknesses || "[]");

  let html = `
    <h2>Your Practice Plan</h2>
    <p>Your level: <span class="badge">${skill} — ${skillWord(skill)}</span></p>
    <p class="intro">Work through these this week. Quality reps over speed.</p>
  `;

  if (weaknesses.length === 0) {
    html += `<p>You didn't pick any focus areas. <a href="onboarding.html">Pick some</a> to get drills.</p>`;
  } else {
    weaknesses.forEach((w) => {
      html += `<h3>${w}</h3>`;
      (drillLibrary[w] || []).forEach((d, i) => {
        html += `<div class="drill"><span class="num">${i + 1}</span><div><strong>${d.name}</strong><p>${d.desc}</p></div></div>`;
      });
    });
  }

  planArea.innerHTML = html;
}

loadPlan();