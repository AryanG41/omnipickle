const home = document.getElementById("home");

async function loadHome() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }

  const { data: profiles } = await db
    .from("profiles").select("weekly_goal").eq("user_id", user.id);
  if (!profiles || profiles.length === 0) { window.location.href = "onboarding.html"; return; }

  const goal = parseInt(profiles[0].weekly_goal) || 7;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: completions } = await db
    .from("completions").select("id").eq("user_id", user.id).gte("created_at", weekAgo);
  const done = completions ? completions.length : 0;
  const pct = Math.min(100, Math.round((done / goal) * 100));

  home.innerHTML = `
    <div class="appHeader">
      <img src="logo.jpeg" class="appLogo" alt="OmniPickle">
    </div>

    <div class="greeting">Welcome back — ready to sharpen your game?</div>

    <div class="statCard">
      <div class="statLabel">This week</div>
      <div class="statNum">${done} <span>/ ${goal} drills</span></div>
      <div class="statBar"><div class="statFill" style="width:${pct}%"></div></div>
    </div>

    <a href="plan.html" class="rowCard">
      <div class="rowIcon"><i class="fa-solid fa-list-check"></i></div>
      <div class="rowText"><div class="rowTitle">My weekly plan</div><div class="rowSub">Your drills for the week</div></div>
      <div class="rowChevron">›</div>
    </a>

    <a href="chat.html" class="rowCard">
      <div class="rowIcon"><i class="fa-solid fa-comments"></i></div>
      <div class="rowText"><div class="rowTitle">Talk to coach</div><div class="rowSub">Ask anything about your game</div></div>
      <div class="rowChevron">›</div>
    </a>

    <a href="onboarding.html" class="rowCard">
      <div class="rowIcon"><i class="fa-solid fa-sliders"></i></div>
      <div class="rowText"><div class="rowTitle">Edit my profile</div><div class="rowSub">Level, goals, and focus areas</div></div>
      <div class="rowChevron">›</div>
    </a>

    <button id="logoutBtn" class="editBtn" style="margin-top:8px;">Log out</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.href = "index.html";
  });
}

loadHome();