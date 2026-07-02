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

    <button id="shareBtn" class="rowCard" style="border:0; width:100%; cursor:pointer; font-family:inherit; text-align:left;">
      <div class="rowIcon"><i class="fa-solid fa-share-nodes"></i></div>
      <div class="rowText"><div class="rowTitle">Share my week</div><div class="rowSub">Post your progress</div></div>
      <div class="rowChevron">›</div>
    </button>

    <button id="logoutBtn" class="editBtn" style="margin-top:8px;">Log out</button>

    <div id="shareCard" style="position:absolute; left:-9999px; top:0; width:360px; background:#1f3a5a; color:#f3ecd9; padding:36px 30px; box-sizing:border-box;">
      <div style="font-size:20px; font-weight:700; margin-bottom:24px;">OmniPickle</div>
      <div style="font-size:15px; color:#aeb9cc;">My week</div>
      <div style="font-size:48px; font-weight:700; margin:4px 0;">${done} <span style="font-size:22px; color:#9fb0c8;">/ ${goal}</span></div>
      <div style="font-size:15px; color:#aeb9cc; margin-bottom:20px;">drills completed</div>
      <div style="font-size:22px; font-weight:600; color:#e3b566;">🔥 ${streak} day streak</div>
      <div style="margin-top:28px; font-size:13px; color:#8595ad;">Training with OmniPickle 🎾</div>
    </div>
  `;

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.href = "index.html";
  });

  document.getElementById("shareBtn").addEventListener("click", async () => {
    const card = document.getElementById("shareCard");
    const canvas = await html2canvas(card, { scale: 2 });
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "omnipickle-week.png", { type: "image/png" });
      if (navigator.share) {
        try {
          await navigator.share({ files: [file], title: "My OmniPickle week" });
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;";
        const img = document.createElement("img");
        img.src = url;
        img.style.cssText = "max-width:90%;max-height:70vh;border-radius:12px;";
        const note = document.createElement("p");
        note.textContent = "Long-press the image to save or share it";
        note.style.cssText = "color:#fff;margin:16px 0;font-family:inherit;text-align:center;";
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Done";
        closeBtn.style.cssText = "background:#f3ecd9;color:#1f3a5a;border:none;padding:12px 28px;border-radius:10px;font-family:inherit;font-weight:600;cursor:pointer;";
        closeBtn.onclick = () => overlay.remove();
        overlay.appendChild(img);
        overlay.appendChild(note);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = "omnipickle-week.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    });
  });
}

loadHome();