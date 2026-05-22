const { Op } = require("sequelize");
const { User, ChatSession, Message } = require("../models");
const { getRealAiSupportReply } = require("../services/aiSupportService");
const {
  decryptMessageRecord,
  encryptMessage,
} = require("../services/messageCrypto");

const SESSION_STATUS = {
  AI: "ai",
  WAITING_AGENT: "waiting_agent",
  AGENT: "agent",
  CLOSED: "closed",
};

const SENDER_TYPE = {
  CUSTOMER: "customer",
  AI: "ai",
  AGENT: "agent",
  SYSTEM: "system",
};

function getSessionRoom(sessionId) {
  return `session_${sessionId}`;
}

async function ensureExistingUser(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("Kullanici bulunamadi.");
  }
  return user;
}

function normalizeSupportText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function wantsAgent(userMessage) {
  const msg = normalizeSupportText(userMessage);
  return [
    "temsilci",
    "musteri temsilcisi",
    "canli destek",
    "insan",
    "operator",
    "agent",
  ].some((keyword) => msg.includes(keyword));
}

async function createSupportMessage({
  sessionId,
  text,
  senderType,
  senderId = null,
  userId = null,
  metadata = {},
}) {
  const message = await Message.create({
    sessionId,
    text: encryptMessage(text),
    senderType,
    senderId,
    userId,
    metadata,
  });

  return decryptMessageRecord(message);
}

async function hasEscalationPrompt(sessionId) {
  const promptCount = await Message.count({
    where: {
      sessionId,
      senderType: SENDER_TYPE.AI,
      metadata: {
        [Op.contains]: { intent: "escalation_prompt" },
      },
    },
  });

  return promptCount > 0;
}

async function sendSessionHistory(socket, session) {
  const messages = await Message.findAll({
    where: { sessionId: session.id },
    order: [["createdAt", "ASC"]],
  });

  socket.emit("session:history", {
    sessionId: session.id,
    status: session.status,
    assignedAgentId: session.assignedAgentId,
    messages: messages.map(decryptMessageRecord),
  });
}

async function emitQueuedSessions(io) {
  const sessions = await ChatSession.findAll({
    where: { status: SESSION_STATUS.WAITING_AGENT },
    order: [["updatedAt", "ASC"]],
    include: [{ model: User, as: "user", attributes: ["id", "name", "surname"] }],
  });

  io.to("agents").emit("agent:queue", sessions);
}

async function emitAgentSessions(socket) {
  if (!socket.agentId) return;

  const sessions = await ChatSession.findAll({
    where: {
      status: SESSION_STATUS.AGENT,
      assignedAgentId: socket.agentId,
    },
    order: [["updatedAt", "DESC"]],
    include: [{ model: User, as: "user", attributes: ["id", "name", "surname"] }],
  });

  socket.emit("agent:active_sessions", sessions);
}

async function moveSessionToAgentQueue({ io, session, roomName, reason }) {
  await session.update({ status: SESSION_STATUS.WAITING_AGENT });

  const transferMsg = await createSupportMessage({
    sessionId: session.id,
    senderType: SENDER_TYPE.SYSTEM,
    text: "Sizi musteri temsilcisine aktariyorum. Talebiniz destek kuyruguna alindi.",
    metadata: {
      event: "agent_transfer_started",
      reason,
      shouldEscalate: true,
    },
  });
  const guidanceMsg = await createSupportMessage({
    sessionId: session.id,
    senderType: SENDER_TYPE.SYSTEM,
    text: "Temsilci baglanana kadar buradan yazmaya devam edebilirsiniz. Mesajlariniz gorusme gecmisine eklenir.",
    metadata: { event: "waiting_agent_guidance" },
  });

  io.to(roomName).emit("message:receive", transferMsg);
  io.to(roomName).emit("message:receive", guidanceMsg);
  io.to(roomName).emit("support:status", {
    sessionId: session.id,
    status: SESSION_STATUS.WAITING_AGENT,
    message: "Musteri temsilcisi araniyor. Lutfen bu ekrani acik tutun.",
  });

  await emitQueuedSessions(io);
}

