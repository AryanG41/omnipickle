const home = document.getElementById("home");

function dayKey(d) {
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function calcStreak(rows) {
  const days = new Set(rows.map(r => dayKey(new Date(r.created_at))));
  let streak = 0;
  let d = new Date();
  if (!days.has(dayKey(d))) {
    d.setDate(d.getDate() - 1);
    if (!days.has(dayKey(d))) return 0;
  }
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

async function loadHome() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }

  const { data: profiles } = await db
    .from("profiles").select("weekly_goal").eq("user_id", user.id);
  if (!profiles || profiles.length === 0) { window.location.href = "onboarding.html"; return; }

  const goal = parseInt(profiles[0].weekly_goal) || 7;

  const since = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const { data: completions } = await db
    .from("completions").select("created_at").eq("user_id", user.id).gte("created_at", since);
  const rows = completions || [];

  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const done = rows.filter(r => new Date(r.created_at).getTime() >= weekAgoMs).length;
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const streak = calcStreak(rows);

  const streakHtml = streak > 0
    ? `<div class="streak"><i class="fa-solid fa-fire"></i> ${streak} day${streak === 1 ? "" : "s"} streak</div>`
    : `<div class="streak"><i class="fa-solid fa-fire"></i> Start your streak today</div>`;

  home.innerHTML = `
    <div class="appHeader">
      <img src="logo.jpeg" class="appLogo" alt="OmniPickle">
    </div>

    <div class="greeting">Welcome back — ready to sharpen your game?</div>

    ${streakHtml}

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