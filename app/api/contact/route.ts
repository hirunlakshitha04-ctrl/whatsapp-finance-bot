import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Escapes the 5 HTML-significant characters so user-supplied text can't
// inject markup/links into the HTML email body sent to the support inbox.
// (The plain-text `text` version below never needed this — only `html` did.)
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are all required." },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(String(name));
    const safeEmail = escapeHtml(String(email));
    const safeMessage = escapeHtml(String(message));

    // Transporter using Namecheap Private Email SMTP.
    // Reads credentials from environment variables — never hardcode these.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g. mail.privateemail.com
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER, // support@brofinai.com
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"BroFInAi Contact Form" <${process.env.SMTP_USER}>`,
      to: "support@brofinai.com",
      replyTo: email, // so hitting "Reply" in the inbox goes straight to the visitor
      subject: `New contact form message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>New message from the BroFInAi contact form</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form email error:", err);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again." },
      { status: 500 }
    );
  }
}