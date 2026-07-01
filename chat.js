const messagesEl = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let profile = { skill: "5", weaknesses: [] };
let conversation = [];

async function init() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }

  const { data: profiles } = await db
    .from("profiles")
    .select("skill, weaknesses")
    .eq("user_id", user.id);

  if (profiles && profiles.length > 0) {
    profile = {
      skill: profiles[0].skill,
      weaknesses: JSON.parse(profiles[0].weaknesses || "[]"),
    };
  }

  addMessage("coach", "Hey! I'm your OmniPickle coach. Ask me anything about your game.");
}

function addMessage(who, text) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

async function send() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";

  addMessage("user", text);
  conversation.push({ role: "user", content: text });

  const thinking = addMessage("coach", "…");

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation, profile: profile }),
    });
    const data = await resp.json();
    const reply = data.reply || "Sorry, I couldn't answer that.";
    thinking.textContent = reply;
    conversation.push({ role: "assistant", content: reply });
  } catch (err) {
    thinking.textContent = "Something went wrong. Try again.";
  }
}

sendBtn.addEventListener("click", send);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});

init();