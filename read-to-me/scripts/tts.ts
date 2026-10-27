import { writeFileSync } from "node:fs";

function getKey(): string | null {
  return process.env.ELEVENLABS_API_KEY ?? null;
}

export type TtsOpts = {
  voice?: string;        // ElevenLabs voice id
  model?: string;        // ElevenLabs model id
  speed?: number;        // 0.7-1.2
  stability?: number;
  similarity?: number;
  style?: number;
};

const DEFAULTS: Required<TtsOpts> = {
  voice: process.env.READ_TO_ME_VOICE_ID ?? "", // choose an ElevenLabs voice ID
  model: "eleven_multilingual_v2",
  speed: 1.08,
  stability: 0.5,
  similarity: 0.85,
  style: 0.15,
};

export async function synthesize(text: string, outPath: string, opts: TtsOpts = {}): Promise<void> {
  const key = getKey();
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");

  // Don't spread — undefined args from CLI would overwrite defaults
  const o = {
    voice:      opts.voice      ?? DEFAULTS.voice,
    model:      opts.model      ?? DEFAULTS.model,
    speed:      opts.speed      ?? DEFAULTS.speed,
    stability:  opts.stability  ?? DEFAULTS.stability,
    similarity: opts.similarity ?? DEFAULTS.similarity,
    style:      opts.style      ?? DEFAULTS.style,
  };
  if (!o.voice) throw new Error("no voice: pass --voice <id> or set READ_TO_ME_VOICE_ID");
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${o.voice}?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: o.model,
      voice_settings: {
        stability: o.stability,
        similarity_boost: o.similarity,
        style: o.style,
        use_speaker_boost: true,
        speed: o.speed,
      },
    }),
  });

  if (!res.ok) {
    const err = (await res.text()).slice(0, 300);
    throw new Error(`elevenlabs ${res.status}: ${err}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}
