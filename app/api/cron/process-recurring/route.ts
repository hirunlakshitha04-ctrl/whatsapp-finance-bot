import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import twilio from "twilio";
import axios from "axios";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const WHATSAPP_FROM = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+94764775963";
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

function addFrequency(dateString: string, frequency: "daily" | "weekly" | "monthly"): string {
  const d = new Date(`${dateString}T12:00:00`);
  if (frequency === "daily") d.setDate(d.getDate() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else {
    const originalDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, lastDay));
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function notify(user: any, message: string) {
  try {
    if (user.active_channel === "telegram" && user.telegram_chat_id && TELEGRAM_TOKEN) {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: user.telegram_chat_id, text: message });
    } else if (user.phone_number) {
      await twilioClient.messages.create({ from: WHATSAPP_FROM, to: `whatsapp:${user.phone_number}`, body: message });
    }
  } catch {
    console.error("Recurring notification failed");
  }
}

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("Unauthorized", { status: 401 });
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const { data: dueRows, error } = await supabaseAdmin.from("recurring_expenses").select("*").eq("active", true).lte("next_due_date", todayStr).order("next_due_date", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let processed = 0;
    for (const recurring of dueRows || []) {
      const { data: user } = await supabaseAdmin.from("users").select("*").eq("id", recurring.user_id).maybeSingle();
      if (!user) continue;
      let due = recurring.next_due_date as string;
      let safety = 0;
      while (due <= todayStr && safety < 370) {
        const { data: occurrenceProcessed, error: processError } = await supabaseAdmin.rpc("process_due_recurring_expense", {
          p_id: recurring.id,
          p_today: todayStr,
        });
        if (processError || occurrenceProcessed !== true) break;
        processed++;
        const { data: fresh } = await supabaseAdmin.from("recurring_expenses").select("next_due_date").eq("id", recurring.id).maybeSingle();
        if (!fresh?.next_due_date) break;
        due = fresh.next_due_date;
        safety++;
      }
      if (safety > 0) {
        await supabaseAdmin.from("recurring_expenses").update({ next_due_date: due, updated_at: new Date().toISOString() }).eq("id", recurring.id);
        await notify(user, `🔁 Brofinai recurring payment recorded.\n\n${recurring.item}: ${recurring.currency} ${Number(recurring.amount).toLocaleString()}\nNext: ${due}`);
      }
    }
    return NextResponse.json({ success: true, processed });
  } catch (err: any) {
    console.error("Recurring processor error", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
