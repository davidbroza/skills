---
name: remotion-infographics
description: >-
  Use when scripting, building, rendering or polishing a vertical animated
  explainer, science reel, infographic short or Remotion motion-graphics
  video (Instagram Reels, TikTok, YouTube Shorts), or when someone asks how
  to animate diagrams, formulas, charts and a voiceover with Remotion.
---

# Remotion infographics

A rough starter for vertical animated explainers in [Remotion](https://www.remotion.dev): React components in, MP4 out. One idea per reel, diagrams and formulas that move with the voice, a short worked example, an end card. This is enough to get a first cut on screen, not a finished production pipeline.

Official docs: [remotion.dev/docs](https://www.remotion.dev/docs). Prefer those when an API disagrees with anything here.

## 1. Scaffold a project

```bash
npx create-video@latest --yes --blank my-explainer
cd my-explainer
npm run dev          # Remotion Studio, live preview
```

`--blank` is a good start if you already know Remotion or an agent will write the components. The interactive `npx create-video` wizard is fine too.

Entry file is usually `src/index.ts` (`registerRoot(Root)`). Compositions live in `src/Root.tsx`.

## 2. Composition: 1080×1920, 30 fps

Reels, TikTok and Shorts are portrait. Set the composition to **1080×1920** at **30 fps**. Duration is in frames (`seconds * fps`).

```tsx
import {Composition} from 'remotion';
import {Explainer} from './Explainer';

export const Root: React.FC = () => (
  <Composition
    id="Explainer"
    component={Explainer}
    durationInFrames={30 * 60} // replace with the real sum of scene lengths
    fps={30}
    width={1080}
    height={1920}
  />
);
```

Keep a 16:9 (1920×1080) composition only if you also need landscape. Reflow the layout; don't crop a vertical frame.

## 3. Plan before you draw

- One reel = one idea, roughly 45–90 seconds.
- Write the narration first, one or two sentences per scene. Then draw what those sentences say, in time with the voice.
- A workable shape is 6–10 scenes of about 5–12 seconds each.
- Every number on screen should come from a real calculation or a cited figure, not a decorative guess. If a curve is synthetic, say so.

## 4. Scene structure

A simple four-part arc is enough:

1. **Hook** (first 1–3 s) — start on motion, not a title card. Something physical should already be happening by 1 second (a load hitting a footing, a curve starting to draw, a tank beginning to drain). The first sentence names the idea.
2. **Build-up** — introduce the pieces of the diagram and the formula, one idea per scene.
3. **Worked example** — plug in numbers and show the result on the same diagram.
4. **End card** — restate the name, one takeaway, and where to go next (site, follow, save). Hold long enough to read.

Drive the timeline with `Sequence`, or with a small scene list and the current time `t = frame / fps`:

```tsx
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Hook, Idea, Example, EndCard} from './scenes';

const fps = 30;
const scenes = [
  {id: 'hook',    dur: 6,  Comp: Hook},
  {id: 'idea',    dur: 14, Comp: Idea},
  {id: 'example', dur: 20, Comp: Example},
  {id: 'end',     dur: 8,  Comp: EndCard},
] as const;

export const Explainer: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#0f172a', color: 'white'}}>
      {scenes.map(({id, dur, Comp}) => {
        const start = from;
        from += dur * fps;
        return (
          <Sequence key={id} from={start} durationInFrames={dur * fps}>
            <Comp />
          </Sequence>
        );
      })}
      <Audio src={staticFile('vo/explainer.mp3')} />
    </AbsoluteFill>
  );
};
```

Better still: set each `dur` from the voiceover length (see below) plus a little pad, and set `durationInFrames` on the `Composition` to the total.

## 5. Animate diagrams and formulas

Use `useCurrentFrame()` and `useVideoConfig()`, then `interpolate` for linear/eased ranges and `spring` for entrances.

```tsx
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Callout: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = spring({frame, fps, config: {damping: 14}});

  return <div style={{opacity, transform: `scale(${scale})`}}>{children}</div>;
};
```

Always `clamp` interpolations unless you want values to run past the range.

**SVG charts.** Draw axes, then animate a path or bars on. A line drawing itself is just `stroke-dasharray` and `stroke-dashoffset`:

```tsx
const progress = interpolate(frame, [10, 50], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
const length = 800; // measure the path, or a close estimate

return (
  <svg viewBox="0 0 1000 1000" width="100%" height="100%">
    <path
      d={linePath}
      fill="none"
      stroke="#7DD3FC"
      strokeWidth="8"
      strokeDasharray={length}
      strokeDashoffset={length * (1 - progress)}
    />
  </svg>
);
```

Bars can grow with `interpolate` on `height`. Prefer real data in the path (`y` from the formula or a small table), not a hand-traced shape.

**Formulas.** Typeset them (italic variables, upright subscripts, normal operator spacing). Reveal term by term and colour the active term while the voice mentions it:

```tsx
const term = (start: number) =>
  interpolate(frame, [start, start + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// e.g. σ = N × γ × B  — fade each symbol in as it is named
```

Keep each scene to one short headline, a sub-line, and at most a couple of callouts. When the voice moves on, clear the old labels so they don't cover the next part of the diagram.

## 6. Voiceover and captions

Generate a voiceover with any TTS you like (for example [edge-tts](https://github.com/rany2/edge-tts) or a hosted API). One file per scene is easier to time than one long take.

```bash
# example with edge-tts; any TTS that writes mp3/wav is fine
edge-tts --text "This is effective stress, the part of the load the soil skeleton carries." \
  --write-media public/vo/01-hook.mp3

ffprobe -v error -show_entries format=duration -of csv=p=0 public/vo/01-hook.mp3
```

Put the files in `public/vo/` and play them with Remotion's `<Audio src={staticFile('vo/01-hook.mp3')} />` on that scene's `Sequence`. Scene length ≈ voice duration + a short lead-in + a little tail so the last word isn't cut off.

**Captions.** Burn a caption in the lower third (above the platform's own caption area). Show the current scene's line, or split it into phrases. A rough sync is: caption appears when the scene's audio starts, and clears when the scene ends. Word-level timing is nicer, not required for a first cut.

Write the caption into the frame; don't rely on auto-captions after upload if you care about wording and timing.

## 7. Render

Preview in Studio first (`npm run dev`), then:

```bash
npx remotion render Explainer out/explainer.mp4
npx remotion still Explainer out/poster.png --frame=30
```

A practical delivery encode is H.264, yuv420p, constant 30 fps, with `+faststart` so the file can start playing before it finishes downloading. Look at a few phone-sized stills per scene: is the text readable, is anything clipped, is the poster frame mid-animation?

## 8. Tips and pitfalls

- **Hook on motion.** If frame 0 and frame 30 look the same, the first second is a title card. Start the action immediately.
- **Name it early.** First sentence, mid-reel, and the end card should all say what this is.
- **Show what you say.** If the voice mentions a number or a term, that thing should be on screen at the same moment.
- **Safe zones.** Platform UI covers the top (username), the bottom (caption/comments) and the right edge (like/comment/share). Keep headlines, formulas and key diagram labels away from those bands, and a little inward from the edges.
- **Type size.** If you have to lean in on a phone, it's too small. Prefer fewer, larger words.
- **No wallpaper music under the voice.** Short sound effects on hits and draws are fine; a constant bed fights the narration.
- **`interpolate` without clamp** will shoot past 0–1 and look broken. Clamp unless you mean it.
- **Composition duration** must cover every sequence. If the end card is cut off, the composition is shorter than the timeline.
- **Fonts and images** should be in the project (`public/` or bundled) so a render machine doesn't depend on your laptop's font list or a remote URL.
- **Don't invent numbers.** A wrong worked example is worse than a simpler reel.

When you outgrow this, add a shared theme, reusable diagram parts, a proper caption/VO manifest, and automated checks (duration, layout, loudness). That's polish, not the starting point.
