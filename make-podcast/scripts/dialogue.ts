import { writeFileSync } from "node:fs";

export type Line = { speaker: "witty" | "straight"; text: string };

function getKey(): string | null {
  return process.env.OPENROUTER_API_KEY ?? null;
}

const SYSTEM = (targetMin: number) => `You are writing a two-host podcast dialogue between Aria (witty British host) and Brian (earnest American journalist).

Aria — WITTY:
- British host. Dry sarcasm, BBC Radio 4 × Red Dwarf register — Holly when wry, Rimmer when self-aware. Deadpan, understated, mildly fatalistic, takes the piss without being mean. She knows the topic; she's explaining what was actually built and why.

Brian — STRAIGHT:
- American journalist co-host. News-anchor cadence. Earnest. Curious. Asks the obvious clarifying question. Never picks up Aria's sarcasm — when she says something biting, he responds as if it were a plain statement of fact, occasionally even agreeing in a way that compounds the joke. He's the straight man.

Format: alternating lines, one per line, prefixed with WITTY: or STRAIGHT:. Example:

STRAIGHT: Welcome back to the show. Today we're talking about X.
WITTY: Yes Brian, X — which is the thing nobody asked for but everyone secretly needs.
STRAIGHT: So how does it actually work?
WITTY: …

Constraints:
- Aim for ~${targetMin} minutes spoken total. At ~150 wpm that's ${Math.round(targetMin * 150)} words across all lines.
- 16 to 30 exchanges. Never two consecutive lines from the same speaker.
- Brian opens with a brief intro / question. Aria does most of the explaining. Brian asks follow-ups. Closes with a sign-off — Brian thanks Aria, Aria fires a dry one-liner.
- Each line is ONE paragraph of natural spoken prose on a single physical line. Plain text, no markdown, no URLs read aloud, no hashes, no code symbols. Translate any of those to natural speech.
- Keep individual lines reasonable — usually 30-90 spoken words. Brian's questions tend to be shorter (10-30 words).
- Use the actual content / facts the user provides. Don't invent technology or features that aren't in the source.
- The contrast is the joke. Don't write Brian as also-witty; he's earnest and a bit literal.

OUTPUT: just the dialogue lines. No prose preamble, no markdown fences, no commentary, no summary. Start with STRAIGHT: or WITTY:.`;

const MODEL = process.env.OPENROUTER_MODEL ?? "moonshotai/kimi-k2";

export async function generateDialogue(input: string, targetMin: number): Promise<Line[]> {
  const key = getKey();
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Title": "make-podcast",
    },
    body: JSON.stringify({
      model: MODEL,
      // Plain-text format saves ~30% tokens vs JSON wrapper — lets a 17-min
      // brief fit inside Kimi's per-response ceiling.
      max_tokens: Math.min(7800, Math.max(4000, Math.ceil(targetMin * 400))),
      messages: [
        { role: "system", content: SYSTEM(targetMin) },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    const err = (await res.text()).slice(0, 400);
    throw new Error(`openrouter ${res.status}: ${err}`);
  }
  const j = await res.json() as any;
  const text: string = j.choices?.[0]?.message?.content ?? "";
  const lines = parseLabeledTranscript(text);
  if (lines.length === 0) {
    writeFileSync("/tmp/dialogue-debug.txt", text);
    throw new Error("dialogue parse: no WITTY/STRAIGHT lines found (raw → /tmp/dialogue-debug.txt)");
  }
  return lines;
}

// Parse alternating WITTY: / STRAIGHT: lines into the structured format the
// rest of the pipeline expects. Tolerant of: extra blank lines, lines that
// wrap across multiple physical lines (continuation lines are appended to
// the previous speaker), markdown fences, leading prose preamble.
function parseLabeledTranscript(raw: string): Line[] {
  const cleaned = raw
    .replace(/^```(?:[a-z]+)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const out: Line[] = [];
  let current: Line | null = null;

  for (const physical of cleaned.split(/\r?\n/)) {
    const line = physical.trim();
    if (!line) {
      if (current && current.text) { out.push(current); current = null; }
      continue;
    }
    const m = line.match(/^(WITTY|STRAIGHT|ARIA|BRIAN)\s*[:\-—]\s*(.*)$/i);
    if (m) {
      if (current && current.text) out.push(current);
      const speakerWord = m[1]!.toUpperCase();
      const speaker: Line["speaker"] =
        speakerWord === "WITTY" || speakerWord === "ARIA" ? "witty" : "straight";
      current = { speaker, text: m[2]!.trim() };
    } else if (current) {
      current.text = (current.text + " " + line).trim();
    }
  }
  if (current && current.text) out.push(current);
  return out;
}
