// ---------- THE LEOPARD ----------
// After someone leaves 10 emojis, or has been on the site for 10 minutes (whichever comes first),
// a spotted yellow guy rises up from behind the name card: "Thanks for hanging out with me."
// Once per visit.

(function () {

var AFTER_MINUTES = 10;    // minutes on the site before he shows up (change here)
var STAYS = 20;            // seconds he stays (change here)

var leo = document.getElementById("leopard");
var shown = false;

// where he stands: right on top of the name card, in the middle
var card = document.querySelector(".info");
function place() {
  if (window.matchMedia("(max-width: 700px)").matches) {   // phones: CSS puts him in the middle of the screen
    leo.style.left = ""; leo.style.top = "";
    return;
  }
  var r = card.getBoundingClientRect();
  var top = r.top + window.scrollY;
  var text = card.querySelector(".name-swap");           // the first line of the card
  if (text) top = text.getBoundingClientRect().top + window.scrollY;
  leo.style.left = (r.left + r.width / 2 + window.scrollX) + "px";
  leo.style.top = (top - leo.offsetHeight) + "px";
}

window.showLeopard = function () {
  if (shown) return;
  shown = true;
  leo.hidden = false;
  place();
  leo.offsetWidth;
  leo.classList.add("is-up");
  setTimeout(function () {
    leo.classList.remove("is-up");                  // slides back down
    setTimeout(function () { leo.hidden = true; }, 700);
  }, STAYS * 1000);
};
window.leopard = function () { shown = false; window.showLeopard(); };   // test helper: type leopard() in the console

leo.addEventListener("click", function () { leo.classList.toggle("is-hover"); });   // phones: tap for pink spots + rainbow stars
setTimeout(window.showLeopard, AFTER_MINUTES * 60 * 1000);
window.addEventListener("resize", function () { if (!leo.hidden) place(); });

})();
