import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type DSMessage = { role: string; content: string };
type DSChoice = { message: DSMessage };
type DSResponse = { choices?: DSChoice[] };

export async function POST(req: Request) {
import { NextResponse } from "next/server";
import OpenAI from "openai";

type DSMessage = { role: string; content: string };
type DSChoice = { message: DSMessage };
type DSResponse = { choices?: DSChoice[] };

// Lazy init to avoid requiring env at build time
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey: key });
}

export async function POST(req: Request) {
  const { question, provider = "openai", model } = await req.json();

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  try {
    if (provider === "deepseek") {
      const resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "deepseek-chat",
          messages: [{ role: "user", content: question }],
          temperature: 0.3,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return NextResponse.json(
          { error: `DeepSeek error: ${errText}` },
          { status: 500 }
        );
      }

      const data: DSResponse = await resp.json();
      const answer = data.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ answer, provider: "deepseek" });
    }

    // OpenAI path
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: (model as string) || "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ answer, provider: "openai" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
