/* =========================
   SUPABASE SETUP
========================= */

const SUPABASE_URL = "https://scbnagapudotsmlulsoj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYm5hZ2FwdWRvdHNtbHVsc29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODY4OTksImV4cCI6MjA4NDA2Mjg5OX0.XrQIvi4q01HwNptz6s6pGjKr_1nE-jY6vfrpelatTTg";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* =========================
   PAGE NAVIGATION
========================= */

window.showPage = function (pageId) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
  });

  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
};

/* =========================
   AUTH HANDLING
========================= */

const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const nickname = document.getElementById("nickname").value.trim();
    const invite = document.getElementById("invite").value.trim();

    // Try login first
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If user does not exist → sign up
    if (error) {
      const signup = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname || null,
            role: invite === "YELL0W" ? "admin" : "user",
          },
        },
      });

      if (signup.error) {
        authMessage.textContent = signup.error.message;
        return;
      }

      authMessage.textContent = "Account created. Logged in.";
      showPage("home");
      return;
    }

    // Login success
    authMessage.textContent = "Logged in.";
    showPage("home");
  });
}

/* =========================
   LOGOUT
========================= */

window.logout = async function () {
  await supabase.auth.signOut();
  showPage("home");
};

/* =========================
   SESSION RESTORE
========================= */

async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    // Optional: role detection
    const role = session.user.user_metadata?.role;
    if (role === "admin") {
      console.log("Admin logged in");
    }
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}

checkSession();

/* =========================
   AUTH STATE LISTENER
========================= */

supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
});
