document.addEventListener("DOMContentLoaded", function(){
  const toggle = document.getElementById("scheme-toggle");
  const darkScheme = document.getElementById("dark-scheme");

  const DARK = '(prefers-color-scheme: dark)';
  const LIGHT = '(prefers-color-scheme: light)';

  function detectColorScheme() {
    // https://medium.com/free-code-camp/how-to-detect-a-users-preferred-color-scheme-in-javascript-ec8ee514f1ef
    // https://ru.hexlet.io/blog/posts/novye-mediazaprosy-kotorye-izmenyat-vashi-predstavleniya-o-vozmozhnostyah-css
    if(!window.matchMedia) {
        return
    }
    function listener({matches, media}) {
        if(!matches) { // Not matching anymore = not interesting
            return
        }
        if(media === DARK) {
            darkscheme(toggle, darkScheme);
        } else if (media === LIGHT) {
            lightscheme(toggle, darkScheme);
        }
    }
    const mqDark = window.matchMedia(DARK)
    mqDark.addListener(listener)
    const mqLight = window.matchMedia(LIGHT)
    mqLight.addListener(listener)
  }

  let scheme = "light";
  // Check user's settings
  let prefersDark = window.matchMedia(DARK).matches;
  if (prefersDark) {
    scheme = "dark";
  }
  // Check saved settings
  let savedScheme = localStorage.getItem("scheme");
  if(savedScheme) {
    scheme = savedScheme;
  }

  if(scheme === "dark") {
    darkscheme(toggle, darkScheme);
  } else {
    lightscheme(toggle, darkScheme);
  }

  toggle.addEventListener("click", () => {
    if (toggle.className === "light") {
      darkscheme(toggle, darkScheme);
    } else if (toggle.className === "dark") {
      lightscheme(toggle, darkScheme);
    }
  });

  // Add user's windows listener
  detectColorScheme();
});

function darkscheme(toggle, darkScheme) {
  localStorage.setItem("scheme", "dark");
  toggle.innerHTML = feather.icons.sun.toSvg();
  toggle.className = "dark";
  darkScheme.disabled = false;
}

function lightscheme(toggle, darkScheme) {
  localStorage.setItem("scheme", "light");
  toggle.innerHTML = feather.icons.moon.toSvg();
  toggle.className = "light";
  darkScheme.disabled = true;
}
