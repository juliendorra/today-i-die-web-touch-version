const GAME_WIDTH = 390;
const GAME_HEIGHT = 570;
const SUPPORTED_LANGUAGES = new Set(["en", "sp", "pt", "de", "it", "cz", "fr"]);
const HTML_LANGUAGES = { en: "en", sp: "es", pt: "pt", de: "de", it: "it", cz: "cs", fr: "fr" };

function getPreferredLanguage() {
  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
  if (SUPPORTED_LANGUAGES.has(requestedLanguage)) return requestedLanguage;

  try {
    const storedLanguage = window.localStorage.getItem("today-language");
    if (SUPPORTED_LANGUAGES.has(storedLanguage)) return storedLanguage;
  } catch {
    // Storage is optional; private browsing modes can make it unavailable.
  }

  return "en";
}

const app = document.querySelector("#app");
const gameContainer = document.querySelector("#game");
const startButton = document.querySelector("#start");
const startLabel = startButton.querySelector("span");
const languageDialog = document.querySelector("#language-dialog");
const languageButtons = [...languageDialog.querySelectorAll("button[data-lang]")];
const fullscreenButton = document.querySelector("#fullscreen");
const installHint = document.querySelector("#install-hint");
const dismissHintButton = installHint.querySelector("button");
const errorMessage = document.querySelector("#error");

let player;
let hasStarted = false;
let language = getPreferredLanguage();

window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = {
  autoplay: "on",
  unmuteOverlay: "hidden",
  letterbox: "on",
  scale: "showAll",
  forceScale: true,
  backgroundColor: "#000000",
  splashScreen: false,
  contextMenu: "off",
  quality: "high",
  warnOnUnsupportedContent: false,
  logLevel: "error",
};

function loadRuffle() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/ruffle/ruffle.js";
    script.async = true;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", () => reject(new Error("The game engine could not be loaded.")), { once: true });
    document.head.append(script);
  });
}

async function createGame(languageCode) {
  await loadRuffle();

  const ruffle = window.RufflePlayer.newest();
  player = ruffle.createPlayer();
  player.id = "today";
  player.setAttribute("aria-label", "Today I Die");
  player.setAttribute("draggable", "false");
  player.style.width = "100%";
  player.style.height = "100%";
  player.style.webkitUserSelect = "none";
  player.style.userSelect = "none";
  player.style.webkitTouchCallout = "none";
  player.style.touchAction = "none";
  gameContainer.append(player);

  await player.ruffle().load({
    url: "/game/Today.swf",
    parameters: { lang: languageCode },
    base: "/game/",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    autoplay: "on",
    unmuteOverlay: "hidden",
    letterbox: "on",
    scale: "showAll",
    forceScale: true,
    backgroundColor: "#000000",
    splashScreen: false,
    contextMenu: "off",
    quality: "high",
    warnOnUnsupportedContent: false,
  });

  app.classList.add("ready");
  startButton.hidden = true;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

async function enterFullscreen() {
  if (!document.fullscreenElement && app.requestFullscreen) {
    try {
      await app.requestFullscreen({ navigationUI: "hide" });
    } catch {
      // Fullscreen can be unavailable in embedded browsers; the game still fills its viewport.
    }
  }

  if (screen.orientation?.lock) {
    try {
      await screen.orientation.lock("portrait");
    } catch {
      // Orientation locking is optional and requires installed/fullscreen mode on many devices.
    }
  }
}

async function startGame() {
  if (hasStarted) return;
  hasStarted = true;

  await enterFullscreen();
  syncFullscreenButton();

  if (isIos() && !isStandalone() && !sessionStorage.getItem("today-install-hint-dismissed")) {
    window.setTimeout(() => {
      installHint.hidden = false;
    }, 900);
  }
}

function showError(error) {
  languageDialog.hidden = true;
  startButton.hidden = true;
  errorMessage.textContent = `${error.message} Reload the page to try again.`;
  errorMessage.hidden = false;
}

function chooseLanguage(event) {
  const button = event.target.closest("button[data-lang]");
  if (!button || button.disabled) return;

  language = button.dataset.lang;
  document.documentElement.lang = HTML_LANGUAGES[language];
  languageButtons.forEach((languageButton) => {
    languageButton.disabled = true;
    languageButton.setAttribute("aria-pressed", String(languageButton === button));
  });

  try {
    window.localStorage.setItem("today-language", language);
  } catch {
    // The URL still preserves the choice when storage is unavailable.
  }

  const url = new URL(window.location.href);
  url.searchParams.set("lang", language);
  window.history.replaceState({}, "", url);

  startLabel.textContent = "loading";
  startButton.disabled = true;
  languageDialog.classList.add("leaving");
  window.setTimeout(() => {
    languageDialog.hidden = true;
  }, 220);

  void startGame();
  createGame(language).catch(showError);
}

function syncFullscreenButton() {
  fullscreenButton.hidden = !hasStarted || !app.requestFullscreen || Boolean(document.fullscreenElement);
}

function updateGameScale() {
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const scale = Math.min(viewportWidth / GAME_WIDTH, viewportHeight / GAME_HEIGHT);
  document.documentElement.style.setProperty("--game-scale", String(scale));
}

function clearBrowserSelection() {
  const selection = window.getSelection?.();
  if (selection?.rangeCount) selection.removeAllRanges();
}

function blockBrowserSelection(event) {
  event.preventDefault();
  clearBrowserSelection();
}

startButton.addEventListener("click", startGame);
languageDialog.addEventListener("click", chooseLanguage);
app.addEventListener(
  "pointerup",
  (event) => {
    if (event.target.closest?.("#install-hint, #fullscreen, #language-dialog")) return;
    startGame();
  },
  { capture: true },
);
fullscreenButton.addEventListener("click", enterFullscreen);
document.addEventListener("fullscreenchange", syncFullscreenButton);
window.addEventListener("resize", updateGameScale);
window.visualViewport?.addEventListener("resize", updateGameScale);

dismissHintButton.addEventListener("click", () => {
  installHint.hidden = true;
  sessionStorage.setItem("today-install-hint-dismissed", "1");
});

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("gesturestart", (event) => event.preventDefault());
document.addEventListener("selectstart", blockBrowserSelection, { capture: true });
document.addEventListener("dragstart", blockBrowserSelection, { capture: true });
document.addEventListener("selectionchange", clearBrowserSelection);
app.addEventListener("pointerdown", clearBrowserSelection, { capture: true });
app.addEventListener("pointerup", clearBrowserSelection, { capture: true });

document.documentElement.lang = HTML_LANGUAGES[language];
updateGameScale();
languageButtons.forEach((button) => {
  const isPreferred = button.dataset.lang === language;
  button.setAttribute("aria-pressed", String(isPreferred));
  button.classList.toggle("preferred", isPreferred);
});

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}
