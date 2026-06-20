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
  const { error } = await db.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });
  if (error) {
    authMsg.textContent = "Error: " + error.message;
  } else {
    authMsg.textContent = "Logged in!";
    window.location.href = "index.html";
  }
});