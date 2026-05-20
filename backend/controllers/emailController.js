const { User } = require("../models");
const { sendEmail } = require("../services/resendService");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanText = (value = "") => String(value).trim();

const getCustomerEmails = async () => {
  const users = await User.findAll({
    where: { role: "user", notification_deals: true },
    attributes: ["email"],
  });

  return users.map((user) => user.email).filter(Boolean);
};

exports.sendAdminEmail = async (req, res, next) => {
  try {
    const { recipientMode = "selected", recipients = [], subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: 0,
        message: "E-posta konusu zorunludur.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: 0,
        message: "E-posta mesajı zorunludur.",
      });
    }

    const rawTargetEmails =
      recipientMode === "all"
        ? await getCustomerEmails()
        : Array.isArray(recipients)
          ? recipients
          : [];

    const allowedEmails = await getCustomerEmails();
    const allowedEmailSet = new Set(allowedEmails);
    const targetEmails =
      recipientMode === "all"
        ? allowedEmails
        : rawTargetEmails.filter((email) => allowedEmailSet.has(email));

    if (targetEmails.length === 0) {
      return res.status(400).json({
        success: 0,
        message:
          "Kampanya e-postasi izni olan musteri e-postasi bulunamadi.",
      });
    }

    const result = await sendEmail({
      to: targetEmails,
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.json({
      success: 1,
      data: {
        provider: result,
        recipient_count: targetEmails.length,
      },
      message: "E-posta gonderildi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.sendContactEmail = async (req, res, next) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email).toLowerCase();
    const subject = cleanText(req.body.subject);
    const message = cleanText(req.body.message);
    const businessEmail = cleanText(
      process.env.CONTACT_RECEIVER_EMAIL || "destek@patimarket.com",
    );

    if (!name) {
      return res.status(400).json({
        success: 0,
        message: "Ad soyad alani zorunludur.",
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: 0,
        message: "Gecerli bir e-posta adresi giriniz.",
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: 0,
        message: "Konu alani zorunludur.",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: 0,
        message: "Mesaj alani zorunludur.",
      });
    }

    const result = await sendEmail({
      to: businessEmail,
      replyTo: email,
      subject: `Iletisim formu: ${subject}`,
      message: [
        "Web sitesi iletisim formundan yeni mesaj geldi.",
        "",
        `Ad Soyad: ${name}`,
        `E-posta: ${email}`,
        `Konu: ${subject}`,
        "",
        "Mesaj:",
        message,
      ].join("\n"),
    });

    return res.json({
      success: 1,
      data: { provider: result },
      message: "Mesajiniz isletmeye iletildi.",
    });
  } catch (err) {
    next(err);
  }
};
