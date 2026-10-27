import { readFileSync } from "node:fs";

// Your own episode-ingest endpoint (e.g. a Worker that stores the MP3 and updates an RSS feed).
const INGEST_URL = process.env.PODCAST_INGEST_URL;

function getSecret(): string | null {
  return process.env.PODCAST_INGEST_SECRET ?? null;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function publishEpisode(opts: {
  title: string;
  slug?: string;
  description?: string;
  audioPath: string;
  show?: string;
}) {
  const secret = getSecret();
  if (!INGEST_URL) return { ok: false, error: "PODCAST_INGEST_URL is not set" };
  if (!secret) return { ok: false, error: "PODCAST_INGEST_SECRET is not set" };
  const slug = opts.slug ?? slugify(opts.title);
  const fd = new FormData();
  fd.append("title", opts.title);
  fd.append("slug", slug);
  fd.append("description", opts.description ?? "");
  fd.append("pub_date", new Date().toISOString());
  if (opts.show) fd.append("show", opts.show);
  const buf = readFileSync(opts.audioPath);
  fd.append("audio", new Blob([buf], { type: "audio/mpeg" }), `${slug}.mp3`);

  try {
    const res = await fetch(INGEST_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      body: fd,
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${(await res.text()).slice(0, 200)}` };
    const j = await res.json() as any;
    return { ok: true, url: j.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
