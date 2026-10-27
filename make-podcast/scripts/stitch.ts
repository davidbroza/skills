import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => err += d.toString());
    p.on("close", (c) => c === 0 ? resolve() : reject(new Error(err.slice(-400) || `${cmd} exit ${c}`)));
    p.on("error", reject);
  });
}

const SR = 44100;
const PAUSE_S = 0.48; // breath between speakers — was 0.35, sounded clipped

/**
 * Stitch via WAV intermediate to avoid MP3 frame-boundary clicks.
 * Each line MP3 → WAV (with tiny fade in/out). Combined WAVs + silence WAVs → final MP3.
 */
export async function stitch(lineMp3s: string[], outPath: string, workDir: string): Promise<void> {
  if (!lineMp3s.length) throw new Error("no lines to stitch");

  // 1. Decode each line MP3 to mono WAV at fixed sample rate.
  // No fade filters — afade=t=out without an explicit st= near the duration
  // will start the fade at t=0 and silence the entire remainder. The 480ms
  // inter-line silence is plenty to mask boundary clicks.
  const lineWavs: string[] = [];
  for (let i = 0; i < lineMp3s.length; i++) {
    const wav = join(workDir, `line-${String(i).padStart(3, "0")}.wav`);
    await run("ffmpeg", [
      "-y",
      "-i", lineMp3s[i]!,
      "-af", `aresample=${SR},aformat=channel_layouts=mono`,
      "-ar", String(SR),
      "-ac", "1",
      "-c:a", "pcm_s16le",
      wav,
    ]);
    lineWavs.push(wav);
  }

  // 2. Silence WAV (PCM, exact sample rate match)
  const silenceWav = join(workDir, "_silence.wav");
  await run("ffmpeg", [
    "-y",
    "-f", "lavfi",
    "-i", `anullsrc=r=${SR}:cl=mono`,
    "-t", String(PAUSE_S),
    "-c:a", "pcm_s16le",
    silenceWav,
  ]);

  // 3. Concat list — alternating line, silence, line, silence, … line
  const listPath = join(workDir, "concat-wav.txt");
  const items: string[] = [];
  for (let i = 0; i < lineWavs.length; i++) {
    items.push(`file '${lineWavs[i]}'`);
    if (i < lineWavs.length - 1) items.push(`file '${silenceWav}'`);
  }
  writeFileSync(listPath, items.join("\n"));
  const combinedWav = join(workDir, "_combined.wav");
  await run("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listPath,
    "-c:a", "pcm_s16le",
    combinedWav,
  ]);

  // 4. Final encode to STEREO MP3 — mono is technically valid but trips up
  // browsers + Apple Podcasts in subtle ways (silent playback, "can't be
  // played"). Pan-replicate mono to both channels and ship 160k stereo.
  await run("ffmpeg", [
    "-y",
    "-i", combinedWav,
    "-codec:a", "libmp3lame",
    "-b:a", "160k",
    "-ar", String(SR),
    "-ac", "2",
    "-write_xing", "1",
    outPath,
  ]);
}
