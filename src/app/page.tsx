"use client";

import { useState, useRef, useEffect } from "react";

const XP_PER_EXERCISE = 50;
const XP_PER_BOSS = 150;
const LEVELS = [
  { level: 1, title: "Script Kiddie",     xpNeeded: 0,    icon: "🥚" },
  { level: 2, title: "Loop Wrangler",     xpNeeded: 200,  icon: "🐣" },
  { level: 3, title: "Function Forger",   xpNeeded: 500,  icon: "🐍" },
  { level: 4, title: "Dict Whisperer",    xpNeeded: 900,  icon: "⚗️" },
  { level: 5, title: "Pythonista",        xpNeeded: 1400, icon: "🧙" },
];

const getCurrentLevel = (xp: number) => {
  let cur = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.xpNeeded) cur = l; }
  return cur;
};
const getNextLevel = (xp: number) => {
  for (const l of LEVELS) { if (xp < l.xpNeeded) return l; }
  return null;
};

// ─── BOSS CHALLENGES ────────────────────────────────────────────────────────
const BOSSES: Record<string, { name: string; icon: string; color: string; border: string; intro: string; rounds: Exercise[] }> = {
  foundations: {
    name: "The Indentation Lich",
    icon: "💀",
    color: "from-rose-900 to-red-950",
    border: "border-rose-700",
    intro: "You dare enter my dungeon? My code is a labyrinth of missing colons and off-by-one errors. Only a true Pythonista can defeat me.",
    rounds: [
      {
        type: "bugfix",
        prompt: "Round 1/3 — Fix ALL bugs in this code. It should print the sum of even numbers from 0 to 10.\n\nTotal = 0\nfor i in range(0 11):\n    if i % 2 = 0\n        total =+ i\nprint(Total)",
        answer: "total = 0\nfor i in range(0, 11):\n    if i % 2 == 0:\n        total += i\nprint(total)",
        hint: "5 bugs: variable name case, missing comma in range, = vs ==, missing colon, =+ vs +="
      },
      {
        type: "scratch",
        prompt: "Round 2/3 — Write a function called fizzbuzz(n) that returns 'Fizz' if n is divisible by 3, 'Buzz' if divisible by 5, 'FizzBuzz' if both, otherwise the number as a string.",
        answer: "def fizzbuzz(n):\n    if n % 3 == 0 and n % 5 == 0:\n        return 'FizzBuzz'\n    elif n % 3 == 0:\n        return 'Fizz'\n    elif n % 5 == 0:\n        return 'Buzz'\n    else:\n        return str(n)",
        hint: "Check the combined case (FizzBuzz) first, before the individual checks."
      },
      {
        type: "output",
        prompt: "Round 3/3 — Final strike. What does this print?\n\ndef mystery(items):\n    result = {}\n    for i, item in enumerate(items):\n        result[item] = i\n    return result\n\nprint(mystery(['a', 'b', 'a']))",
        answer: "{'a': 2, 'b': 1}",
        hint: "enumerate gives (index, value). When 'a' appears twice, the second index overwrites the first."
      }
    ]
  },
  pythonic: {
    name: "The Verbose Vampire",
    icon: "🧛",
    color: "from-emerald-900 to-teal-950",
    border: "border-emerald-700",
    intro: "I feast on bloated, un-Pythonic code. Ten lines where one would do. Can you rewrite my monstrosities into elegant Python?",
    rounds: [
      {
        type: "scratch",
        prompt: "Round 1/3 — Rewrite this as a single list comprehension.\n\nnumbers = [1,2,3,4,5,6,7,8,9,10]\nresult = []\nfor n in numbers:\n    if n % 2 == 0:\n        result.append(n ** 2)",
        answer: "result = [n**2 for n in numbers if n % 2 == 0]",
        hint: "Pattern: [expression for item in iterable if condition]"
      },
      {
        type: "bugfix",
        prompt: "Round 2/3 — This unpacking is unnecessarily verbose. Rewrite lines 2-4 as a single unpacking line.\n\ncoords = (51.5, -0.12, 11)\nlat = coords[0]\nlon = coords[1]\nalt = coords[2]",
        answer: "coords = (51.5, -0.12, 11)\nlat, lon, alt = coords",
        hint: "Three variables on the left, tuple on the right."
      },
      {
        type: "output",
        prompt: "Round 3/3 — What does this print?\n\ndata = [('alice', 90), ('bob', 75), ('carol', 88)]\nbest = max(data, key=lambda x: x[1])\nprint(best[0])",
        answer: "alice",
        hint: "max() with a key finds the tuple with the highest second element. Then [0] gets the name."
      }
    ]
  },
  "functions-adv": {
    name: "The Bug Witch",
    icon: "🧙‍♀️",
    color: "from-blue-900 to-indigo-950",
    border: "border-blue-700",
    intro: "My functions are cursed — missing type hints, mutable defaults, and side effects lurking in every corner. Break the curse if you can.",
    rounds: [
      {
        type: "bugfix",
        prompt: "Round 1/3 — Add correct type hints and fix the mutable default arg trap.\n\ndef register(name, tags=[]):\n    tags.append(name)\n    return tags",
        answer: "def register(name: str, tags: list[str] | None = None) -> list[str]:\n    if tags is None:\n        tags = []\n    tags.append(name)\n    return tags",
        hint: "Replace [] with None, guard inside the function, and annotate all params and return."
      },
      {
        type: "scratch",
        prompt: "Round 2/3 — Write a type-annotated function min_max(numbers) that returns both the minimum and maximum of a list of floats as a tuple.",
        answer: "def min_max(numbers: list[float]) -> tuple[float, float]:\n    return min(numbers), max(numbers)",
        hint: "Return type is tuple[float, float]. Python packs two return values into a tuple automatically."
      },
      {
        type: "output",
        prompt: "Round 3/3 — What prints? Think carefully about scope.\n\nx = 'global'\n\ndef outer():\n    x = 'outer'\n    def inner():\n        print(x)\n    inner()\n\nouter()\nprint(x)",
        answer: "outer\nglobal",
        hint: "inner() sees outer's x via closure. The global x is never touched."
      }
    ]
  }
};

