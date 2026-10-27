import { writeFileSync } from "node:fs";

function getKey(): string | null {
  return process.env.ELEVENLABS_API_KEY ?? null;
}

export type LineTtsOpts = {
  voice: string;
  speed?: number;
  stability?: number;
  similarity?: number;
  style?: number;
  model?: string;
};

export async function synth(text: string, outPath: string, opts: LineTtsOpts): Promise<void> {
  const key = getKey();
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${opts.voice}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: opts.model ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: opts.stability ?? 0.5,
        similarity_boost: opts.similarity ?? 0.85,
        style: opts.style ?? 0.15,
        use_speaker_boost: true,
        speed: opts.speed ?? 1.05,
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
