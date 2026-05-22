import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const formatSessionTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCustomerLabel = (session) => {
  const fullName = [session?.user?.name, session?.user?.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || `Musteri #${session?.userId}`;
};

const getSenderLabel = (senderType) => {
  const labels = {
    ai: "Asistan",
    agent: "Temsilci",
    customer: "Musteri",
    system: "Sistem",
  };

  return labels[senderType] || "Sistem";
};

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

function SupportAgentPanel({ profile }) {
  const [socketStatus, setSocketStatus] = useState("Baglanti bekleniyor");
  const [queue, setQueue] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [panelError, setPanelError] = useState("");
  const socketRef = useRef(null);
  const messageListRef = useRef(null);
  const sessionByIdRef = useRef({});
  const activeSessionIdRef = useRef(null);

  const agentId = profile?.id;
  const selectedSessionId = selectedSession?.id;
  const canSend = Boolean(activeSessionId && messageText.trim());

  const sessionById = useMemo(() => {
    const sessions = [...activeSessions, ...queue];
    return sessions.reduce((map, session) => {
      map[session.id] = session;
      return map;
    }, {});
  }, [activeSessions, queue]);

  useEffect(() => {
    sessionByIdRef.current = sessionById;
  }, [sessionById]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    if (!agentId) return undefined;

    const socket = io(getSocketUrl(), {
      transports: ["websocket"],
      auth: { token: localStorage.getItem("token") },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus(`Temsilci #${agentId} baglandi`);
      setPanelError("");
      socket.emit("agent:connect", agentId);
    });

    socket.on("connect_error", () => {
      setSocketStatus("Sohbet sunucusuna baglanilamadi");
    });

    socket.on("agent:queue", (sessions = []) => {
      setQueue(sessions);
    });

    socket.on("agent:active_sessions", (sessions = []) => {
      setActiveSessions(sessions);
    });

    socket.on("session:history", ({ sessionId, messages: history = [] }) => {
      const session = sessionByIdRef.current[sessionId] || { id: sessionId };
      setSelectedSession(session);
      setActiveSessionId(sessionId);
      setMessages(mergeUniqueMessages([], history));
      setPanelError("");
    });

    socket.on("message:receive", (message) => {
      setMessages((current) => {
        if (message.sessionId !== activeSessionIdRef.current) return current;
        return mergeUniqueMessages(current, [message]);
      });
    });

    socket.on("support:status", ({ sessionId, message }) => {
      if (sessionId !== activeSessionIdRef.current || !message) return;
      setPanelError(message);
    });

    socket.on("session:closed", ({ sessionId }) => {
      if (sessionId !== activeSessionIdRef.current) return;
      setPanelError("Gorusme sonlandirildi.");
      setActiveSessionId(null);
    });

    socket.on("chat:error", ({ message }) => {
      setPanelError(message || "Canli destek isleminde hata olustu.");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [agentId]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, activeSessionId]);

  const acceptSession = (session) => {
    setSelectedSession(session);
    setPanelError("");
    socketRef.current?.emit("agent:accept_session", { sessionId: session.id });
  };

  const openSession = (session) => {
    setSelectedSession(session);
    setPanelError("");
    socketRef.current?.emit("agent:open_session", { sessionId: session.id });
  };

  const sendMessage = () => {
    const text = messageText.trim();
    if (!text || !activeSessionId) return;

    socketRef.current?.emit("agent:message_send", {
      sessionId: activeSessionId,
      text,
    });
    setMessageText("");
  };

  const handleComposerKeyDown = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();
    sendMessage();
  };

  const closeSession = () => {
    if (!activeSessionId) return;
    socketRef.current?.emit("agent:close_session", { sessionId: activeSessionId });
  };

  return (
    <section className="support-agent-panel">
      <div className="support-agent-sidebar">
        <div className="support-agent-status">
          <span className="material-symbols-outlined">support_agent</span>
          <div>
            <strong>Temsilci hattı</strong>
            <small>{socketStatus}</small>
          </div>
        </div>

        <div className="support-session-list">
          <div className="support-session-list__header">
            <strong>Bekleyen Talepler</strong>
            <span>{queue.length}</span>
          </div>
          {queue.map((session) => (
            <button
              className={`support-session-item ${
                selectedSessionId === session.id ? "active" : ""
              }`}
              key={session.id}
              onClick={() => acceptSession(session)}
              type="button"
            >
              <span>{getCustomerLabel(session)}</span>
              <small>
                #{session.id} - {session.topic || "Genel destek"} -{" "}
                {formatSessionTime(session.updatedAt)}
              </small>
            </button>
          ))}
          {queue.length === 0 && (
            <div className="support-empty-list">Bekleyen sohbet yok.</div>
          )}
        </div>

        <div className="support-session-list">
          <div className="support-session-list__header">
            <strong>Aktif Görüşmeler</strong>
            <span>{activeSessions.length}</span>
          </div>
          {activeSessions.map((session) => (
            <button
              className={`support-session-item ${
                selectedSessionId === session.id ? "active" : ""
              }`}
              key={session.id}
              onClick={() => openSession(session)}
              type="button"
            >
              <span>{getCustomerLabel(session)}</span>
              <small>
                #{session.id} - {formatSessionTime(session.updatedAt)}
              </small>
            </button>
          ))}
          {activeSessions.length === 0 && (
            <div className="support-empty-list">Aktif görüşme yok.</div>
          )}
        </div>
      </div>

      <div className="support-chat-area">
        <div className="support-chat-header">
          <div>
            <strong>
              {selectedSession
                ? getCustomerLabel(selectedSession)
                : "Oturum seçilmedi"}
            </strong>
            <small>
              {activeSessionId
                ? `Canli gorusme #${activeSessionId}`
                : "Bekleyen bir talebi kabul edin veya aktif görüşmeyi açın"}
            </small>
          </div>
          <button
            className="support-close-btn"
            disabled={!activeSessionId}
            onClick={closeSession}
            type="button"
          >
            <span className="material-symbols-outlined">call_end</span>
            Bitir
          </button>
        </div>

        {panelError && <div className="support-panel-error">{panelError}</div>}

        <div className="support-message-list" ref={messageListRef}>
          {messages.map((message) => (
            <div
              className={`support-message support-message--${
                message.senderType || "system"
              }`}
              key={message.id || `${message.senderType}-${message.createdAt}`}
            >
              <span>{getSenderLabel(message.senderType)}</span>
              <p>{message.text}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="support-empty-chat">
              Müşteri sohbeti seçildiğinde mesaj geçmişi burada görünür.
            </div>
          )}
        </div>

        <div className="support-composer">
          <input
            disabled={!activeSessionId}
            onChange={(event) => setMessageText(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Müşteriye mesaj yazın"
            type="text"
            value={messageText}
          />
          <button disabled={!canSend} onClick={sendMessage} type="button">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default SupportAgentPanel;
