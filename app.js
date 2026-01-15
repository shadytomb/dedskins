// =======================
// SUPABASE INIT
// =======================
const SUPABASE_URL = "https://scbnagapudotsmlulsoj.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";

const supabase = supabasejs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// =======================
// DOM
// =======================
const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll("[data-page]");
const authBtn = document.getElementById("authBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const toggleAuth = document.getElementById("toggleAuth");
const submitAuth = document.getElementById("submitAuth");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nicknameInput = document.getElementById("nickname");
const inviteInput = document.getElementById("invite");

const adminPanel = document.getElementById("adminPanel");
const announcement = document.getElementById("announcement");

let isSignup = false;
let currentUser = null;
let currentProfile = null;

// =======================
// NAVIGATION
// =======================
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(page).classList.add("active");
  });
});

// =======================
// AUTH MODAL
// =======================
authBtn.onclick = () => authModal.classList.remove("hidden");
closeAuth.onclick = () => authModal.classList.add("hidden");

toggleAuth.onclick = () => {
  isSignup = !isSignup;
  nicknameInput.style.display = isSignup ? "block" : "none";
  inviteInput.style.display = isSignup ? "block" : "none";
  toggleAuth.textContent = isSignup
    ? "Already have an account?"
    : "Need an account?";
};

// =======================
// AUTH SUBMIT
// =======================
submitAuth.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const nickname = nicknameInput.value.trim();
  const invite = inviteInput.value.trim();

  if (!email || !password) {
    alert("Email and password required. Obviously.");
    return;
  }

  if (isSignup) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const role = invite === "YELL0W" ? "admin" : "user";

    await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      nickname,
      role,
    });

  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Wrong credentials. Skill issue.");
      return;
    }
  }

  authModal.classList.add("hidden");
};

// =======================
// SESSION LOAD
// =======================
async function loadSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return;

  currentUser = session.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  currentProfile = profile;

  authBtn.textContent = "Logout";
  adminPanel.classList.toggle(
    "hidden",
    currentProfile.role !== "admin"
  );
}

// =======================
// LOGOUT
// =======================
authBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  await supabase.auth.signOut();
  location.reload();
});

// =======================
// AUTH STATE CHANGE
// =======================
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  if (!currentUser) {
    adminPanel.classList.add("hidden");
    authBtn.textContent = "Login";
  } else {
    loadSession();
  }
});

// =======================
// REALTIME: ANNOUNCEMENT
// =======================
supabase
  .channel("site_settings")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "site_settings" },
    payload => {
      const text = payload.new?.announcement;
      if (text) {
        announcement.textContent = text;
        announcement.classList.remove("hidden");
      }
    }
  )
  .subscribe();

// =======================
// INIT
// =======================
loadSession();



