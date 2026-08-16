import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Send a plain text message (Telegram uses Markdown, close enough to the
// WhatsApp-style *bold* templates already in finance-logic.ts — Telegram
// accepts *bold* under legacy "Markdown" parse mode, so templates are reused as-is)
export async function sendTelegramMessage(chatId: string | number, text: string): Promise<void> {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("❌ Telegram Send Error:", err);
  }
}

// Telegram media (photos/voice) arrive as a file_id — this resolves it to a
// downloadable buffer in two steps: getFile (→ file_path) then a direct GET.
export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const fileInfo = await axios.get(`${TELEGRAM_API}/getFile`, {
      params: { file_id: fileId },
    });

    const filePath = fileInfo.data?.result?.file_path;
    if (!filePath) return null;

    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const response = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 15000 });

    // Telegram doesn't return a content-type header reliably for file downloads —
    // infer from the file extension in file_path instead.
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      ext === "png" ? "image/png" :
      ext === "oga" || ext === "ogg" ? "audio/ogg" :
      "application/octet-stream";

    return { buffer: Buffer.from(response.data), contentType };
  } catch (err) {
    console.error("❌ Telegram File Download Error:", err);
    return null;
  }
}