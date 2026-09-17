// Responsible only for security checks, permissions, and page redirection.

export function checkMasterAdminAuth() {
  const userRole = localStorage.getItem("userRole");
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn || userRole !== "master_admin") {
    alert("Access Denied: Master Admin credentials required.");
    window.location.href = "login.html";
  }
}

export function handleSignOut(btnId = "signOutBtn") {
  const signOutBtn = document.getElementById(btnId);
  if (signOutBtn) {
    signOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "login.html";
    });
  }
}