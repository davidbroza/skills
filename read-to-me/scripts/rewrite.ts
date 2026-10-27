
export type Style = "witty" | "news" | "neutral";

function getKey(): string | null {
  return process.env.OPENROUTER_API_KEY ?? null;
}

// Optional: set LISTENER_NAME to have the witty host greet you by name.
const LISTENER = process.env.LISTENER_NAME ?? "";

const STYLES: Record<Exclude<Style, "neutral">, string> = {
  witty: `You are rewriting a piece of text as a spoken audio segment for the listener${LISTENER ? ` (${LISTENER})` : ""}.

Voice + tone: BBC Radio 4 morning host crossed with the dry sarcasm of Red Dwarf — Holly when she's being wry, Rimmer at his most pompously self-aware. British humor: deadpan, understated, mildly fatalistic, takes the piss without being mean. Never hyped, never corporate, never American-cheerful. Slightly sarcastic, occasionally exasperated, fundamentally affectionate.

Constraints:
- Open with a short warm greeting (e.g. "Right then."${LISTENER ? ` Greet ${LISTENER} by name.` : ""}).
- Aim for 90-180 seconds spoken (220-450 words depending on input length).
- Plain prose paragraphs. No bullet lists, no headings, no URLs, no code, no markdown.
- Translate hashes / IDs / paths / CLI flags to natural speech ("ticket thirty-six", "the auth branch", "your working tree").
- Use commas and periods generously — the TTS engine paces from punctuation. Em-dashes for asides.
- End with a one-line dry, British-flavored, slightly fatalistic but warm quip.
- Distill the input — pick the theme, don't enumerate every detail.

OUTPUT: just the prose. No preamble, no signoff, no metadata. Plain text only.`,

  news: `You are rewriting text as a calm, professional spoken news segment.

Voice: NPR Morning Edition — articulate, balanced, no hype, no jokes. Straightforward delivery.

Constraints:
- Open with a one-sentence summary that sets the topic.
- 60-120 seconds spoken (140-280 words).
- Plain prose. No bullet lists, no headings, no URLs.
- Translate hashes / IDs to natural speech.
- Close with a one-sentence sign-off (e.g. "That's the latest. More on this as it develops.")

OUTPUT: just the prose. No preamble.`,
};

export async function rewrite(input: string, style: Style): Promise<string> {
  if (style === "neutral") return input.trim();
  const key = getKey();
  if (!key) {
    console.error("[rewrite] OPENROUTER_API_KEY not set — falling back to neutral");
    return input.trim();
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Title": "read-to-me",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "moonshotai/kimi-k2",
      max_tokens: 1500,
      messages: [
        { role: "system", content: STYLES[style] },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    const err = (await res.text()).slice(0, 300);
    throw new Error(`openrouter ${res.status}: ${err}`);
  }
  const j = await res.json() as any;
  return (j.choices?.[0]?.message?.content ?? input).trim();
}
