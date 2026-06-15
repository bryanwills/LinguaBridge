import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-4o-mini";

type TranslateBody = {
  text?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

/**
 * Translates a short caption from sourceLanguage to targetLanguage using the
 * configured OpenAI model. Auth-gated so only signed-in users can spend tokens.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Translation is not configured." },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: TranslateBody;
  try {
    body = (await request.json()) as TranslateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = body.text?.trim();
  const targetLanguage = body.targetLanguage;
  const sourceLanguage = body.sourceLanguage ?? "auto";
  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: "text and targetLanguage are required." },
      { status: 400 },
    );
  }

  // Same-language: skip the model call entirely.
  if (sourceLanguage.split("-")[0] === targetLanguage.split("-")[0]) {
    return NextResponse.json({ translated: text, skipped: true });
  }

  const model = process.env.OPENAI_TRANSLATION_MODEL || DEFAULT_MODEL;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a real-time speech translator. Translate the user's text " +
              `from ${sourceLanguage} into ${targetLanguage}. Reply with ONLY the ` +
              "translation, no quotes, no notes. Preserve meaning and tone for natural conversation.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Translation provider error (${res.status}).`, detail },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const translated = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ translated });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Translation request failed.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
