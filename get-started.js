// Your Firebase config (create a project at https://console.firebase.google.com/)
document.getElementById("emailSignIn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    document.getElementById("status").innerText = "Please enter both email and password";
    return;
  }

  // For now, just display the email (no Firebase yet)
  document.getElementById("status").innerText = `Signed in as ${email}`;
});
