import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ===============================
   Supabase Init
   =============================== */

const SUPABASE_URL = "https://scbnagapudotsmlulsoj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYm5hZ2FwdWRvdHNtbHVsc29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODY4OTksImV4cCI6MjA4NDA2Mjg5OX0.XrQIvi4q01HwNptz6s6pGjKr_1nE-jY6vfrpelatTTg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===============================
   DOM
   =============================== */

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");
const banner = document.getElementById("banner");
const bannerText = document.getElementById("banner-text");
const cursor = document.getElementById("cursor");

const loginBtn = document.getElementById("login-btn");
const loginForm = document.getElementById("login-form");
const confirmLogin = document.getElementById("confirm-login");

const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");

const adminPanel = document.getElementById("admin-panel");
const bannerInput = document.getElementById("banner-input");
const saveBannerBtn = document.getElementById("save-banner");

const projectsContainer = document.getElementById("projects-container");
const projectTitle = document.getElementById("project-title");
const projectLink = document.getElementById("project-link");
const addProjectBtn = document.getElementById("add-project");

/* ===============================
   Custom Cursor
   =============================== */

document.addEventListener("mousemove", (e) => {
  cursor.style.left = `${e.clientX}px`;
  cursor.style.top = `${e.clientY}px`;
});

/* ===============================
   Page Navigation
   =============================== */

function showPage(id) {
  pages.forEach((p) => p.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    showPage(btn.dataset.page);
  });
});

/* ===============================
   Auth
   =============================== */

loginBtn.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  showPage("login-form");
});

confirmLogin.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Email and password required.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Invalid credentials.");
    return;
  }

  loginForm.classList.add("hidden");
  checkAdmin();
});

/* ===============================
   Admin Check
   =============================== */

async function checkAdmin() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || user.email !== "karson@tuta.io") {
    adminPanel.classList.add("hidden");
    return;
  }

  adminPanel.classList.remove("hidden");
  showPage("admin-panel");
}

/* ===============================
   Banner Logic (Realtime)
   =============================== */

async function loadBanner() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "banner")
    .single();

  if (data?.value) {
    bannerText.textContent = data.value;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
}

saveBannerBtn.addEventListener("click", async () => {
  const value = bannerInput.value.trim();

  await supabase.from("site_settings").upsert({
    key: "banner",
    value
  });

  bannerInput.value = "";
});

/* realtime */
supabase
  .channel("banner")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "site_settings" },
    loadBanner
  )
  .subscribe();

/* ===============================
   Projects (Realtime)
   =============================== */

async function loadProjects() {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  projectsContainer.innerHTML = "";

  data?.forEach((p) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.link}</p>
    `;

    card.addEventListener("click", () => {
      window.open(p.link, "_blank");
    });

    projectsContainer.appendChild(card);
  });
}

addProjectBtn.addEventListener("click", async () => {
  const title = projectTitle.value.trim();
  const link = projectLink.value.trim();

  if (!title || !link) return;

  await supabase.from("projects").insert({
    title,
    link
  });

  projectTitle.value = "";
  projectLink.value = "";
});

/* realtime */
supabase
  .channel("projects")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "projects" },
    loadProjects
  )
  .subscribe();

/* ===============================
   Init
   =============================== */

loadBanner();
loadProjects();
checkAdmin();


