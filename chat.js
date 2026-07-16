const messagesEl = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let profile = { skill: "5", weaknesses: [] };
let context = { goal: null, doneThisWeek: 0, recentDrills: [] };
let conversation = [];
let storageKey = "omnipickle_chat";

async function init() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }
  storageKey = "omnipickle_chat_" + user.id;

  const { data: profiles } = await db
    .from("profiles").select("skill, weaknesses, weekly_goal").eq("user_id", user.id);
  if (profiles && profiles.length > 0) {
    profile = {
      skill: profiles[0].skill,
      weaknesses: JSON.parse(profiles[0].weaknesses || "[]"),
    };
    context.goal = profiles[0].weekly_goal;
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: completions } = await db
    .from("completions").select("drill_name, created_at").eq("user_id", user.id)
    .gte("created_at", weekAgo).order("created_at", { ascending: false });
  if (completions) {
    context.doneThisWeek = completions.length;
    context.recentDrills = completions.slice(0, 10).map(c => c.drill_name).filter(Boolean);
  }

  const saved = localStorage.getItem(storageKey);
  if (saved) {
    conversation = JSON.parse(saved);
    conversation.forEach(m => addMessage(m.role === "user" ? "user" : "coach", m.content));
  } else {
    addMessage("coach", "Hey! I'm your OmniPickle coach. Ask me anything about your game.");
  }
}

function formatReply(text) {
  let t = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\n/g, "<br>");
  return t;
}

function addMessage(who, text) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerHTML = formatReply(text);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function saveConversation() {
  localStorage.setItem(storageKey, JSON.stringify(conversation));
}

async function send() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";

  addMessage("user", text);
  conversation.push({ role: "user", content: text });
  saveConversation();

  const thinking = addMessage("coach", "…");

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation.slice(-20), profile: profile, context: context }),
    });
    const data = await resp.json();
    const reply = data.reply || "Sorry, I couldn't answer that.";
    thinking.innerHTML = formatReply(reply);
    conversation.push({ role: "assistant", content: reply });
    saveConversation();
  } catch (err) {
    thinking.textContent = "Something went wrong. Try again.";
  }
}

sendBtn.addEventListener("click", send);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});

init();