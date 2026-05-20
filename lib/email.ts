import nodemailer from "nodemailer";

type EmailPayload = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

const SMTP_PLACEHOLDERS = [
  "your-sender@gmail.com",
  "your-16-char-app-password",
] as const;

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
}

function isPlaceholderValue(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return SMTP_PLACEHOLDERS.some((placeholder) =>
    normalizedValue.includes(placeholder)
  );
}

function getSmtpErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

function getEmailConfig() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "465", 10);
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER?.trim().toLowerCase() || "";
  const pass = process.env.SMTP_PASS?.trim() || "";
  const from = process.env.SMTP_FROM?.trim().toLowerCase() || user;
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "Burger";

  if (
    !user ||
    !pass ||
    !from ||
    isPlaceholderValue(user) ||
    isPlaceholderValue(pass) ||
    isPlaceholderValue(from)
  ) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  return {
    from,
    fromName,
    host,
    pass,
    port,
    secure,
    user,
  };
}

export async function sendEmail(payload: EmailPayload) {
  const config = getEmailConfig();
  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.pass,
      user: config.user,
    },
    host: config.host,
    port: config.port,
    secure: config.secure,
  });

  try {
    await transporter.sendMail({
      from: `${config.fromName} <${config.from}>`,
      html: payload.html,
      subject: payload.subject,
      text: payload.text,
      to: payload.to,
    });
  } catch (error) {
    const code = getSmtpErrorCode(error);

    if (code === "EAUTH") {
      throw new Error("SMTP_AUTH_FAILED");
    }

    if (code === "ESOCKET" || code === "ECONNECTION" || code === "ETIMEDOUT") {
      throw new Error("SMTP_CONNECTION_FAILED");
    }

    throw error;
  }
}

export async function sendRegistrationVerificationEmail(
  email: string,
  code: string
) {
  const subject = "Burger бүртгэлийн баталгаажуулах код";
  const text = [
    "Сайн байна уу,",
    "",
    `Таны бүртгэлийг баталгаажуулах код: ${code}`,
    "Энэ код 10 минутын хугацаанд хүчинтэй.",
    "",
    "Хэрэв та энэ үйлдлийг хийгээгүй бол энэ и-мэйлийг үл тооно уу.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">Burger бүртгэлийн баталгаажуулалт</h2>
      <p>Сайн байна уу,</p>
      <p>Таны бүртгэлийг баталгаажуулах код:</p>
      <div style="margin: 16px 0; font-size: 32px; font-weight: 700; letter-spacing: 6px;">
        ${code}
      </div>
      <p>Энэ код <strong>10 минутын хугацаанд</strong> хүчинтэй.</p>
      <p>Хэрэв та энэ үйлдлийг хийгээгүй бол энэ и-мэйлийг үл тооно уу.</p>
    </div>
  `;

  await sendEmail({
    html,
    subject,
    text,
    to: email,
  });
}
