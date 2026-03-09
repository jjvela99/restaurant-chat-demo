(function () {
  const scriptTag = document.currentScript;

  const webhookUrl = scriptTag?.dataset?.webhook || "";
  const botName = scriptTag?.dataset?.botName || "Asistente del Restaurante";
  const subtitle = scriptTag?.dataset?.subtitle || "Respuestas automáticas sobre horarios, ubicación y más";
  const primaryColor = scriptTag?.dataset?.primaryColor || "#111827";
  const position = scriptTag?.dataset?.position || "right";

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
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      background: ${primaryColor};
      color: white;
      z-index: 999999;
    }

    .restaurant-chat-widget {
      position: fixed;
      bottom: 96px;
      ${sideProp}: ${sideValue};
      width: 360px;
      max-width: calc(100vw - 32px);
      height: 520px;
      background: white;
      border-radius: 18px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      display: none;
      flex-direction: column;
      z-index: 999998;
      font-family: Arial, sans-serif;
    }

    .restaurant-chat-widget.open {
      display: flex;
    }

    .restaurant-chat-header {
      background: ${primaryColor};
      color: white;
      padding: 16px;
    }

    .restaurant-chat-header h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      line-height: 1.2;
    }

    .restaurant-chat-header p {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.3;
    }

    .restaurant-chat-messages {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      background: #f9fafb;
    }

    .restaurant-message-row {
      display: flex;
      margin-bottom: 10px;
    }

    .restaurant-message-row.user {
      justify-content: flex-end;
    }

    .restaurant-message-row.bot {
      justify-content: flex-start;
    }

    .restaurant-message-bubble {
      max-width: 80%;
      padding: 10px 12px;
      border-radius: 14px;
      line-height: 1.4;
      font-size: 14px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .restaurant-message-row.user .restaurant-message-bubble {
      background: ${primaryColor};
      color: white;
      border-bottom-right-radius: 4px;
    }

    .restaurant-message-row.bot .restaurant-message-bubble {
      background: white;
      color: #111827;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
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
    }

    .restaurant-chat-input:focus {
      border-color: ${primaryColor};
    }

    .restaurant-send-btn {
      border: none;
      background: ${primaryColor};
      color: white;
      padding: 0 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: bold;
    }

    .restaurant-send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .restaurant-typing {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 10px;
      font-family: Arial, sans-serif;
    }

    @media (max-width: 480px) {
      .restaurant-chat-widget {
        ${sideProp}: 12px;
        bottom: 84px;
        width: calc(100vw - 24px);
        height: 70vh;
      }

      .restaurant-chat-toggle {
        ${sideProp}: 12px;
        bottom: 12px;
      }
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement("button");
  toggle.className = "restaurant-chat-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Abrir chat");
  toggle.textContent = "💬";

  const widget = document.createElement("div");
  widget.className = "restaurant-chat-widget";

  widget.innerHTML = `
    <div class="restaurant-chat-header">
      <h3>${botName}</h3>
      <p>${subtitle}</p>
    </div>
    <div class="restaurant-chat-messages" id="restaurant-chat-messages">
      <div class="restaurant-message-row bot">
        <div class="restaurant-message-bubble">¡Hola! Soy el asistente del restaurante. ¿En qué puedo ayudarte?</div>
      </div>
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

  let isOpen = false;

  toggle.addEventListener("click", () => {
    isOpen = !isOpen;
    widget.classList.toggle("open", isOpen);
    if (isOpen) input.focus();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  sendBtn.addEventListener("click", sendMessage);

  function addMessage(text, sender) {
    const row = document.createElement("div");
    row.className = `restaurant-message-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "restaurant-message-bubble";
    bubble.textContent = text;

    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "restaurant-typing";
    typing.id = "restaurant-typing-indicator";
    typing.textContent = "Escribiendo...";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById("restaurant-typing-indicator");
    if (typing) typing.remove();
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";
    sendBtn.disabled = true;
    addTypingIndicator();

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      removeTypingIndicator();
      addMessage(data.response || data.message || "No pude procesar la respuesta.", "bot");
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
