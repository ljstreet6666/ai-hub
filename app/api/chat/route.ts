import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _client: OpenAI | null = null;
function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const msgs: ChatMsg[] = [{ role: "user", content: question ?? "Hello" }];

    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: msgs,
    });

    return NextResponse.json({ answer: completion.choices[0].message?.content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
