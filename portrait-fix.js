(() => {
  const portraits = new Map([
    [
      "Illustrated portrait of Rika standing among cherry blossoms",
      "assets/rika-standing-transparent.png?v=20260812c",
    ],
    [
      "Illustrated portrait of Rika making a peace sign",
      "assets/rika-peace-transparent.png?v=20260812c",
    ],
  ]);

  function bindPortraits() {
    document.querySelectorAll("img[alt]").forEach((image) => {
      const source = portraits.get(image.alt);
      if (source && image.getAttribute("src") !== source) {
        image.setAttribute("src", source);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindPortraits, { once: true });
  } else {
    bindPortraits();
  }
})();