async function closeSupportSession({
  io,
  session,
  closedBy,
  closedById = null,
}) {
  const [updatedCount] = await ChatSession.update(
    { status: SESSION_STATUS.CLOSED },
    {
      where: {
        id: session.id,
        status: { [Op.ne]: SESSION_STATUS.CLOSED },
      },
    },
  );

  if (!updatedCount) {
    return false;
  }

  await session.reload();

  const roomName = getSessionRoom(session.id);
  const systemMsg = await createSupportMessage({
    sessionId: session.id,
    senderType: SENDER_TYPE.SYSTEM,
    text: "Gorusme sonlandirildi. Yeni bir destek talebi icin yeniden mesaj baslatabilirsiniz.",
    metadata: { event: "session_closed", closedBy, closedById },
  });

  io.to(roomName).emit("message:receive", systemMsg);
  io.to(roomName).emit("support:status", {
    sessionId: session.id,
    status: SESSION_STATUS.CLOSED,
    message: "Gorusme sonlandirildi.",
  });
  io.to(roomName).emit("session:closed", {
    sessionId: session.id,
    closedBy,
    closedById,
  });

  return true;
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("session:start", async (payload = {}) => {
      try {
        const userId = typeof payload === "object" ? payload.userId : payload;
        const topic = typeof payload === "object" ? payload.topic : null;
        const orderId = typeof payload === "object" ? payload.orderId : null;

        if (!userId) {
          socket.emit("chat:error", { message: "Sohbet icin once giris yapmalisiniz." });
          return;
        }

        await ensureExistingUser(userId);
        socket.userId = Number(userId);
        socket.role = "customer";

        let session = await ChatSession.findOne({
          where: {
            userId: socket.userId,
            status: {
              [Op.in]: [
                SESSION_STATUS.AI,
                SESSION_STATUS.WAITING_AGENT,
                SESSION_STATUS.AGENT,
              ],
            },
          },
          order: [["updatedAt", "DESC"]],
        });

        if (!session) {
          session = await ChatSession.create({
            userId: socket.userId,
            topic,
            orderId,
            status: SESSION_STATUS.AI,
          });

          await createSupportMessage({
            sessionId: session.id,
            senderType: SENDER_TYPE.AI,
            text: "Merhaba! Ben petshop destek asistani. Urun, siparis, teslimat ve kampanya konularinda yardimci olabilirim; gerekirse sizi musteri temsilcisine aktaririm.",
            metadata: { intent: "greeting", confidence: 1 },
          });
        }

        socket.join(getSessionRoom(session.id));
        await sendSessionHistory(socket, session);
      } catch (error) {
        console.error("session:start hatasi:", error.message);
        socket.emit("chat:error", { message: "Sohbet oturumu baslatilamadi." });
      }
    });

    socket.on("message:send", async ({ sessionId, text }) => {
      try {
        if (!socket.userId || !sessionId || !text?.trim()) return;

        const session = await ChatSession.findByPk(sessionId);
        if (!session || session.userId !== socket.userId) {
          socket.emit("chat:error", {
            message: "Bu sohbet oturumuna erisemezsiniz.",
          });
          return;
        }
        if (session.status === SESSION_STATUS.CLOSED) {
          socket.emit("chat:error", {
            message: "Bu gorusme sonlandirilmis. Yeni sohbet baslatin.",
          });
          return;
        }

        const roomName = getSessionRoom(session.id);
        const customerText = text.trim();
        const customerMsg = await createSupportMessage({
          sessionId: session.id,
          text: customerText,
          senderType: SENDER_TYPE.CUSTOMER,
          senderId: socket.userId,
          userId: socket.userId,
        });
        io.to(roomName).emit("message:receive", customerMsg);

        if (session.status === SESSION_STATUS.AGENT) {
          io.to("agents").emit("agent:customer_message", {
            sessionId: session.id,
            message: customerMsg,
          });
          return;
        }

        if (session.status === SESSION_STATUS.WAITING_AGENT) {
          const waitingMsg = await createSupportMessage({
            sessionId: session.id,
            senderType: SENDER_TYPE.SYSTEM,
            text: "Temsilciye baglanmaniz bekleniyor. Mesajiniz gorusme gecmisine eklendi.",
            metadata: { event: "still_waiting_agent" },
          });
          io.to(roomName).emit("message:receive", waitingMsg);
          await emitQueuedSessions(io);
          return;
        }

        const triggerEscalationQuestion = async (intentName) => {
          if (await hasEscalationPrompt(session.id)) {
            return;
          }

          const promptMsg = await createSupportMessage({
            sessionId: session.id,
            senderType: SENDER_TYPE.AI,
            text: "Bu konuda yetkim kisitli. Sizi bir musteri temsilcisine yonlendirmemi ister misiniz?",
            metadata: {
              intent: "escalation_prompt",
              originalIntent: intentName,
            },
          });
          io.to(roomName).emit("message:receive", promptMsg);
          io.to(roomName).emit("ui:show_escalate_button", {
            sessionId: session.id,
            show: true,
          });
        };

        if (wantsAgent(customerText)) {
          await triggerEscalationQuestion("customer_requested_agent");
          return;
        }

        io.to(roomName).emit("bot:typing", {
          sessionId: session.id,
          isTyping: true,
        });

        setTimeout(async () => {
          try {
            const aiReply = await getRealAiSupportReply(customerText);

            io.to(roomName).emit("bot:typing", {
              sessionId: session.id,
              isTyping: false,
            });

            if (aiReply.shouldEscalate) {
              await triggerEscalationQuestion(aiReply.intent);
              return;
            }

            const aiMsg = await createSupportMessage({
              sessionId: session.id,
              senderType: SENDER_TYPE.AI,
              text: aiReply.text,
              metadata: {
                intent: aiReply.intent,
                confidence: aiReply.confidence,
                shouldEscalate: false,
              },
            });

            io.to(roomName).emit("message:receive", aiMsg);
          } catch (error) {
            console.error("AI cevap hatasi:", error.message);
            io.to(roomName).emit("bot:typing", {
              sessionId: session.id,
              isTyping: false,
            });
          }
        }, 500);
      } catch (error) {
        console.error("message:send hatasi:", error.message);
        socket.emit("chat:error", { message: "Mesaj gonderilemedi." });
      }
    });

    socket.on("session:confirm_escalate", async ({ sessionId }) => {
      try {
        if (!socket.userId || !sessionId) return;

        const session = await ChatSession.findByPk(sessionId);
        if (!session || session.userId !== socket.userId) return;
        if (session.status !== SESSION_STATUS.AI) return;

        await moveSessionToAgentQueue({
          io,
          session,
          roomName: getSessionRoom(session.id),
          reason: "customer_confirmed_escalation",
        });
      } catch (error) {
        console.error("session:confirm_escalate hatasi:", error.message);
      }
    });

    socket.on("session:close", async ({ sessionId }) => {
      try {
        if (!socket.userId || !sessionId) return;

        const session = await ChatSession.findByPk(sessionId);
        if (!session || session.userId !== socket.userId) return;
        if (session.status === SESSION_STATUS.CLOSED) return;

        await closeSupportSession({
          io,
          session,
          closedBy: SENDER_TYPE.CUSTOMER,
          closedById: socket.userId,
        });
        await emitQueuedSessions(io);
      } catch (error) {
        console.error("session:close hatasi:", error.message);
        socket.emit("chat:error", { message: "Gorusme sonlandirilamadi." });
      }
    });

    socket.on("agent:connect", async (agentId) => {
      try {
        if (!agentId) {
          socket.emit("chat:error", { message: "Temsilci bilgisi eksik." });
          return;
        }

        const agent = await ensureExistingUser(agentId);
        if (agent.role !== "admin") {
          socket.emit("chat:error", { message: "Temsilci yetkisi gerekli." });
          return;
        }

        socket.agentId = Number(agentId);
        socket.role = "agent";
        socket.join("agents");

        await emitQueuedSessions(io);
        await emitAgentSessions(socket);
      } catch (error) {
        console.error("agent:connect hatasi:", error.message);
        socket.emit("chat:error", {
          message: "Temsilci baglantisi baslatilamadi.",
        });
      }
    });

    socket.on("agent:accept_session", async ({ sessionId } = {}) => {
      try {
        if (!socket.agentId || !sessionId) return;

        const session = await ChatSession.findByPk(sessionId);
        if (!session || session.status === SESSION_STATUS.CLOSED) {
          socket.emit("chat:error", { message: "Sohbet oturumu bulunamadi." });
          return;
        }

        await session.update({
          status: SESSION_STATUS.AGENT,
          assignedAgentId: socket.agentId,
        });

        const roomName = getSessionRoom(session.id);
        socket.join(roomName);

        const systemMsg = await createSupportMessage({
          sessionId: session.id,
          senderType: SENDER_TYPE.SYSTEM,
          text: "Musteri temsilcisi gorusmeye katildi.",
          metadata: { event: "agent_joined", agentId: socket.agentId },
        });

        io.to(roomName).emit("support:status", {
          sessionId: session.id,
          status: SESSION_STATUS.AGENT,
          assignedAgentId: socket.agentId,
          message: "Musteri temsilcisi gorusmeye katildi.",
        });
        io.to(roomName).emit("message:receive", systemMsg);

        await sendSessionHistory(socket, session);
        await emitQueuedSessions(io);
        await emitAgentSessions(socket);
      } catch (error) {
        console.error("agent:accept_session hatasi:", error.message);
        socket.emit("chat:error", {
          message: `Sohbet devralinamadi: ${error.message}`,
        });
      }
    });

    socket.on("agent:message_send", async ({ sessionId, text }) => {
      try {
        if (!socket.agentId || !sessionId || !text?.trim()) return;

        const session = await ChatSession.findByPk(sessionId);
        if (!session || session.assignedAgentId !== socket.agentId) {
          socket.emit("chat:error", {
            message: "Bu sohbet size atanmis degil.",
          });
          return;
        }
        if (session.status === SESSION_STATUS.CLOSED) return;

        const agentMsg = await createSupportMessage({
          sessionId: session.id,
          text: text.trim(),
          senderType: SENDER_TYPE.AGENT,
          senderId: socket.agentId,
          userId: socket.agentId,
        });

        io.to(getSessionRoom(session.id)).emit("message:receive", agentMsg);
      } catch (error) {
        console.error("agent:message_send hatasi:", error.message);
        socket.emit("chat:error", {
          message: "Temsilci mesaji gonderilemedi.",
        });
      }
    });

    socket.on("agent:open_session", async ({ sessionId }) => {
      try {
        if (!socket.agentId || !sessionId) return;

        const session = await ChatSession.findByPk(sessionId);
        if (!session || session.assignedAgentId !== socket.agentId) {
          socket.emit("chat:error", {
            message: "Bu sohbet size atanmis degil.",
          });
          return;
        }

        socket.join(getSessionRoom(session.id));
        await sendSessionHistory(socket, session);
      } catch (error) {
        console.error("agent:open_session hatasi:", error.message);
        socket.emit("chat:error", { message: "Sohbet acilamadi." });
      }
    });

    socket.on("agent:close_session", async ({ sessionId }) => {
      try {
        if (!socket.agentId || !sessionId) return;

        const session = await ChatSession.findByPk(sessionId);
        if (!session || session.assignedAgentId !== socket.agentId) {
          socket.emit("chat:error", {
            message: "Bu sohbet size atanmis degil.",
          });
          return;
        }
        if (session.status === SESSION_STATUS.CLOSED) return;

        await closeSupportSession({
          io,
          session,
          closedBy: SENDER_TYPE.AGENT,
          closedById: socket.agentId,
        });
        await emitQueuedSessions(io);
        await emitAgentSessions(socket);
      } catch (error) {
        console.error("agent:close_session hatasi:", error.message);
        socket.emit("chat:error", { message: "Gorusme sonlandirilamadi." });
      }
    });
  });
};
