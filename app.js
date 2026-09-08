(function () {
  "use strict";

  var year = document.querySelector("#currentYear");
  if (year) { year.textContent = String(new Date().getFullYear()); }

  var reveals = Array.from(document.querySelectorAll(".reveal"));
  if (!("IntersectionObserver" in window)) {
    reveals.forEach(function (item) { item.classList.add("visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  reveals.forEach(function (item) { observer.observe(item); });
})();
