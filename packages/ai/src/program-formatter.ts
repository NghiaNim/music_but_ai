import OpenAI from "openai";

/**
 * Uses GPT-4o-mini to format a raw scraped program string into a clean,
 * readable plain-text list (one work per line). Returns null on error so
 * callers can fall back to the raw text without failing.
 */
export async function formatConcertProgram(
  apiKey: string,
  rawProgram: string,
): Promise<string | null> {
  if (!rawProgram.trim() || rawProgram.length < 10) return null;

  const openai = new OpenAI({ apiKey });

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You format classical concert program text. The input may be garbled " +
            "(no line breaks between pieces, all-caps composer names run together). " +
            "Output clean plain text with one work per line in the format: " +
            "'Composer Name — Work Title'. Preserve every work listed. " +
            "No markdown, no bullet points, no extra commentary.",
        },
        { role: "user", content: rawProgram },
      ],
      max_tokens: 400,
      temperature: 0,
    });

    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
