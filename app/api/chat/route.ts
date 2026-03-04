import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _openai: OpenAI | null = null;
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

async function callOpenAI(question: string, model = "gpt-4o-mini") {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: question || "Hello" }],
  });
  return completion.choices[0].message?.content ?? "";
}

async function callGemini(question: string, model = "gemini-1.5-flash") {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: question || "Hello" }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });

  const text = await r.text();
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${text}`);

  const data = JSON.parse(text);
  const answer =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  return answer;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Your frontend sends: { question, provider, model }
    const question: string = body?.question ?? "Hello";
    const provider: string = body?.provider ?? "openai";
    const model: string | undefined = body?.model;

    let answer = "";

    if (provider === "openai") {
      answer = await callOpenAI(question, model || "gpt-4o-mini");
    } else if (provider === "gemini") {
      answer = await callGemini(question, model || "gemini-1.5-flash");
    } else {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ answer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
