// ---------- 11:11 ----------
// At 11:11 AM and 11:11 PM — New York time OR Los Angeles time — a big pink 11:11
// covers the screen, in front of everything, with a little message at the bottom.
// It pops up (no fade), stays 10 seconds, then goes away; click anywhere to close it sooner.

(function () {

var ZONES = ["America/New_York", "America/Los_Angeles"];   // EST + PST (change here)

var box = document.getElementById("elevens");
var closedAt = "";        // so a closed one doesn't come back in the same minute

function whichZone(now) {
  for (var k = 0; k < ZONES.length; k++) {
    var t = now.toLocaleTimeString("en-US", { timeZone: ZONES[k], hour: "numeric", minute: "2-digit", hour12: true });
    if (/^11:11\s?(AM|PM)$/.test(t)) return ZONES[k] + " " + t;
  }
  return null;
}

function check() {
  var hit = whichZone(new Date());
  if (hit && hit !== closedAt) show();

}

var HOLD = 22;            // seconds it stays up (change here)
var timer = null;

function show() {
  if (!box.hidden) return;
  box.hidden = false;
  box.classList.add("is-on");
  clearTimeout(timer);
  timer = setTimeout(close, HOLD * 1000);   // goes away on its own after HOLD seconds
}
function hide() {
  clearTimeout(timer);
  box.classList.remove("is-on");
  box.hidden = true;
}
function close() {                          // closed (by a click or the timer): not again this minute
  closedAt = whichZone(new Date()) || "";
  hide();
}

box.addEventListener("click", close);

check();
setInterval(check, 5000);                                // checks every 5 seconds

window.show1111 = function () { closedAt = ""; show(); }; // for testing: type show1111() in the console

})();
