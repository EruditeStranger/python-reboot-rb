import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { topics } = await req.json();

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json({ error: "No topics provided" }, { status: 400 });
  }

  const prompt = `You are generating Python drill exercises for a Training Arena in an RPG-style coding game.
The player has completed lessons on these topics: ${topics.join(", ")}.

Generate exactly 5 exercises as a JSON array. Mix exercise types and topics across the 5 exercises.
Each exercise object must have these exact fields:
- "type": one of "output", "bugfix", or "scratch"
- "prompt": the exercise text with light RPG flavor (dungeon scrolls, goblin code, enchanted functions, arena challenges — keep it fun but brief)
- "answer": the correct reference answer
- "hint": a short hint without giving away the answer

Rules:
- For "output" type: show Python code and ask what it prints. "answer" is the exact printed output.
- For "bugfix" type: show buggy Python code. "answer" is the corrected code.
- For "scratch" type: describe what to write. "answer" is a clean reference solution.
- Include at least 2 different topics and at least 2 different exercise types.
- Difficulty: intermediate — not trivial, but not obscure edge cases.
- Keep prompts concise (under 10 lines of code).

Reply ONLY with the JSON array. No markdown fences, no explanation, no extra text.`;

  const generate = async (): Promise<Response> => {
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await generate();
      const data = await res.json();
      const raw: string = data?.content?.[0]?.text ?? "";
      const clean = raw.replace(/```json\n?|```/g, "").trim();
      const exercises = JSON.parse(clean);

      if (!Array.isArray(exercises) || exercises.length !== 5) {
        throw new Error("Expected array of 5 exercises");
      }

      return NextResponse.json(exercises);
    } catch (e) {
      if (attempt === 1) {
        return NextResponse.json(
          { error: "Failed to generate exercises — please try again." },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
