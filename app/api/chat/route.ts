// app/api/chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Run on Node (safer for OpenAI SDK than Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: msgs,
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ answer: text });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
