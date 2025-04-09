if (!window.voiceOverlayAlreadyLoaded) {
  window.voiceOverlayAlreadyLoaded = true;

  let lastFocusedElement = null;

  // 🔁 Försök spara första fält direkt (om aktivt när tillägget startas)
  lastFocusedElement = document.activeElement;
  console.log("💾 Första aktiva element:", lastFocusedElement);

  // 🔁 Uppdatera senast aktiva fält (om man klickar i nytt)
  document.addEventListener("focusin", () => {
    const el = document.activeElement;
    if (!el.closest("#voice-overlay")) {
      lastFocusedElement = el;
      console.log("💾 Sparat nytt fält:", el);
    }
  });

  // 🖼️ Skapa overlay
  const overlay = document.createElement("div");
  overlay.id = "voice-overlay";

  overlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong>🎤 Pratar...</strong>
      <button id="close-btn" style="
        background: none;
        color: white;
        border: none;
        font-size: 1.2em;
        cursor: pointer;
        margin-left: 10px;">✖</button>
    </div>
    <div id="voice-text">...</div>
  `;

  document.body.appendChild(overlay);

  // 🎤 Starta röst-till-text
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "sv-SE";
  recognition.continuous = true;
  recognition.interimResults = true;

  let fullText = "";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        fullText += transcript + " ";
        insertIntoField(transcript);
      } else {
        interim += transcript;
      }
    }
    document.getElementById("voice-text").innerText = fullText + interim;
  };

  recognition.onerror = (event) => {
    document.getElementById("voice-text").innerText = "❌ Fel: " + event.error;
    console.error("🎤 Fel:", event.error);
  };

  // 🔁 Starta om automatiskt om Chrome stänger av
  recognition.onend = () => {
    if (window.voiceOverlayAlreadyLoaded) {
      console.log("🔁 Chrome stängde av – startar om...");
      recognition.start();
    }
  };

  recognition.start();

  // ❌ Avstängning
  document.getElementById("close-btn").addEventListener("click", () => {
    recognition.onend = null; // stoppa återstart
    recognition.stop();
    overlay.remove();
    window.voiceOverlayAlreadyLoaded = false;
    console.log("🛑 Röst-till-text avslutat.");
  });

  function insertIntoField(text) {
    setTimeout(() => {
      const el = lastFocusedElement;
      console.log("✍️ Försöker skriva till:", el);
      if (!el) return;

      if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text")) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        el.setRangeText(text + " ", start, end, "end");
        el.focus();
        console.log("✅ Klistrade in i input/textarea");
      } else if (el.isContentEditable) {
        el.focus();
        document.execCommand("insertText", false, text + " ");
        console.log("✅ Klistrade in i contenteditable");
      } else {
        console.warn("⚠️ Ingen skrivbar ruta aktiv");
      }
    }, 100);
  }
}
