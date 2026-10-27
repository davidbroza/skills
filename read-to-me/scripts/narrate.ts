import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rewrite, type Style } from "./rewrite.ts";
import { synthesize } from "./tts.ts";
import { publishEpisode, slugify } from "./publish.ts";

type Args = {
  text?: string;
  file?: string;
  style: Style;
  voice?: string;
  speed?: number;
  model?: string;
  output: string;
  play: boolean;
  publish?: string;
  slug?: string;
  show?: string;
  noRewrite: boolean;
};

function parseArgs(argv: string[]): Args {
  const a = argv.slice(2);
  const get = (flag: string) => { const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : undefined; };
  const has = (flag: string) => a.includes(flag);

  let style: Style = "witty"; // default
  if (has("--news")) style = "news";
  else if (has("--neutral")) style = "neutral";
  else if (has("--witty")) style = "witty";

  return {
    text: get("--text"),
    file: get("--file"),
    style,
    voice: get("--voice"),
    speed: get("--speed") ? parseFloat(get("--speed")!) : undefined,
    model: get("--model"),
    output: get("--output") ?? join(tmpdir(), `read-${Date.now()}.mp3`),
    play: has("--play"),
    publish: get("--publish"),
    slug: get("--slug"),
    show: get("--show"),
    noRewrite: has("--no-rewrite"),
  };
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Uint8Array);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const args = parseArgs(Bun.argv);

  let input = "";
  if (args.text) input = args.text;
  else if (args.file) input = readFileSync(args.file, "utf8");
  else if (!process.stdin.isTTY) input = await readStdin();
  else { console.error("usage: narrate.sh --text \"...\" | --file <path> | <stdin>"); process.exit(2); }

  if (!input.trim()) { console.error("empty input"); process.exit(2); }

  const effectiveStyle: Style = args.noRewrite ? "neutral" : args.style;
  console.error(`[read-to-me] ${effectiveStyle} · ${input.length} chars in`);

  const script = await rewrite(input, effectiveStyle);
  console.error(`[read-to-me] script ${script.length} chars`);

  await synthesize(script, args.output, {
    voice: args.voice,
    model: args.model,
    speed: args.speed,
  });
  console.error(`[read-to-me] mp3 → ${args.output}`);

  if (args.publish) {
    const result = await publishEpisode({
      title: args.publish,
      slug: args.slug ?? slugify(args.publish),
      description: script.slice(0, 600),
      audioPath: args.output,
      show: args.show,
    });
    if (result.ok) console.error(`[read-to-me] published → ${result.url}`);
    else            console.error(`[read-to-me] publish failed: ${result.error}`);
  }

  if (args.play) {
    spawn("afplay", [args.output], { stdio: "inherit" });
  }

  // Also print the script to stdout for piping / inspection
  console.log(script);
}

main().catch((e) => { console.error(e); process.exit(1); });
