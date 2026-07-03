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
  document.getElementById("forgotLink").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  if (!email) {
    authMsg.textContent = "Type your email above first, then tap Forgot password.";
    return;
  }
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: "https://omnipickle.vercel.app/update-password.html"
  });
  authMsg.textContent = error
    ? "Error: " + error.message
    : "Email sent! Check your inbox for the reset link.";
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
    window.location.href = "home.html";        // returning user → straight to plan
  } else {
    window.location.href = "onboarding.html";  // new user → onboarding
  }
});