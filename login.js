const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authMsg = document.getElementById("authMsg");

document.getElementById("signupBtn").addEventListener("click", async () => {
  const { error } = await db.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value,
  });
  authMsg.textContent = error ? "Error: " + error.message : "Account created! Now click Log In.";
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const { data, error } = await db.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (error) {
    authMsg.textContent = "Error: " + error.message;
    return;
  }

  authMsg.textContent = "Logged in!";

  // Does this user already have a profile?
  const { data: profiles } = await db
    .from("profiles")
    .select("user_id")
    .eq("user_id", data.user.id);

  if (profiles && profiles.length > 0) {
    window.location.href = "plan.html";        // returning user → straight to plan
  } else {
    window.location.href = "onboarding.html";  // new user → onboarding
  }
});