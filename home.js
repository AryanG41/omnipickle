const home = document.getElementById("home");

async function loadHome() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }

  const { data: profiles } = await db
    .from("profiles")
    .select("skill, weekly_goal")
    .eq("user_id", user.id);
  if (!profiles || profiles.length === 0) { window.location.href = "onboarding.html"; return; }

  const goal = parseInt(profiles[0].weekly_goal) || 7;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: completions } = await db
    .from("completions").select("id").eq("user_id", user.id).gte("created_at", weekAgo);
  const done = completions ? completions.length : 0;

  home.innerHTML = `
    <h2>Welcome back! 🎾</h2>
    <p class="progress">This week: <strong>${done} / ${goal}</strong> drills done</p>

    <a href="plan.html" class="homeCard">
      <span class="homeCardTitle">My Weekly Plan</span>
      <span class="homeCardSub">See your drills for the week</span>
    </a>

    <a href="chat.html" class="homeCard">
      <span class="homeCardTitle">Talk to Coach</span>
      <span class="homeCardSub">Ask anything about your game</span>
    </a>

    <a href="onboarding.html" class="homeCard">
      <span class="homeCardTitle">Edit My Profile</span>
      <span class="homeCardSub">Change your level, goals, or weekly target</span>
    </a>

    <button id="logoutBtn" class="editBtn">Log out</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.href = "index.html";
  });
}

loadHome();