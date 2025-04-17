if (!window.voiceOverlayAlreadyLoaded) {
  window.voiceOverlayAlreadyLoaded = true;

  // Injicera Material Icons om det inte redan finns
  if (!document.querySelector('link[href*="Material+Icons"]')) {
    const iconLink = document.createElement("link");
    iconLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    iconLink.rel = "stylesheet";
    document.head.appendChild(iconLink);
  }

  let lastFocusedElement = document.activeElement;
  console.log("💾 Första aktiva element:", lastFocusedElement);

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
  // Sätt minsta storlek direkt
  overlay.style.minWidth = "200px";
  overlay.style.minHeight = "80px";

  overlay.innerHTML = `
    <style>
      /* Overlay-bakgrund och grundstil */
      #voice-overlay {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(40, 40, 40, 0.9);
        color: white;
        font-family: sans-serif;
        padding: 12px 16px;
        border-radius: 10px;
        z-index: 999999;
        box-shadow: 0 0 10px #00000055;
        width: 300px;
      }
      #voice-text {
        margin-top: 6px;
        font-size: 1em;
        line-height: 1.4;
        word-break: break-word;
        max-height: 200px;
        overflow-y: auto;
      }
      .material-icons {
        font-family: 'Material Icons';
        vertical-align: middle;
        cursor: pointer;
        transition: transform 0.1s, color 0.1s;
        font-size: 1.2em;
        color: white;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .recording {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .recording .material-icons {
        font-size: 1.4em;
      }
      .record-dot {
        width: 8px;
        height: 8px;
        background: #E57373;
        border-radius: 50%;
        animation: pulse 1s infinite ease-in-out;
      }
      @keyframes pulse {
        0%   { transform: scale(1); opacity: 1; }
        50%  { transform: scale(1.4); opacity: 0.6; }
        100% { transform: scale(1); opacity: 1; }
      }
      .controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      #pause-btn:hover .material-icons {
        color: #2196F3;
        transform: scale(1.2);
      }
      #clear-btn:hover .material-icons {
        color: #FFB74D;
        transform: scale(1.2);
      }
      #copy-btn:hover .material-icons {
        color: #4CAF50;
        transform: scale(1.2);
      }
      #close-btn:hover .material-icons {
        color: #E57373;
        transform: scale(1.2);
      }
    </style>

    <div class="header">
      <div class="recording">
        <span class="material-icons">mic</span>
        <div class="record-dot"></div>
      </div>
      <div class="controls">
        <button id="pause-btn" title="Pausa inspelning">
          <span class="material-icons">pause</span>
        </button>
        <button id="clear-btn" title="Rensa all text">
          <span class="material-icons">delete_forever</span>
        </button>
        <button id="copy-btn" title="Kopiera all text">
          <span class="material-icons">content_copy</span>
        </button>
        <button id="close-btn" title="Stäng overlay">
          <span class="material-icons">close</span>
        </button>
      </div>
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
  let isRecognizing = true;

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
    const txtEl = document.getElementById("voice-text");
    txtEl.innerText = fullText + interim;
    txtEl.scrollTop = txtEl.scrollHeight; // autoscroll
  };

  recognition.onerror = (event) => {
    document.getElementById("voice-text").innerText = "❌ Fel: " + event.error;
    console.error("🎤 Fel:", event.error);
  };

  recognition.onend = () => {
    if (isRecognizing) {
      console.log("🔁 Chrome stängde av – startar om...");
      recognition.start();
    }
  };

  recognition.start();

  // ⏯️ Paus/återuppta
  document.getElementById("pause-btn").addEventListener("click", () => {
    const icon = document.querySelector("#pause-btn .material-icons");
    if (isRecognizing) {
      recognition.stop();
      isRecognizing = false;
      icon.textContent = "play_arrow";
      document.getElementById("pause-btn").title = "Återuppta inspelning";
      console.log("⏸️ Inspelning pausad");
    } else {
      recognition.start();
      isRecognizing = true;
      icon.textContent = "pause";
      document.getElementById("pause-btn").title = "Pausa inspelning";
      console.log("▶️ Inspelning återupptagen");
    }
  });

  // 🗑️ Rensa all text
  document.getElementById("clear-btn").addEventListener("click", () => {
    fullText = "";
    document.getElementById("voice-text").innerText = "";
    console.log("🗑️ Text rensad");
  });

  // 📋 Kopiera all text
  document.getElementById("copy-btn").addEventListener("click", () => {
    const textToCopy = fullText.trim();
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy)
      .then(() => console.log("✅ Text kopierad till urklipp"))
      .catch(err => console.error("❌ Kunde inte kopiera text:", err));
  });

  // ❌ Avsluta overlay
  document.getElementById("close-btn").addEventListener("click", () => {
    recognition.onend = null;
    recognition.stop();
    overlay.remove();
    window.voiceOverlayAlreadyLoaded = false;
    console.log("🛑 Röst-till-text avslutat.");
  });

  function insertIntoField(text) {
    setTimeout(() => {
      const el = lastFocusedElement;
      if (!el) return;
      if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text")) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        el.setRangeText(text + " ", start, end, "end");
        el.focus();
      } else if (el.isContentEditable) {
        el.focus();
        document.execCommand("insertText", false, text + " ");
      }
    }, 100);
  }
}
