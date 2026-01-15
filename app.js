import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =====================================================
   Supabase config
   ===================================================== */
const SUPABASE_URL = "https://scbnagapudotsmlulsoj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYm5hZ2FwdWRvdHNtbHVsc29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODY4OTksImV4cCI6MjA4NDA2Mjg5OX0.XrQIvi4q01HwNptz6s6pGjKr_1nE-jY6vfrpelatTTg";

const ADMIN_EMAIL = "karson@tuta.io";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =====================================================
   DOM
   ===================================================== */
const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll("[data-page]");

const cursor = document.getElementById("cursor");
const banner = document.getElementById("banner");
const bannerText = document.getElementById("banner-text");

const loginBtn = document.getElementById("login-btn");
const adminPanel = document.getElementById("admin-panel");

const bannerInput = document.getElementById("admin-banner-input");
const saveBannerBtn = document.getElementById("save-banner");
const toggleCursorBtn = document.getElementById("toggle-cursor");

/* =====================================================
   SPA Navigation
   ===================================================== */
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(page).classList.add("active");

    if (page !== "admin-panel") {
      adminPanel.classList.add("hidden");
    }
  });
});

/* =====================================================
   Cursor (smooth, sane)
   ===================================================== */
let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  curX += (mouseX - curX) * 0.15;
  curY += (mouseY - curY) * 0.15;
  cursor.style.left = `${curX}px`;
  cursor.style.top = `${curY}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

/* =====================================================
   Apply settings to UI
   ===================================================== */
function applySettings(data) {
  // Banner
  if (data.banner_enabled && data.banner_text) {
    bannerText.textContent = data.banner_text;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }

  // Cursor
  if (data.cursor_enabled) {
    document.body.classList.add("cursor-enabled");
    cursor.classList.remove("hidden");
  } else {
    document.body.classList.remove("cursor-enabled");
    cursor.classList.add("hidden");
  }

  // Admin input sync
  if (bannerInput) {
    bannerInput.value = data.banner_text || "";
  }
}

/* =====================================================
   Initial load
   ===================================================== */
async function loadSettings() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!error && data) {
    applySettings(data);
  }
}

/* =====================================================
   Realtime subscription (THE IMPORTANT PART)
   ===================================================== */
supabase
  .channel("site-settings-realtime")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "site_settings",
      filter: "id=eq.1"
    },
    payload => {
      applySettings(payload.new);
    }
  )
  .subscribe();

/* =====================================================
   Auth
   ===================================================== */
loginBtn.addEventListener("click", async () => {
  const email = prompt(
    "Admin login only.\nAccess restricted to authorized email addresses."
  );

  if (!email) return;

  await supabase.auth.signInWithOtp({ email });
  alert("Magic link sent. Check your email.");
});

async function checkAdmin() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return;

  if (user.email === ADMIN_EMAIL) {
    adminPanel.classList.remove("hidden");
    pages.forEach(p => p.classList.remove("active"));
    adminPanel.classList.add("active");
  } else {
    alert("Unauthorized email. Access denied.");
    await supabase.auth.signOut();
  }
}

/* =====================================================
   Admin actions
   ===================================================== */
saveBannerBtn.addEventListener("click", async () => {
  await supabase
    .from("site_settings")
    .update({
      banner_text: bannerInput.value,
      banner_enabled: bannerInput.value.trim().length > 0
    })
    .eq("id", 1);
});

toggleCursorBtn.addEventListener("click", async () => {
  const { data } = await supabase
    .from("site_settings")
    .select("cursor_enabled")
    .eq("id", 1)
    .single();

  await supabase
    .from("site_settings")
    .update({ cursor_enabled: !data.cursor_enabled })
    .eq("id", 1);
});

/* =====================================================
   Init
   ===================================================== */
loadSettings();
checkAdmin();

supabase.auth.onAuthStateChange(() => {
  checkAdmin();
});

