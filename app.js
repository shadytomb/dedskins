/* ========================================================
   Supabase setup (PUBLIC / READ-ONLY)
   ======================================================== */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://scbnagapudotsmlulsoj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYm5hZ2FwdWRvdHNtbHVsc29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODY4OTksImV4cCI6MjA4NDA2Mjg5OX0.XrQIvi4q01HwNptz6s6pGjKr_1nE-jY6vfrpelatTTg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================================================
   DOM Elements
   ========================================================= */
const cursor = document.getElementById("cursor");
const banner = document.getElementById("banner");
const bannerText = document.getElementById("banner-text");
const footer = document.getElementById("footer");

/* =========================================================
   Custom Cursor (smooth, no offset, no lag)
   ========================================================= */
let mouseX = 0;
let mouseY = 0;
let curX = 0;
let curY = 0;

document.addEventListener("mousemove", (e) => {
  mouseX = e.pageX;
  mouseY = e.pageY;
});

function animateCursor() {
  curX += (mouseX - curX) * 0.15;
  curY += (mouseY - curY) * 0.15;

  cursor.style.left = curX + "px";
  cursor.style.top = curY + "px";

  requestAnimationFrame(animateCursor);
}

animateCursor();

/* =========================================================
   Load Global Site Settings
   ========================================================= */
async function loadSettings() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Supabase error:", error.message);
    return;
  }

  applySettings(data);
}

/* =========================================================
   Apply Settings to UI
   ========================================================= */
function applySettings(settings) {
  /* ---- Cursor ---- */
  if (settings.cursor_enabled) {
    document.body.classList.add("cursor-enabled");
    cursor.classList.remove("hidden");
  } else {
    document.body.classList.remove("cursor-enabled");
    cursor.classList.add("hidden");
  }

  /* ---- Announcement Banner ---- */
  if (settings.banner_enabled && settings.banner_text) {
    bannerText.textContent = settings.banner_text;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }

  /* ---- Footer Text ---- */
  if (settings.footer_text) {
    const footerSpan = footer.querySelector("span");
    if (footerSpan) {
      footerSpan.textContent = settings.footer_text;
    }
  }
}

/* =========================================================
   Init
   ========================================================= */
loadSettings();
