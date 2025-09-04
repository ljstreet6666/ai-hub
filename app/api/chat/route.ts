// app/api/chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Avoid constructing the client at module load (build time)
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
    const { question, messages } = (await req.json()) as {
      question?: string;
      messages?: ChatMsg[];
    };

    if ((!question || typeof question !== "string") && !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Provide `question` (string) or `messages` (array)." },
        { status: 400 }
      );
    }

    const msgs: ChatMsg[] =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : [{ role: "user", content: question! }];

    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: msgs,
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ answer: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
