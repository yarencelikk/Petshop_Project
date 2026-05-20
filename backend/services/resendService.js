const RESEND_EMAILS_URL = "https://api.resend.com/emails";

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const textToHtml = (text = "") => {
  return escapeHtml(text)
    .split(/\r?\n/)
    .map((line) => (line ? `<p>${line}</p>` : "<br />"))
    .join("");
};

const sendEmail = async ({ to, subject, message, replyTo }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY tanimli degil.");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL tanimli degil.");
  }

  const recipients = Array.isArray(to) ? to : [to];
  const cleanRecipients = recipients
    .map((email) => String(email || "").trim())
    .filter(Boolean);

  if (cleanRecipients.length === 0) {
    throw new Error("Gecerli alici e-posta adresi bulunamadi.");
  }

  const payload = {
    from,
    to: cleanRecipients,
    subject,
    text: message,
    html: textToHtml(message),
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error?.message ||
      "Resend e-posta gonderimini reddetti.";
    throw new Error(errorMessage);
  }

  return data;
};

module.exports = { sendEmail };
