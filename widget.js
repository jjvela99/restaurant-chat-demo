(function () {
  const scriptTag = document.currentScript;

  const webhookUrl = scriptTag?.dataset?.webhook || "";
  const businessId = scriptTag?.dataset?.businessId || "1";
  const botName = scriptTag?.dataset?.botName || "Asistente del Restaurante";
  const subtitle =
    scriptTag?.dataset?.subtitle ||
    "Respuestas automáticas sobre horarios, ubicación y más";
  const primaryColor = scriptTag?.dataset?.primaryColor || "#111827";
  const position = scriptTag?.dataset?.position || "right";
  const welcomeMessage =
    scriptTag?.dataset?.welcome ||
    "¡Hola! Soy el asistente del restaurante. ¿En qué puedo ayudarte?";
  const reserveUrl = scriptTag?.dataset?.reserveUrl || "";
  const avatarText = scriptTag?.dataset?.avatarText || "AI";

  // ─── MEMORY CONFIG ───────────────────────────────────────────────
  const MAX_HISTORY = 10;
  let conversationHistory = [];
  // ─────────────────────────────────────────────────────────────────

  if (!webhookUrl) {
    console.error("Restaurant widget: missing data-webhook attribute.");
    return;
  }

  const sideProp = position === "left" ? "left" : "right";
  const sideValue = "24px";

  const style = document.createElement("style");
  style.textContent = `
    .restaurant-chat-toggle {
      position: fixed;
      bottom: 24px;
      ${sideProp}: ${sideValue};
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
      background: linear-gradient(135deg, ${primaryColor}, #1f2937);
      color: white;
      z-index: 999999;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .restaurant-chat-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
    }

    .restaurant-chat-widget {
      position: fixed;
      bottom: 100px;
      ${sideProp}: ${sideValue};
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 580px;
      background: white;
      border-radius: 22px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
      overflow: hidden;
      display: none;
      flex-direction: column;
      z-index: 999998;
      font-family: Arial, sans-serif;
      border: 1px solid rgba(17, 24, 39, 0.08);
    }

    .restaurant-chat-widget.open {
      display: flex;
    }

    .restaurant-chat-header {
      background: linear-gradient(135deg, ${primaryColor}, #1f2937);
      color: white;
      padding: 18px 18px 14px;
    }

    .restaurant-chat-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .restaurant-chat-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .restaurant-chat-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.4px;
      flex-shrink: 0;
    }

    .restaurant-chat-header h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .restaurant-chat-header p {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.35;
    }

    .restaurant-chat-close {
      border: none;
      background: rgba(255,255,255,0.12);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
    }

    .restaurant-chat-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .restaurant-chat-action-btn {
      border: 1px solid rgba(255,255,255,0.22);
      background: rgba(255,255,255,0.1);
      color: white;
      padding: 8px 12px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 12px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .restaurant-chat-messages {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%);
    }

    .restaurant-message-row {
      display: flex;
      margin-bottom: 12px;
      align-items: flex-end;
      gap: 8px;
    }

    .restaurant-message-row.user {
      justify-content: flex-end;
    }

    .restaurant-message-row.bot {
      justify-content: flex-start;
    }

    .restaurant-message-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(17, 24, 39, 0.18);
    }

    .restaurant-message-bubble {
      max-width: 80%;
      padding: 11px 13px;
      border-radius: 16px;
      line-height: 1.55;
      font-size: 14px;
      word-wrap: break-word;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
    }

    .restaurant-message-row.user .restaurant-message-bubble {
      background: ${primaryColor};
      color: white;
      border-bottom-right-radius: 5px;
      white-space: pre-wrap;
    }

    .restaurant-message-row.bot .restaurant-message-bubble {
      background: white;
      color: #111827;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 5px;
    }

    /* ── Markdown styles inside bot bubbles ── */
    .restaurant-message-bubble p {
      margin: 0 0 6px 0;
    }
    .restaurant-message-bubble p:last-child {
      margin-bottom: 0;
    }
    .restaurant-message-bubble strong {
      font-weight: 700;
    }
    .restaurant-message-bubble em {
      font-style: italic;
    }
    .restaurant-message-bubble ul {
      margin: 4px 0 6px 0;
      padding-left: 18px;
    }
    .restaurant-message-bubble ul:last-child {
      margin-bottom: 0;
    }
    .restaurant-message-bubble li {
      margin-bottom: 2px;
    }
    .restaurant-message-bubble a {
      color: ${primaryColor};
      text-decoration: underline;
      word-break: break-all;
    }
    .restaurant-message-row.user .restaurant-message-bubble a {
      color: rgba(255,255,255,0.85);
    }

    .restaurant-quick-actions {
      padding: 8px 14px 10px;
      background: #f3f4f6;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      border-top: 1px solid #e5e7eb;
    }

    .restaurant-quick-chip {
      border: 1px solid #d1d5db;
      background: white;
      color: #111827;
      padding: 8px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
      transition: background 0.15s;
    }

    .restaurant-quick-chip:hover {
      background: #f9fafb;
    }

    .restaurant-chat-input-area {
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      background: white;
      display: flex;
      gap: 8px;
    }

    .restaurant-chat-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      font-size: 14px;
      outline: none;
      font-family: Arial, sans-serif;
    }

    .restaurant-chat-input:focus {
      border-color: ${primaryColor};
      box-shadow: 0 0 0 3px rgba(17,24,39,0.08);
    }

    .restaurant-send-btn {
      border: none;
      background: ${primaryColor};
      color: white;
      padding: 0 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: bold;
      min-width: 78px;
      font-size: 14px;
      transition: opacity 0.15s;
    }

    .restaurant-send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .restaurant-typing-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .restaurant-typing-bubble {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      border-bottom-left-radius: 5px;
      padding: 12px 14px;
      display: inline-flex;
      gap: 6px;
      align-items: center;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
    }

    .restaurant-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #9ca3af;
      animation: restaurantBlink 1.2s infinite ease-in-out;
    }

    .restaurant-dot:nth-child(2) { animation-delay: 0.15s; }
    .restaurant-dot:nth-child(3) { animation-delay: 0.3s; }

    @keyframes restaurantBlink {
      0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-2px); }
    }

    @media (max-width: 480px) {
      .restaurant-chat-widget {
        ${sideProp}: 12px;
        bottom: 84px;
        width: calc(100vw - 24px);
        height: 76vh;
      }

      .restaurant-chat-toggle {
        ${sideProp}: 12px;
        bottom: 12px;
      }

      .restaurant-message-bubble {
        max-width: 86%;
      }
    }
  `;
  document.head.appendChild(style);

  // ─── MARKDOWN PARSER (sin dependencias externas) ─────────────────
  /**
   * Convierte un subconjunto de Markdown a HTML seguro.
   * Soporta: **negrita**, *cursiva*, [link](url), - listas, saltos de línea.
   * XSS-safe: el HTML del input se escapa antes de parsear.
   */
  function parseMarkdown(text) {
    // 1. Escapar HTML para prevenir XSS
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Procesar línea a línea
    const lines = escaped.split("\n");
    const htmlLines = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Detectar items de lista (- item o * item)
      const listMatch = line.match(/^[\s]*[-*]\s+(.+)/);
      if (listMatch) {
        if (!inList) {
          htmlLines.push("<ul>");
          inList = true;
        }
        htmlLines.push("<li>" + inlineFormat(listMatch[1]) + "</li>");
        continue;
      }

      // Cerrar lista si estábamos en una
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }

      // Línea vacía → salto de párrafo
      if (line.trim() === "") {
        htmlLines.push("<p></p>");
        continue;
      }

      htmlLines.push("<p>" + inlineFormat(line) + "</p>");
    }

    if (inList) htmlLines.push("</ul>");

    return htmlLines.join("");
  }

  function inlineFormat(text) {
    return text
      // **negrita**
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // *cursiva*
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
      // [texto](url)
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );
  }
  // ─────────────────────────────────────────────────────────────────

  const toggle = document.createElement("button");
  toggle.className = "restaurant-chat-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Abrir chat");
  toggle.textContent = "💬";

  const widget = document.createElement("div");
  widget.className = "restaurant-chat-widget";

  widget.innerHTML = `
    <div class="restaurant-chat-header">
      <div class="restaurant-chat-header-top">
        <div class="restaurant-chat-brand">
          <div class="restaurant-chat-avatar">${avatarText}</div>
          <div>
            <h3>${botName}</h3>
            <p>${subtitle}</p>
          </div>
        </div>
        <button type="button" class="restaurant-chat-close" aria-label="Cerrar chat">×</button>
      </div>
      <div class="restaurant-chat-actions">
        ${reserveUrl ? `<a class="restaurant-chat-action-btn" href="${reserveUrl}" target="_blank" rel="noopener noreferrer">📅 Reservar</a>` : ""}
        <button type="button" class="restaurant-chat-action-btn restaurant-scroll-bottom">↓ Ir al final</button>
      </div>
    </div>
    <div class="restaurant-chat-messages" id="restaurant-chat-messages">
      <div class="restaurant-message-row bot">
        <div class="restaurant-message-avatar">${avatarText}</div>
        <div class="restaurant-message-bubble">${parseMarkdown(welcomeMessage)}</div>
      </div>
    </div>
    <div class="restaurant-quick-actions">
      <button type="button" class="restaurant-quick-chip" data-question="¿A qué hora abren?">Horario</button>
      <button type="button" class="restaurant-quick-chip" data-question="¿Dónde están?">Ubicación</button>
      <button type="button" class="restaurant-quick-chip" data-question="¿Tienen terraza?">Terraza</button>
    </div>
    <div class="restaurant-chat-input-area">
      <input type="text" class="restaurant-chat-input" placeholder="Escribe tu pregunta..." />
      <button type="button" class="restaurant-send-btn">Enviar</button>
    </div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(widget);

  const messages = widget.querySelector("#restaurant-chat-messages");
  const input = widget.querySelector(".restaurant-chat-input");
  const sendBtn = widget.querySelector(".restaurant-send-btn");
  const closeBtn = widget.querySelector(".restaurant-chat-close");
  const scrollBottomBtn = widget.querySelector(".restaurant-scroll-bottom");
  const quickChips = widget.querySelectorAll(".restaurant-quick-chip");

  let isOpen = false;

  toggle.addEventListener("click", () => {
    isOpen = !isOpen;
    widget.classList.toggle("open", isOpen);
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener("click", () => {
    isOpen = false;
    widget.classList.remove("open");
  });

  scrollBottomBtn.addEventListener("click", () => {
    messages.scrollTop = messages.scrollHeight;
  });

  quickChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.question || "";
      sendMessage();
    });
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  sendBtn.addEventListener("click", sendMessage);

  // ─── HELPERS ─────────────────────────────────────────────────────

  function addMessage(text, sender) {
    const row = document.createElement("div");
    row.className = `restaurant-message-row ${sender}`;

    if (sender === "bot") {
      const avatar = document.createElement("div");
      avatar.className = "restaurant-message-avatar";
      avatar.textContent = avatarText;
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "restaurant-message-bubble";

    if (sender === "bot") {
      // Renderizar Markdown solo en mensajes del bot
      bubble.innerHTML = parseMarkdown(text);
    } else {
      // Texto plano para el usuario (XSS-safe)
      bubble.textContent = text;
    }

    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTypingIndicator() {
    const row = document.createElement("div");
    row.className = "restaurant-typing-row";
    row.id = "restaurant-typing-indicator";

    const avatar = document.createElement("div");
    avatar.className = "restaurant-message-avatar";
    avatar.textContent = avatarText;

    const bubble = document.createElement("div");
    bubble.className = "restaurant-typing-bubble";
    bubble.innerHTML =
      '<span class="restaurant-dot"></span><span class="restaurant-dot"></span><span class="restaurant-dot"></span>';

    row.appendChild(avatar);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById("restaurant-typing-indicator");
    if (typing) typing.remove();
  }

  // ─── MEMORY ──────────────────────────────────────────────────────

  function pushToHistory(role, content) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory = conversationHistory.slice(
        conversationHistory.length - MAX_HISTORY
      );
    }
  }

  // ─── SEND ────────────────────────────────────────────────────────

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";
    sendBtn.disabled = true;
    addTypingIndicator();

    pushToHistory("user", message);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          business_id: Number(businessId),
          history: conversationHistory,
        }),
      });

      const data = await response.json();
      removeTypingIndicator();

      const botReply =
        data.response || data.message || "No pude procesar la respuesta.";

      addMessage(botReply, "bot");
      pushToHistory("assistant", botReply);
    } catch (error) {
      removeTypingIndicator();
      addMessage("Hubo un problema al conectar con el asistente.", "bot");
      console.error(error);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }
})();
