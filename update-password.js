const msg = document.getElementById("msg");

document.getElementById("updateBtn").addEventListener("click", async () => {
  const newPassword = document.getElementById("newPassword").value;
  if (!newPassword || newPassword.length < 6) {
    msg.textContent = "Password must be at least 6 characters.";
    return;
  }
  const { error } = await db.auth.updateUser({ password: newPassword });
  if (error) {
    msg.textContent = "Error: " + error.message;
  } else {
    msg.textContent = "Password updated! Redirecting to login…";
    setTimeout(() => { window.location.href = "index.html"; }, 1500);
  }
});