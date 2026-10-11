/* ============================================================================
   Order Intake — site behaviour.
   Deliberately tiny: no dependencies, no framework, no analytics, no cookies.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   WHERE THE REAL INTAKE ENDPOINT GOES
   ---------------------------------------------------------------------------
   Right now the pilot form opens a pre-filled email from the visitor's own
   mail client (no data leaves the page, nothing is transmitted silently).

   To collect submissions server-side instead, set INTAKE_ENDPOINT below to a
   form-service URL (a hosted form endpoint, or your own API route). When it is
   set, the form POSTs the payload as JSON and skips the mailto fallback.

     var INTAKE_ENDPOINT = "https://your-form-endpoint.example/submit";

   Leave it as an empty string to keep the mailto behaviour.
--------------------------------------------------------------------------- */
var INTAKE_ENDPOINT = "";

var CONTACT_EMAIL = "dawatmg976@gmail.com";

/* ---------- sticky header border ---------- */
(function () {
  var hdr = document.getElementById("hdr");
  if (!hdr) return;
  var onScroll = function () {
    if (window.scrollY > 8) hdr.classList.add("stuck");
    else hdr.classList.remove("stuck");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* ---------- mobile nav ---------- */
(function () {
  var toggle = document.getElementById("navtoggle");
  var nav = document.getElementById("nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

/* ---------- footer year ---------- */
(function () {
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();

/* ---------- pilot form ---------- */
(function () {
  var form = document.getElementById("pilot-form");
  if (!form) return;
  var status = document.getElementById("form-status");

  function say(msg, isError) {
    if (!status) return;
    status.textContent = msg;
    status.className = "status" + (isError ? " err" : "");
  }

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (data[k] === undefined) data[k] = v;
      else data[k] = [].concat(data[k], v);
    });
    return data;
  }

  function asText(data) {
    var lines = [];
    for (var k in data) {
      if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
      var v = data[k];
      lines.push(k + ": " + ([].concat(v).join(", ")));
    }
    return lines.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      say("Please complete the required fields.", true);
      return;
    }
    if (!document.getElementById("canShare").checked) {
      say("Tick the box to confirm you can share up to 500 historical order documents — that is the pilot.", true);
      return;
    }

    var data = collect();
    data.page = "pilot-form";

    if (INTAKE_ENDPOINT) {
      // Server-side path: POST JSON to the configured endpoint.
      say("Sending…");
      fetch(INTAKE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.reset();
          say("Received — we will come back within one business day.");
        })
        .catch(function () {
          say("That did not send. Please email " + CONTACT_EMAIL + " directly.", true);
        });
      return;
    }

    // Mailto path — nothing leaves the page until the visitor sends it.
    var subject = "Free pilot request — " + (data.company || "order intake");
    var body = asText(data) + "\n\n-- sent from the Order Intake pilot form";
    window.location.href =
      "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    say("Opening your mail client with the details filled in — send it and we will reply.");
  });
})();
