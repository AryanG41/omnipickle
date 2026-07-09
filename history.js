const historyEl = document.getElementById("history");

async function loadHistory() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }

  const { data: completions } = await db
    .from("completions").select("created_at").eq("user_id", user.id);
  const rows = completions || [];
  const total = rows.length;

  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const end = Date.now() - i * 7 * 86400000;
    const start = end - 7 * 86400000;
    const count = rows.filter(r => {
      const t = new Date(r.created_at).getTime();
      return t >= start && t < end;
    }).length;
    weeks.push({ label: i === 0 ? "Now" : i + "w", count });
  }
  const maxCount = Math.max(1, ...weeks.map(w => w.count));

  const barsHtml = weeks.map(w => `
    <div class="barCol">
      <div class="barVal">${w.count}</div>
      <div class="barTrack"><div class="bar" style="height:${Math.round((w.count / maxCount) * 100)}%"></div></div>
      <div class="barLabel">${w.label}</div>
    </div>`).join("");

  historyEl.innerHTML = `
    <h2>Your progress</h2>
    <div class="statCard">
      <div class="statLabel">Total drills completed</div>
      <div class="statNum">${total}</div>
    </div>
    <p class="intro">Drills per week</p>
    <div class="chart">${barsHtml}</div>
    <p class="chartNote">${total === 0
      ? "Complete some drills and your progress will build up here."
      : "Keep it going — consistency is how you improve."}</p>
  `;
}

loadHistory();