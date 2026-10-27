import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateDialogue, type Line } from "./dialogue.ts";
import { synth } from "./tts.ts";
import { stitch } from "./stitch.ts";
import { publishEpisode, slugify } from "./publish.ts";

type Args = {
  text?: string;
  file?: string;
  output: string;
  play: boolean;
  publish?: string;
  slug?: string;
  wittyVoice: string;
  straightVoice: string;
  targetMinutes: number;
  saveScript?: string;
  show?: string;
};

function parseArgs(argv: string[]): Args {
  const a = argv.slice(2);
  const get = (flag: string) => { const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : undefined; };
  const has = (flag: string) => a.includes(flag);
  return {
    text: get("--text"),
    file: get("--file"),
    output: get("--output") ?? join(tmpdir(), `podcast-${Date.now()}.mp3`),
    play: has("--play"),
    publish: get("--publish"),
    slug: get("--slug"),
    wittyVoice: get("--witty-voice") ?? process.env.PODCAST_WITTY_VOICE_ID ?? "",
    straightVoice: get("--straight-voice") ?? process.env.PODCAST_STRAIGHT_VOICE_ID ?? "",
    targetMinutes: parseFloat(get("--target-minutes") ?? "7"),
    saveScript: get("--save-script"),
    show: get("--show"),
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
  else { console.error("usage: podcast.sh --text \"...\" | --file <path> | <stdin>"); process.exit(2); }

  if (!input.trim()) { console.error("empty input"); process.exit(2); }
  if (!args.wittyVoice || !args.straightVoice) {
    console.error("set voice IDs: --witty-voice/--straight-voice or PODCAST_WITTY_VOICE_ID/PODCAST_STRAIGHT_VOICE_ID");
    process.exit(2);
  }

  console.error(`[make-podcast] input ${input.length} chars · target ~${args.targetMinutes} min`);

  // 1. Dialogue
  const lines = await generateDialogue(input, args.targetMinutes);
  console.error(`[make-podcast] dialogue: ${lines.length} lines`);
  if (args.saveScript) {
    writeFileSync(args.saveScript, JSON.stringify({ lines }, null, 2));
    console.error(`[make-podcast] script → ${args.saveScript}`);
  }

  // 2. Per-line TTS in parallel (cap at 4 concurrent to be polite to ElevenLabs)
  const workDir = join(tmpdir(), `mkpod-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });
  const linePaths: string[] = lines.map((_, i) => join(workDir, `${String(i).padStart(3, "0")}.mp3`));

  const concurrency = 2; // ElevenLabs free tier caps at 3 concurrent — leave headroom
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= lines.length) return;
      const line = lines[i]!;
      const voice = line.speaker === "witty" ? args.wittyVoice : args.straightVoice;
      // Slight stylistic differentiation per voice
      const opts = line.speaker === "witty"
        ? { voice, stability: 0.45, similarity: 0.85, style: 0.2,  speed: 1.05 }
        : { voice, stability: 0.55, similarity: 0.85, style: 0.05, speed: 1.02 };
      console.error(`[make-podcast] ${i + 1}/${lines.length} ${line.speaker.padEnd(8)} ${line.text.slice(0, 60)}…`);
      await synth(line.text, linePaths[i]!, opts);
    }
  }));

  // 3. Stitch
  await stitch(linePaths, args.output, workDir);
  console.error(`[make-podcast] mp3 → ${args.output}`);

  // 4. Publish
  if (args.publish) {
    const desc = lines
      .filter((l) => l.speaker === "witty")
      .slice(0, 2)
      .map((l) => l.text)
      .join("\n\n")
      .slice(0, 600);
    const result = await publishEpisode({
      title: args.publish,
      slug: args.slug ?? slugify(args.publish),
      description: desc,
      audioPath: args.output,
      show: args.show,
    });
    if (result.ok) console.error(`[make-podcast] published → ${result.url}`);
    else            console.error(`[make-podcast] publish failed: ${result.error}`);
  }

  // 5. Cleanup work dir (keep silence file for next run? simpler: nuke whole dir)
  try { rmSync(workDir, { recursive: true, force: true }); } catch {}

  // 6. Play
  if (args.play) spawn("afplay", [args.output], { stdio: "inherit" });

  // Print transcript-ish summary to stdout
  for (const l of lines) {
    console.log(`${l.speaker === "witty" ? "ARIA   " : "BRIAN  "} ${l.text}`);
    console.log("");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
