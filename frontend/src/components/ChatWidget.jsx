import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FaComments,
  FaHeadset,
  FaPaperPlane,
  FaTimes,
} from "react-icons/fa";
import "../css/ChatWidget.css";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const getMessageSide = (message) =>
  ["ai", "agent", "system"].includes(message.senderType) ? "bot" : "user";

const getMessageKey = (message) =>
  message.id ||
  [
    message.sessionId,
    message.senderType,
    message.metadata?.event,
    message.metadata?.intent,
    message.text,
    message.createdAt,
  ]
    .filter(Boolean)
    .join("-");

const mergeUniqueMessages = (current, nextMessages) => {
  const seen = new Set(current.map(getMessageKey));
  const uniqueMessages = [...current];

  nextMessages.forEach((message) => {
    const key = getMessageKey(message);
    if (seen.has(key)) return;

    seen.add(key);
    uniqueMessages.push(message);
  });

  return uniqueMessages;
};

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [statusText, setStatusText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [error, setError] = useState("");
  const [isClosingSession, setIsClosingSession] = useState(false);
  const socketRef = useRef(null);
  const endRef = useRef(null);

  const user = getStoredUser();
  const token = localStorage.getItem("token");
  const canChat = Boolean(token && user?.id);

  useEffect(() => {
    if (!isOpen || !canChat) return undefined;

    const socket = io(getSocketUrl(), {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setError("");
      socket.emit("session:start", { userId: user.id, topic: "petshop" });
    });

    socket.on("session:history", ({ sessionId: nextSessionId, status, messages }) => {
      setSessionId(nextSessionId);
      setStatus(status);
      setMessages(mergeUniqueMessages([], messages || []));
      setShowEscalate(false);
      setIsClosingSession(false);
    });

    socket.on("message:receive", (message) => {
      setMessages((current) => mergeUniqueMessages(current, [message]));
      if (message.metadata?.intent === "escalation_prompt") {
        setShowEscalate(true);
      }
    });

    socket.on("support:status", ({ status, message }) => {
      setStatus(status);
      setStatusText(message || "");
      if (status === "closed") {
        setShowEscalate(false);
        setIsClosingSession(false);
      }
    });

    socket.on("session:closed", () => {
      setStatus("closed");
      setShowEscalate(false);
      setIsClosingSession(false);
    });

    socket.on("ui:show_escalate_button", ({ show }) => {
      setShowEscalate(Boolean(show));
    });

    socket.on("bot:typing", ({ isTyping }) => {
      setIsTyping(Boolean(isTyping));
    });

    socket.on("chat:error", ({ message }) => {
      setError(message || "Sohbet baglantisinda bir sorun olustu.");
    });

    socket.on("connect_error", () => {
      setError("Sohbet sunucusuna baglanilamadi.");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [canChat, isOpen, token, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showEscalate, isOpen]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !sessionId || status === "closed") return;

    socketRef.current?.emit("message:send", { sessionId, text });
    setInput("");
  };

  const confirmEscalation = () => {
    if (!sessionId) return;
    socketRef.current?.emit("session:confirm_escalate", { sessionId });
    setShowEscalate(false);
  };

  const closeSession = () => {
    if (!sessionId || status === "closed" || isClosingSession) return;
    setIsClosingSession(true);
    socketRef.current?.emit("session:close", { sessionId });
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <section className="chat-panel" aria-label="Canli destek sohbeti">
          <header className="chat-panel__header">
            <div>
              <span className="chat-panel__eyebrow">Petshop destek</span>
              <strong>Canli yardim</strong>
            </div>
            <button
              type="button"
              className="chat-icon-button"
              onClick={() => setIsOpen(false)}
              aria-label="Sohbeti kapat"
            >
              <FaTimes />
            </button>
          </header>

          {!canChat ? (
            <div className="chat-empty-state">
              <FaHeadset />
              <p>Sohbet destegini kullanmak icin giris yapmalisiniz.</p>
              <a href="/login">Giris yap</a>
            </div>
          ) : (
            <>
              {(statusText || error) && (
                <div className={`chat-status ${error ? "chat-status--error" : ""}`}>
                  {error || statusText}
                </div>
              )}

              <div className="chat-messages" role="log" aria-live="polite">
                {messages.map((message) => (
                  <div
                    className={`chat-message chat-message--${getMessageSide(message)}`}
                    key={message.id || `${message.senderType}-${message.createdAt}`}
                  >
                    {message.text}
                  </div>
                ))}
                {isTyping && <div className="chat-typing">Asistan yaziyor...</div>}
                <div ref={endRef} />
              </div>

              {showEscalate && (
                <div className="chat-escalate">
                  <span>Canli destek secenegi hazir.</span>
                  <button type="button" onClick={confirmEscalation}>
                    Temsilciye bagla
                  </button>
                </div>
              )}

              <footer className="chat-panel__footer">
                <button
                  type="button"
                  className="chat-close-session"
                  onClick={closeSession}
                  disabled={!sessionId || status === "closed" || isClosingSession}
                >
                  Bitir
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendMessage();
                  }}
                  placeholder="Mesajinizi yazin"
                  disabled={!sessionId || status === "closed"}
                />
                <button
                  type="button"
                  className="chat-send"
                  onClick={sendMessage}
                  disabled={!input.trim() || !sessionId || status === "closed"}
                  aria-label="Mesaj gonder"
                >
                  <FaPaperPlane />
                </button>
              </footer>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        className="chat-fab"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Canli destek sohbetini ac"
      >
        <FaComments />
      </button>
    </div>
  );
}

export default ChatWidget;
