# Python Reboot — CLAUDE.md

## Project Overview

A gamified Python re-learning app for someone who knew Python well but hasn't touched it in a while. The goal is syntax refresher first, then idiomatic/best-practice Python second. It is **not** a beginner course — explanations assume the user understands programming concepts and just needs the Python-specific syntax and idioms.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Grading:** Anthropic API via internal `/api/grade` route
- **Hosting:** Vercel

## Project Structure

```
src/
  app/
    page.tsx          # Main game component ("use client")
    api/
      grade/
        route.ts      # Server-side Anthropic API proxy
  types.ts            # Shared TypeScript interfaces (Exercise, GradeResult, etc.)
```

## Models

Update all model references to the latest available:
- Grading calls in `route.ts`: use `claude-opus-4-5` for best grading quality, or `claude-sonnet-4-5` for faster/cheaper grading
- Check `https://docs.anthropic.com/en/docs/about-claude/models` for the current model string before changing

## Game Architecture

### Core Loop
1. User clears all **lessons** in a module (each lesson has 3 exercises)
2. **Boss battle** unlocks for that module (3 escalating rounds)
3. Defeating the boss awards XP + streak bonus
4. Enough XP triggers a **level-up screen**

### XP & Levels
- `XP_PER_EXERCISE = 50` — awarded once per exercise (not on retry)
- `XP_PER_BOSS = 150` — awarded once per boss defeat
- 5 levels: Script Kiddie → Loop Wrangler → Function Forger → Dict Whisperer → Pythonista
- Level thresholds defined in `LEVELS` array in `page.tsx`

### Exercise Types
Three types per lesson, graded by Claude via `/api/grade`:
- `output` — predict what the code prints
- `bugfix` — fix broken code
- `scratch` — write code from a prompt

### Grading Flow
1. `gradeWithClaude(exercise, userAnswer)` in `page.tsx` POSTs `{ prompt }` to `/api/grade`
2. `route.ts` attaches `ANTHROPIC_API_KEY` from env and forwards to Anthropic
3. Response is parsed as `{ correct: boolean, feedback: string }`
4. Grading is intentionally lenient — equivalent correct approaches should pass

## Key Data Structures

```typescript
interface Exercise {
  type: "output" | "bugfix" | "scratch";
  prompt: string;       // shown to user
  answer: string;       // reference answer sent to Claude for grading
  hint: string;         // revealed on demand
  label: string;
}

interface Lesson {
  id: string;
  title: string;
  theory: string;       // markdown-ish string rendered by TheoryRenderer
  exercises: Exercise[];
}

interface Module {
  id: string;
  title: string;
  icon: string;
  color: string;        // Tailwind gradient classes
  description: string;
  lessons: Lesson[];
}
```

Boss challenges live in a separate `BOSSES` record keyed by module ID, each with `name`, `icon`, `color`, `border`, `intro`, and `rounds: Exercise[]`.

## Current Modules

| ID | Title | Boss |
|----|-------|------|
| `foundations` | Syntax Refresher | The Indentation Lich 💀 |
| `pythonic` | Pythonic Code | The Verbose Vampire 🧛 |
| `functions-adv` | Functions Done Right | The Bug Witch 🧙‍♀️ |

## Suggested Improvements

The following were identified but not yet implemented:

- [ ] **More modules** — good candidates: error handling & exceptions, decorators, comprehensions (dict/set), `pathlib` & file I/O, `dataclasses` deep dive, async/await basics
- [ ] **Persistent progress** — currently all progress is in React state and resets on refresh; add `localStorage` or a lightweight backend (e.g. Vercel KV or Supabase)
- [ ] **Daily streak system** — track last active date, reset streak if a day is missed
- [ ] **Harder difficulty toggle** — boss rounds could use a "no hints" hard mode
- [ ] **Mobile polish** — textarea UX on mobile needs work (virtual keyboard pushes layout)
- [ ] **Syntax highlighting** — replace `<pre>` blocks with a lightweight highlighter like `shiki` or `prism-react-renderer`
- [ ] **Streaming grading feedback** — use Anthropic streaming so feedback appears word by word rather than after a delay

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
```

Set in Vercel project settings under Environment Variables. Never commit to the repo.

## Commands

```bash
npm run dev      # local dev server on :3000
npm run build    # production build
npm run lint     # eslint
```

## Notes for Claude Code

- `TheoryRenderer` is a simple inline component that splits on triple-backtick blocks and renders code in `<pre>` and prose with bold/inline-code substitution via `dangerouslySetInnerHTML`. It is not a full markdown parser — keep theory strings to this subset.
- Progress state shape: `{ [moduleId]: { exercises: { [lessonId-exIdx]: boolean }, bossDefeated: boolean } }`
- The `"use client"` directive must remain at the top of `page.tsx` — the entire game is client-side.
- `/api/grade/route.ts` must remain a Server Component (no `"use client"`) so the API key stays server-side.