// ─── MODULES ─────────────────────────────────────────────────────────────────
const MODULES: Module[] = [
  {
    id: "foundations", title: "Syntax Refresher", icon: "🧠",
    color: "from-rose-600 to-pink-700", tag: "Start here",
    description: "Loops, functions, and collections — syntax first.",
    lessons: [
      {
        id: "loops", title: "Loops & Conditionals",
        theory: `**The for loop:**
\`\`\`python
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
\`\`\`

**range() for counting:**
\`\`\`python
for i in range(5):       # 0, 1, 2, 3, 4
for i in range(2, 5):    # 2, 3, 4
for i in range(0,10,2):  # 0,2,4,6,8 (step)
\`\`\`

**if / elif / else:**
\`\`\`python
if x > 100:
    print("big")
elif x > 10:
    print("medium")
else:
    print("small")
\`\`\`

**Rules:** colon after every block header, 4-space indent, \`elif\` not \`else if\`, \`and\`/\`or\`/\`not\` not \`&&\`/\`||\`/\`!\`.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "What does this print?\n\nfor i in range(4):\n    if i % 2 != 0:\n        print(i * 10)", answer: "10\n30", hint: "range(4) = 0,1,2,3. Which are odd?" },
          { type: "bugfix", label: "Fix the Bug", prompt: "Should print 1 through 5. Two bugs — find and fix them.\n\nfor i in range(1, 5)\n    print[i]", answer: "for i in range(1, 6):\n    print(i)", hint: "Missing colon, wrong brackets on print, and off-by-one in range." },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a loop that prints every even number from 2 to 10 inclusive.", answer: "for i in range(2, 11, 2):\n    print(i)", hint: "range() takes an optional step argument." }
        ]
      },
      {
        id: "functions-basic", title: "Functions & Scope",
        theory: `**Defining and calling:**
\`\`\`python
def greet(name, greeting="Hello"):
    return greeting + ", " + name

greet("Rahul")            # Hello, Rahul
greet("Rahul", "Hey")     # Hey, Rahul
greet(greeting="Hi", name="Rahul")
\`\`\`

**Scope — variables inside stay inside:**
\`\`\`python
def foo():
    x = 10
foo()
print(x)   # NameError
\`\`\`

**Multiple return values:**
\`\`\`python
def min_max(nums):
    return min(nums), max(nums)
lo, hi = min_max([3,1,7])
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "What prints?\n\ndef add(a, b=10):\n    return a + b\n\nprint(add(5))\nprint(add(5, 3))", answer: "15\n8", hint: "First call uses default b=10." },
          { type: "bugfix", label: "Fix the Bug", prompt: "Two bugs. Fix them.\n\ndef square(n)\n    return n * n\n\nprint(square(4))", answer: "def square(n):\n    return n * n\n\nprint(square(4))", hint: "Missing colon after def. Check indentation too." },
          { type: "scratch", label: "Write from Scratch", prompt: "Write celsius_to_fahrenheit(c) that returns F = C * 9/5 + 32.", answer: "def celsius_to_fahrenheit(c):\n    return c * 9/5 + 32", hint: "def, one parameter, return with the formula." }
        ]
      },
      {
        id: "collections-basic", title: "Lists, Dicts & Data Structures",
        theory: `**Lists:**
\`\`\`python
nums = [3, 1, 4]
nums.append(9)    # [3,1,4,9]
nums[0]           # 3
nums[-1]          # 9
nums[1:3]         # [1, 4]
\`\`\`

**Dicts:**
\`\`\`python
d = {"name": "sibeprenlimab", "mw": 146000}
d["name"]          # "sibeprenlimab"
d["new_key"] = 42
"mw" in d          # True
for k, v in d.items():
    print(k, v)
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: 'What prints?\n\nd = {"x": 3, "y": 7}\nfor k, v in d.items():\n    print(k, v * 2)', answer: "x 6\ny 14", hint: "Loop over items() gives key and value. Multiply each value by 2." },
          { type: "bugfix", label: "Fix the Bug", prompt: 'Two errors. Fix them.\n\nfruits = ["apple", "banana"]\nfruits.add("cherry")\nprint(length(fruits))', answer: 'fruits = ["apple", "banana"]\nfruits.append("cherry")\nprint(len(fruits))', hint: "Lists use append(), not add(). Length is len(), not length()." },
          { type: "scratch", label: "Write from Scratch", prompt: 'Create a dict "person" with keys "name" and "age", then print each key-value pair with a loop.', answer: 'person = {"name": "Rahul", "age": 30}\nfor k, v in person.items():\n    print(k, v)', hint: "Create with {}, loop with .items()." }
        ]
      }
    ]
  },
  {
    id: "pythonic", title: "Pythonic Code", icon: "🐍",
    color: "from-emerald-600 to-teal-700",
    description: "Write code that looks like Python, not Java.",
    lessons: [
      {
        id: "list-comp", title: "List Comprehensions",
        theory: `**Old way:**
\`\`\`python
squares = []
for x in range(10):
    squares.append(x**2)
\`\`\`
**Pythonic:**
\`\`\`python
squares = [x**2 for x in range(10)]
evens   = [x for x in range(20) if x % 2 == 0]
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "What does this produce?\n\nresult = [x**2 for x in range(5) if x % 2 == 0]\nprint(result)", answer: "[0, 4, 16]", hint: "range(5)=0-4. Even ones are 0,2,4. Square them." },
          { type: "bugfix", label: "Fix the Bug", prompt: "Should uppercase each word.\n\nwords = ['hello','world']\nresult = [w.upper for w in words]", answer: "words = ['hello','world']\nresult = [w.upper() for w in words]", hint: "upper is a method — needs ()." },
          { type: "scratch", label: "Write from Scratch", prompt: "One-liner: list of lengths of each word in:\nwords = ['python', 'is', 'fun']", answer: "lengths = [len(w) for w in words]", hint: "Apply len() inside the comprehension." }
        ]
      },
      {
        id: "unpacking", title: "Tuple Unpacking & *",
        theory: `\`\`\`python
x, y = (4, 7)
first, *rest = [1, 2, 3, 4, 5]
# first=1, rest=[2,3,4,5]
a, b = b, a   # swap
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "What prints?\n\nfirst, *middle, last = [10,20,30,40,50]\nprint(first)\nprint(middle)\nprint(last)", answer: "10\n[20, 30, 40]\n50", hint: "* in the middle collects everything that's not first or last." },
          { type: "bugfix", label: "Fix the Bug", prompt: "Should swap a and b. Fix it.\n\na = 1\nb = 2\na = b\nb = a\nprint(a, b)  # want: 2 1", answer: "a = 1\nb = 2\na, b = b, a\nprint(a, b)", hint: "Do it in one line: a, b = b, a" },
          { type: "scratch", label: "Write from Scratch", prompt: "Unpack coords = (3, 7, 2) into x, y, z and print their sum.", answer: "x, y, z = coords\nprint(x + y + z)", hint: "Three vars on the left." }
        ]
      }
    ]
  },
  {
    id: "functions-adv", title: "Functions Done Right", icon: "⚙️",
    color: "from-blue-600 to-indigo-700",
    description: "Type hints, docstrings, and avoiding the mutable default trap.",
    lessons: [
      {
        id: "type-hints", title: "Type Hints & Docstrings",
        theory: `\`\`\`python
def process(data: list[str], flag: bool = False) -> dict:
    """
    Process strings.
    Args:
        data: Input strings.
        flag: Extra filtering if True.
    Returns:
        Dict of results.
    """
    ...
\`\`\`
Type hints power IDE autocomplete and \`mypy\` — they don't enforce at runtime.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "Type hints don't affect runtime. What prints?\n\ndef add(a: int, b: int) -> int:\n    return a + b\n\nprint(add(2.5, 3.5))", answer: "6.0", hint: "Python doesn't enforce type hints — floats add normally." },
          { type: "bugfix", label: "Fix the Bug", prompt: "Fix the return type annotation.\n\ndef greet(name: str) str:\n    return 'Hello, ' + name", answer: "def greet(name: str) -> str:\n    return 'Hello, ' + name", hint: "Return type uses -> before the type." },
          { type: "scratch", label: "Write from Scratch", prompt: "Write multiply(a, b) with float type hints and a one-line docstring.", answer: 'def multiply(a: float, b: float) -> float:\n    """Return the product of a and b."""\n    return a * b', hint: "Annotate params and return, then triple-quoted docstring." }
        ]
      },
      {
        id: "default-args", title: "The Mutable Default Trap",
        theory: `\`\`\`python
# BAD — list created once, shared forever
def add_item(item, items=[]):
    items.append(item)
    return items

# GOOD — create fresh each call
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "Careful — it's a trap.\n\ndef append_val(val, lst=[]):\n    lst.append(val)\n    return lst\n\nprint(append_val(1))\nprint(append_val(2))\nprint(append_val(3))", answer: "[1]\n[1, 2]\n[1, 2, 3]", hint: "The default list is shared — it keeps accumulating." },
          { type: "bugfix", label: "Fix the Bug", prompt: "Fix so each call without a list starts fresh.\n\ndef collect(item, results=[]):\n    results.append(item)\n    return results", answer: "def collect(item, results=None):\n    if results is None:\n        results = []\n    results.append(item)\n    return results", hint: "Default None, initialise inside." },
          { type: "scratch", label: "Write from Scratch", prompt: "Write safe make_tag_list(tag, tags=None) that appends tag to the list without the mutable default bug.", answer: "def make_tag_list(tag, tags=None):\n    if tags is None:\n        tags = []\n    tags.append(tag)\n    return tags", hint: "Default None, guard with if None, then append." }
        ]
      }
    ]
  }
];

const EXERCISE_META = {
  output: { label: "Predict the Output", icon: "🔍", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800" },
  bugfix: { label: "Fix the Bug",        icon: "🐛", color: "text-red-400",    bg: "bg-red-900/20 border-red-800" },
  scratch:{ label: "Write from Scratch", icon: "✍️", color: "text-blue-400",  bg: "bg-blue-900/20 border-blue-800" },
};


interface Exercise {
  type: "output" | "bugfix" | "scratch";
  prompt: string;
  answer: string;
  hint: string;
  label?: string;
}

interface Lesson {
  id: string;
  title: string;
  theory: string;
  exercises: Exercise[];
}

interface Module {
  id: string;
  title: string;
  icon: string;
  color: string;
  tag?: string;
  description: string;
  lessons: Lesson[];
}

interface GradeResult {
  correct: boolean;
  feedback: string;
}

type LevelInfo = typeof LEVELS[number];

interface ModuleProgress {
  exercises: Record<string, boolean>;
  bossDefeated: boolean;
  bossRound: number;
  bossAnswers: Record<number, string>;
}

type Progress = Record<string, ModuleProgress>;

async function gradeWithClaude(exercise: Exercise, userAnswer: string): Promise<GradeResult> {
  const typeDesc: Record<Exercise["type"], string> = {
    output: "predict the printed output",
    bugfix: "fix a buggy code snippet",
    scratch: "write code from a prompt",
  };

  const prompt = `Grade this Python exercise. Task: ${typeDesc[exercise.type]}.
PROMPT: ${exercise.prompt}
REFERENCE: ${exercise.answer}
STUDENT: ${userAnswer}
Accept equivalent correct approaches. Reply ONLY with valid JSON, nothing else:
{"correct":true,"feedback":"why it works"}
or
{"correct":false,"feedback":"short nudge without giving the answer"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ prompt }),
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const raw: string = data?.content?.[0]?.text ?? "";
    const clean = raw.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (typeof parsed.correct !== "boolean") throw new Error("bad schema");
    return parsed as GradeResult;
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Request timed out — please try again.");
    }
    throw e;
  }
}
// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home|module|lesson|boss|levelup
  const [activeMod, setActiveMod] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [exIdx, setExIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [xp, setXp] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("pr_xp");
    return saved ? Number(saved) : 0;
  });
  const [prevXp, setPrevXp] = useState(0);
  const [streak, setStreak] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("pr_streak");
    return saved ? Number(saved) : 0;
  });
  const [showXpPop, setShowXpPop] = useState<number | false>(false);
  const [levelUpData, setLevelUpData] = useState<LevelInfo | null>(null);
  const [progress, setProgress] = useState<Progress>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pr_progress");
      if (saved) { try { return JSON.parse(saved); } catch {} }
    }
    const p: Progress = {};
    MODULES.forEach(m => { p[m.id] = { exercises:{}, bossDefeated:false, bossRound:0, bossAnswers:{} }; });
    return p;
  });
  // persist progress to localStorage
  useEffect(() => { localStorage.setItem("pr_xp", String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem("pr_streak", String(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem("pr_progress", JSON.stringify(progress)); }, [progress]);

  // boss state
  const [bossRound, setBossRound] = useState(0);
  const [bossAnswers, setBossAnswers] = useState({});
  const [bossResult, setBossResult] = useState<GradeResult | null>(null);
  const [bossWon, setBossWon] = useState(false);
  const [bossIntroSeen, setBossIntroSeen] = useState(false);

  const curLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const xpForBar = nextLevel ? xp - curLevel.xpNeeded : XP_PER_EXERCISE;
  const xpNeededForBar = nextLevel ? nextLevel.xpNeeded - curLevel.xpNeeded : XP_PER_EXERCISE;

  const addXp = (amount: number) => {
    setPrevXp(xp);
    const newXp = xp + amount;
    const oldLevel = getCurrentLevel(xp);
    const newLevel = getCurrentLevel(newXp);
    setXp(newXp);
    setShowXpPop(amount);
    setTimeout(() => setShowXpPop(false), 1400);
    if (newLevel.level > oldLevel.level) {
      setTimeout(() => { setLevelUpData(newLevel); setScreen("levelup"); }, 600);
    }
  };

  const totalEx = MODULES.reduce((s,m) => s + m.lessons.reduce((a,l) => a + l.exercises.length, 0), 0);
  const doneEx = Object.values(progress).reduce((s,mp) => s + Object.values(mp.exercises).filter(Boolean).length, 0);

  const lessonDone = (lid: string) => {
    const mod = MODULES.find(m => m.lessons.some(l => l.id === lid));
    if (!mod) return 0;
    const lesson = mod.lessons.find(l => l.id === lid);
    if (!lesson) return 0;
    return lesson.exercises.filter((_,i) => progress[mod.id]?.exercises[`${lid}-${i}`]).length;
  };

  const allLessonsDone = (modId: string) => {
    const mod = MODULES.find(m => m.id === modId);
    if (!mod) return false;
    return mod.lessons.every(l => l.exercises.every((_,i) => progress[modId]?.exercises[`${l.id}-${i}`]));
  };

  const openLesson = (lesson: Lesson, mod: Module) => {
    setActiveMod(mod); setActiveLesson(lesson);
    setExIdx(0); setUserAnswer(""); setResult(null); setShowHint(false);
    setScreen("lesson");
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      setUserAnswer(val.substring(0, start) + "    " + val.substring(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
    }
  };

  const currentEx = activeLesson?.exercises[exIdx];
  const meta = currentEx ? EXERCISE_META[currentEx.type] : null;

  const handleSubmit = async () => {
    if (!userAnswer.trim() || !currentEx || !activeLesson || !activeMod) return;
    setGrading(true);
    try {
      const r = await gradeWithClaude(currentEx, userAnswer);
      setResult(r);
      const key = `${activeLesson.id}-${exIdx}`;
      if (r.correct && !progress[activeMod.id]?.exercises[key]) {
        setProgress(p => ({ ...p, [activeMod.id]: { ...p[activeMod.id], exercises: { ...p[activeMod.id].exercises, [key]: true } } }));
        setStreak(s => s + 1);
        addXp(XP_PER_EXERCISE);
      } else if (!r.correct) setStreak(0);
    } catch(e) { setResult({ correct:false, feedback: e instanceof Error ? e.message : "Couldn't grade — check connection and try again." }); }
    setGrading(false);
  };

  const nextExercise = () => {
    if (activeLesson && exIdx + 1 < activeLesson.exercises.length) {
      setExIdx(i => i + 1); setUserAnswer(""); setResult(null); setShowHint(false);
    } else {
      setScreen("module");
    }
  };

  // ── BOSS ──
  const boss = activeMod ? BOSSES[activeMod.id] : null;
  const bossRounds = boss?.rounds || [];

  const startBoss = () => {
    setBossRound(0); setBossAnswers({}); setBossResult(null); setBossWon(false); setBossIntroSeen(false);
    setUserAnswer(""); setScreen("boss");
  };

  const handleBossSubmit = async () => {
    if (!userAnswer.trim() || !activeMod) return;
    setGrading(true);
    try {
      const r = await gradeWithClaude(bossRounds[bossRound] as Exercise, userAnswer);
      setBossResult(r);
      if (r.correct) {
        const newAnswers = { ...bossAnswers, [bossRound]: userAnswer };
        setBossAnswers(newAnswers);
        if (bossRound + 1 >= bossRounds.length) {
          setBossWon(true);
          if (!progress[activeMod.id]?.bossDefeated) {
            setProgress(p => ({ ...p, [activeMod.id]: { ...p[activeMod.id], bossDefeated: true } }));
            setStreak(s => s + 3);
            addXp(XP_PER_BOSS);
          }
        }
      } else setStreak(0);
    } catch(e) { setBossResult({ correct:false, feedback: e instanceof Error ? e.message : "Couldn't grade — check connection and try again." }); }
    setGrading(false);
  };

  const nextBossRound = () => {
    setBossRound(r => r + 1); setUserAnswer(""); setBossResult(null); setShowHint(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* XP pop */}
      {showXpPop && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-full shadow-lg text-base animate-bounce pointer-events-none">
          +{showXpPop} XP ⚡
        </div>
      )}

      {/* NAV */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setScreen("home")} className="flex items-center gap-2 font-bold hover:text-rose-400 transition-colors">
          🐍 <span className="hidden sm:inline">Python Reboot</span>
        </button>
        <div className="flex items-center gap-3 text-sm">
          <div className="hidden sm:flex items-center gap-1 bg-gray-800 rounded-full px-3 py-1">
            <div className="w-20 bg-gray-700 rounded-full h-1.5 mr-2">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1.5 rounded-full transition-all" style={{width:`${Math.min(100,(xpForBar/xpNeededForBar)*100)}%`}}/>
            </div>
            <span className="text-xs text-gray-400">{curLevel.icon} {curLevel.title}</span>
          </div>
          <span className="text-yellow-400 font-bold text-xs">⚡{xp}</span>
          <span className="text-orange-400 font-bold text-xs">🔥{streak}</span>
        </div>
      </nav>

      {/* ── HOME ── */}
      {screen === "home" && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-2">{curLevel.icon}</div>
            <h1 className="text-3xl font-bold">Python Reboot</h1>
            <p className="text-gray-400 mt-1 text-sm">Clear dungeons. Defeat bosses. Level up.</p>
            <div className="mt-3 inline-block bg-gray-800 rounded-full px-4 py-1 text-sm font-medium">
              {curLevel.title} — Level {curLevel.level}
              {nextLevel && <span className="text-gray-500 ml-2 text-xs">{nextLevel.xpNeeded - xp} XP to {nextLevel.title}</span>}
            </div>
          </div>

          {/* XP bar */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span><span>{doneEx}/{totalEx} exercises · {Object.values(progress).filter(p=>p.bossDefeated).length}/{MODULES.length} bosses defeated</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 via-emerald-400 to-blue-500 h-2.5 rounded-full transition-all duration-700"
                style={{width:`${totalEx ? (doneEx/totalEx)*100 : 0}%`}}/>
            </div>
          </div>

          <div className="space-y-3">
            {MODULES.map((mod, i) => {
              const modDone = allLessonsDone(mod.id);
              const bossDone = progress[mod.id]?.bossDefeated;
              const totalModEx = mod.lessons.reduce((a,l)=>a+l.exercises.length,0);
              const doneModEx = mod.lessons.reduce((a,l)=>a+l.exercises.filter((_,j)=>progress[mod.id]?.exercises[`${l.id}-${j}`]).length,0);
              return (
                <button key={mod.id} onClick={()=>{setActiveMod(mod);setScreen("module");}}
                  className="w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 transition-all group relative overflow-hidden">
                  {i===0&&!doneModEx&&<div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Start here</div>}
                  {bossDone&&<div className="absolute top-3 right-3 text-yellow-400 text-lg">🏆</div>}
                  <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${mod.color} rounded-xl p-3 text-2xl flex-shrink-0`}>{mod.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{mod.title}</div>
                      <p className="text-xs text-gray-400 truncate">{mod.description}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="bg-gray-700 rounded-full h-1.5 flex-1">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{width:`${totalModEx?(doneModEx/totalModEx)*100:0}%`}}/>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">{doneModEx}/{totalModEx}</span>
                        {modDone && !bossDone && <span className="text-xs text-red-400 font-bold flex-shrink-0 animate-pulse">👹 Boss ready</span>}
                      </div>
                    </div>
                    <span className="text-gray-500 group-hover:text-white">›</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Level roadmap */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Level Roadmap</div>
            <div className="space-y-2">
              {LEVELS.map(l => {
                const unlocked = xp >= l.xpNeeded;
                const isCurrent = curLevel.level === l.level;
                return (
                  <div key={l.level} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isCurrent?"bg-yellow-900/30 border border-yellow-800":unlocked?"opacity-60":"opacity-30"}`}>
                    <span className="text-xl">{l.icon}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${isCurrent?"text-yellow-300":""}`}>Lv {l.level} — {l.title}</div>
                      <div className="text-xs text-gray-500">{l.xpNeeded} XP to unlock</div>
                    </div>
                    {unlocked && <span className="text-emerald-400 text-xs">✓</span>}
                    {isCurrent && <span className="text-yellow-400 text-xs font-bold">YOU</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE ── */}
      {screen === "module" && activeMod && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={()=>setScreen("home")} className="text-sm text-gray-400 hover:text-white mb-5 flex items-center gap-1">‹ Map</button>
          <div className={`bg-gradient-to-r ${activeMod.color} rounded-xl p-5 mb-6`}>
            <div className="text-3xl mb-1">{activeMod.icon}</div>
            <h1 className="text-xl font-bold">{activeMod.title}</h1>
            <p className="text-white/70 text-sm mt-0.5">{activeMod.description}</p>
          </div>
          <div className="space-y-3 mb-4">
            {activeMod.lessons.map((lesson, i) => {
              const done = lessonDone(lesson.id);
              const total = lesson.exercises.length;
              const complete = done === total;
              return (
                <button key={lesson.id} onClick={()=>openLesson(lesson, activeMod)}
                  className="w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 flex items-center gap-3 transition-all group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${complete?"bg-emerald-600":"bg-gray-700 text-gray-400"}`}>
                    {complete ? "✓" : i+1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{lesson.title}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {lesson.exercises.map((ex,j) => (
                        <span key={j} className={`text-xs px-1.5 py-0.5 rounded ${progress[activeMod.id]?.exercises[`${lesson.id}-${j}`]?"bg-emerald-800 text-emerald-300":"bg-gray-700 text-gray-400"}`}>
                          {EXERCISE_META[ex.type].icon}
                        </span>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{done}/{total}</span>
                    </div>
                  </div>
                  <span className="text-gray-500 group-hover:text-white text-sm">›</span>
                </button>
              );
            })}
          </div>

          {/* Boss button */}
          {(() => {
            const modDone = allLessonsDone(activeMod.id);
            const bossDone = progress[activeMod.id]?.bossDefeated;
            const b = BOSSES[activeMod.id];
            if (!b) return null;
            return (
              <button onClick={startBoss} disabled={!modDone}
                className={`w-full rounded-xl p-4 border-2 transition-all text-center font-bold ${bossDone ? "border-yellow-600 bg-yellow-900/20 text-yellow-300" : modDone ? "border-red-600 bg-red-900/20 text-red-300 hover:bg-red-900/40 animate-pulse" : "border-gray-700 bg-gray-800/50 text-gray-600 cursor-not-allowed"}`}>
                {bossDone ? `🏆 ${b.name} Defeated` : modDone ? `👹 Challenge: ${b.name}` : `🔒 Complete all lessons to unlock boss`}
                {modDone && !bossDone && <div className="text-xs font-normal text-red-400 mt-0.5">Reward: +{XP_PER_BOSS} XP</div>}
              </button>
            );
          })()}
        </div>
      )}

      {/* ── LESSON ── */}
      {screen === "lesson" && activeLesson && currentEx && activeMod && meta && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={()=>setScreen("module")} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">‹ {activeMod.title}</button>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold">{activeLesson.title}</h1>
            <span className="text-sm text-gray-500">{exIdx+1}/{activeLesson.exercises.length}</span>
          </div>
          <div className="flex gap-1.5 mb-5">
            {activeLesson.exercises.map((_,i)=>(
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i<exIdx?"bg-emerald-500":i===exIdx?"bg-blue-400":"bg-gray-700"}`}/>
            ))}
          </div>
          <details className="bg-gray-800 border border-gray-700 rounded-xl mb-5 group">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:text-white flex items-center gap-2 list-none">
              <span>📖</span> Theory<span className="ml-auto text-gray-500">▾</span>
            </summary>
            <div className="px-4 pb-4 pt-2 border-t border-gray-700"><TheoryRenderer text={activeLesson.theory}/></div>
          </details>
          <div className={`border rounded-xl p-4 mb-3 ${meta.bg}`}>
            <div className={`flex items-center gap-2 font-bold mb-2 text-sm ${meta.color}`}>{meta.icon} {meta.label}</div>
            <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">{currentEx.prompt}</pre>
          </div>
          <textarea value={userAnswer} onChange={e=>setUserAnswer(e.target.value)} onKeyDown={handleTab} disabled={!!result}
            placeholder={currentEx.type==="output"?"Type what you think prints...":"Write your Python code here..."}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-mono text-gray-100 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
            rows={currentEx.type==="output"?4:7}/>
          {!result && <button onClick={()=>setShowHint(h=>!h)} className="text-xs text-gray-500 hover:text-gray-300 mt-1.5 block">{showHint?"▾ Hide":"💡 Hint"}</button>}
          {showHint && !result && <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 mt-1 mb-2">{currentEx.hint}</div>}
          {result && (
            <div className={`rounded-xl p-3 mt-3 mb-3 border text-sm ${result.correct?"bg-emerald-900/30 border-emerald-700 text-emerald-200":"bg-red-900/30 border-red-800 text-red-200"}`}>
              <div className="font-bold mb-0.5">{result.correct?"✅ Correct!":"❌ Not quite."}</div>
              <div className="text-gray-300">{result.feedback}</div>
            </div>
          )}
          <div className="mt-2">
            {!result ? (
              <button onClick={handleSubmit} disabled={!userAnswer.trim()||grading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                {grading?<><Spinner/>Grading...</>:"Submit Answer"}
              </button>
            ) : result.correct ? (
              <button onClick={nextExercise}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium text-sm">
                {exIdx+1<activeLesson.exercises.length?"Next Exercise →":"Finish Lesson ✓"}
              </button>
            ) : (
              <button onClick={()=>{setResult(null);setUserAnswer("");}}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-lg font-medium text-sm">Try Again</button>
            )}
          </div>
        </div>
      )}

      {/* ── BOSS ── */}
      {screen === "boss" && activeMod && boss && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={()=>setScreen("module")} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">‹ {activeMod.title}</button>
          {bossWon ? (
            <div className="text-center py-12">
              <div className="text-7xl mb-4 animate-bounce">🏆</div>
              <h1 className="text-3xl font-bold text-yellow-300 mb-2">{boss.name} Defeated!</h1>
              <p className="text-gray-400 mb-2">You earned <span className="text-yellow-400 font-bold">+{XP_PER_BOSS} XP</span> and a 3× streak bonus.</p>
              <button onClick={()=>setScreen("module")} className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl">Back to Module</button>
            </div>
          ) : !bossIntroSeen ? (
            <div className={`bg-gradient-to-br ${boss.color} border ${boss.border} rounded-2xl p-8 text-center`}>
              <div className="text-7xl mb-4">{boss.icon}</div>
              <h1 className="text-2xl font-bold mb-3">{boss.name}</h1>
              <p className="text-gray-300 italic mb-6 text-sm leading-relaxed">"{boss.intro}"</p>
              <div className="flex gap-4 justify-center text-sm text-gray-400 mb-8">
                <span>⚔️ {boss.rounds.length} rounds</span>
                <span>🏆 +{XP_PER_BOSS} XP</span>
                <span>🔥 3× streak</span>
              </div>
              <button onClick={()=>setBossIntroSeen(true)} className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-xl text-lg">Fight! ⚔️</button>
            </div>
          ) : (
            <div>
              <div className={`bg-gradient-to-r ${boss.color} border ${boss.border} rounded-xl p-4 mb-5 flex items-center gap-3`}>
                <span className="text-3xl">{boss.icon}</span>
                <div>
                  <div className="font-bold text-sm">{boss.name}</div>
                  <div className="flex gap-1 mt-1">
                    {boss.rounds.map((_,i)=>(
                      <div key={i} className={`h-2 w-8 rounded-full ${i<bossRound?"bg-emerald-500":i===bossRound?"bg-red-400 animate-pulse":"bg-gray-600"}`}/>
                    ))}
                  </div>
                </div>
                <span className="ml-auto text-sm text-gray-400">Round {bossRound+1}/{boss.rounds.length}</span>
              </div>
              {(() => {
                const round = bossRounds[bossRound];
                const rmeta = EXERCISE_META[round.type];
                return (
                  <>
                    <div className={`border rounded-xl p-4 mb-3 ${rmeta.bg}`}>
                      <div className={`flex items-center gap-2 font-bold mb-2 text-sm ${rmeta.color}`}>{rmeta.icon} {rmeta.label}</div>
                      <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">{round.prompt}</pre>
                    </div>
                    <textarea value={userAnswer} onChange={e=>setUserAnswer(e.target.value)} onKeyDown={handleTab} disabled={!!bossResult}
                      placeholder="Write your answer..." rows={7}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-mono text-gray-100 resize-none focus:outline-none focus:border-red-500 disabled:opacity-50"/>
                    {!bossResult && <button onClick={()=>setShowHint(h=>!h)} className="text-xs text-gray-500 hover:text-gray-300 mt-1.5 block">{showHint?"▾ Hide":"💡 Hint"}</button>}
                    {showHint&&!bossResult&&<div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 mt-1 mb-2">{round.hint}</div>}
                    {bossResult && (
                      <div className={`rounded-xl p-3 mt-3 mb-3 border text-sm ${bossResult.correct?"bg-emerald-900/30 border-emerald-700":"bg-red-900/30 border-red-800 text-red-200"}`}>
                        <div className="font-bold mb-0.5">{bossResult.correct?"✅ Round cleared!":"❌ The boss laughs."}</div>
                        <div className="text-gray-300">{bossResult.feedback}</div>
                      </div>
                    )}
                    <div className="mt-2">
                      {!bossResult ? (
                        <button onClick={handleBossSubmit} disabled={!userAnswer.trim()||grading}
                          className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                          {grading?<><Spinner/>Grading...</>:"Strike! ⚔️"}
                        </button>
                      ) : bossResult.correct ? (
                        bossRound+1 < bossRounds.length ? (
                          <button onClick={nextBossRound} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium text-sm">Next Round →</button>
                        ) : null
                      ) : (
                        <button onClick={()=>{setBossResult(null);setUserAnswer("");setShowHint(false);}}
                          className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-lg font-medium text-sm">Try Again</button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── LEVEL UP ── */}
      {screen === "levelup" && levelUpData && (
        <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">{levelUpData.icon}</div>
            <div className="text-yellow-400 text-sm font-bold uppercase tracking-widest mb-2">Level Up!</div>
            <h1 className="text-4xl font-bold mb-2">Level {levelUpData.level}</h1>
            <h2 className="text-2xl text-yellow-300 mb-6">{levelUpData.title}</h2>
            <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm">
              {levelUpData.level === 2 && "You've shaken the syntax rust off. Now we go Pythonic."}
              {levelUpData.level === 3 && "Functions bend to your will. The dict dungeons await."}
              {levelUpData.level === 4 && "You're writing real Python now. The final boss is near."}
              {levelUpData.level === 5 && "Pythonista. The highest rank. The code speaks for itself."}
            </p>
            <button onClick={()=>setScreen("home")} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-3 rounded-xl text-lg">Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>;
}

function TheoryRenderer({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2">
      {parts.map((part: string, i: number) => {
        if (part.startsWith("```")) {
          return <pre key={i} className="bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs overflow-x-auto text-gray-200 font-mono">{part.replace(/```\w*\n?/,"").replace(/```$/,"")}</pre>;
        }
        return (
          <div key={i} className="space-y-1">
            {part.split("\n").filter((l: string)=>l.trim()).map((line: string, j: number) => (
              <p key={j} className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{__html:
                line.replace(/\*\*(.*?)\*\*/g,'<strong class="text-white">$1</strong>')
                    .replace(/`([^`]+)`/g,'<code class="bg-gray-700 text-emerald-300 px-1 rounded text-xs font-mono">$1</code>')
              }}/>
            ))}
          </div>
        );
      })}
    </div>
  );
}