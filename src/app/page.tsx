"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const XP_PER_EXERCISE = 50;
const XP_PER_DRILL = 25;
const XP_PER_BOSS = 150;
const LEVELS = [
  { level: 1, title: "Script Kiddie",       xpNeeded: 0,    icon: "🥚" },
  { level: 2, title: "Loop Wrangler",       xpNeeded: 200,  icon: "🐣" },
  { level: 3, title: "Function Forger",     xpNeeded: 500,  icon: "🐍" },
  { level: 4, title: "Dict Whisperer",      xpNeeded: 900,  icon: "⚗️" },
  { level: 5, title: "Exception Tamer",     xpNeeded: 1400, icon: "🛡️" },
  { level: 6, title: "Decorator Artisan",   xpNeeded: 2200, icon: "🎭" },
  { level: 7, title: "Generator Sage",      xpNeeded: 3200, icon: "♾️" },
  { level: 8, title: "Pythonista",          xpNeeded: 4500, icon: "🧙" },
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
        hint: "5 bugs: variable name case, missing comma in range, = vs ==, missing colon, =+ vs +=",
        refs: [{ label: "range()", url: "https://docs.python.org/3/library/stdtypes.html#range" }, { label: "Augmented assignment (+=)", url: "https://docs.python.org/3/reference/simple_stmts.html#augmented-assignment-statements" }]
      },
      {
        type: "scratch",
        prompt: "Round 2/3 — Write a function called fizzbuzz(n) that returns 'Fizz' if n is divisible by 3, 'Buzz' if divisible by 5, 'FizzBuzz' if both, otherwise the number as a string.",
        answer: "def fizzbuzz(n):\n    if n % 3 == 0 and n % 5 == 0:\n        return 'FizzBuzz'\n    elif n % 3 == 0:\n        return 'Fizz'\n    elif n % 5 == 0:\n        return 'Buzz'\n    else:\n        return str(n)",
        hint: "Check the combined case (FizzBuzz) first, before the individual checks.",
        refs: [{ label: "if/elif/else", url: "https://docs.python.org/3/tutorial/controlflow.html#if-statements" }, { label: "str()", url: "https://docs.python.org/3/library/stdtypes.html#str" }]
      },
      {
        type: "output",
        prompt: "Round 3/3 — Final strike. What does this print?\n\ndef mystery(items):\n    result = {}\n    for i, item in enumerate(items):\n        result[item] = i\n    return result\n\nprint(mystery(['a', 'b', 'a']))",
        answer: "{'a': 2, 'b': 1}",
        hint: "enumerate gives (index, value). When 'a' appears twice, the second index overwrites the first.",
        refs: [{ label: "enumerate()", url: "https://docs.python.org/3/library/functions.html#enumerate" }, { label: "Dictionaries", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" }]
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
        hint: "Pattern: [expression for item in iterable if condition]",
        refs: [{ label: "List comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions" }]
      },
      {
        type: "bugfix",
        prompt: "Round 2/3 — This unpacking is unnecessarily verbose. Rewrite lines 2-4 as a single unpacking line.\n\ncoords = (51.5, -0.12, 11)\nlat = coords[0]\nlon = coords[1]\nalt = coords[2]",
        answer: "coords = (51.5, -0.12, 11)\nlat, lon, alt = coords",
        hint: "Three variables on the left, tuple on the right.",
        refs: [{ label: "Tuples and sequences", url: "https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences" }]
      },
      {
        type: "output",
        prompt: "Round 3/3 — What does this print?\n\ndata = [('alice', 90), ('bob', 75), ('carol', 88)]\nbest = max(data, key=lambda x: x[1])\nprint(best[0])",
        answer: "alice",
        hint: "max() with a key finds the tuple with the highest second element. Then [0] gets the name.",
        refs: [{ label: "max()", url: "https://docs.python.org/3/library/functions.html#max" }, { label: "Lambda expressions", url: "https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions" }]
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
        hint: "Replace [] with None, guard inside the function, and annotate all params and return.",
        refs: [{ label: "Function annotations", url: "https://docs.python.org/3/tutorial/controlflow.html#function-annotations" }, { label: "Common gotcha: mutable defaults", url: "https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects" }]
      },
      {
        type: "scratch",
        prompt: "Round 2/3 — Write a type-annotated function min_max(numbers) that returns both the minimum and maximum of a list of floats as a tuple.",
        answer: "def min_max(numbers: list[float]) -> tuple[float, float]:\n    return min(numbers), max(numbers)",
        hint: "Return type is tuple[float, float]. Python packs two return values into a tuple automatically.",
        refs: [{ label: "Function annotations", url: "https://docs.python.org/3/tutorial/controlflow.html#function-annotations" }, { label: "min() / max()", url: "https://docs.python.org/3/library/functions.html#min" }]
      },
      {
        type: "output",
        prompt: "Round 3/3 — What prints? Think carefully about scope.\n\nx = 'global'\n\ndef outer():\n    x = 'outer'\n    def inner():\n        print(x)\n    inner()\n\nouter()\nprint(x)",
        answer: "outer\nglobal",
        hint: "inner() sees outer's x via closure. The global x is never touched.",
        refs: [{ label: "Scopes and namespaces", url: "https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces" }, { label: "Closures (nested functions)", url: "https://docs.python.org/3/faq/programming.html#what-are-the-rules-for-local-and-global-variables-in-python" }]
      }
    ]
  },
  "error-handling": {
    name: "The Exception Phantom", icon: "\u{1F47B}",
    color: "from-amber-900 to-orange-950", border: "border-amber-700",
    intro: "I am the Exception Phantom... Every uncaught error feeds my power. Show me you can trap what others fear!",
    rounds: [
      { type: "bugfix", prompt: "Round 1/3 \u2014 Fix this code that silently swallows exceptions.\n\ntry:\n    result = int(\"not_a_number\")\nexcept:\n    pass\n\nprint(\"Continuing...\")\n# Should print the error info AND re-raise", answer: "try:\n    result = int(\"not_a_number\")\nexcept Exception as e:\n    print(f\"{type(e).__name__}: {e}\")\n    raise\n\nprint(\"Continuing...\")", hint: "Bare 'except: pass' hides all errors. Catch Exception as e, print info, then re-raise.", refs: [{ label: "Exception Handling", url: "https://docs.python.org/3/tutorial/errors.html#handling-exceptions" }] },
      { type: "output", prompt: "Round 2/3 \u2014 What does this print?\n\nclass PhantomError(ValueError):\n    pass\n\ndef haunt():\n    try:\n        raise PhantomError(\"boo\")\n    except ValueError as e:\n        print(f\"caught: {e}\")\n    finally:\n        print(\"finally\")\n\nhaunt()", answer: "caught: boo\nfinally", hint: "PhantomError is a subclass of ValueError, so except ValueError catches it.", refs: [{ label: "User-defined Exceptions", url: "https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Write a context manager class suppress that suppresses specified exception types and stores the last one in .exception.\n\n# with suppress(ValueError, TypeError) as s:\n#     int(\"bad\")\n# print(s.exception)  # ValueError: invalid literal...", answer: "class suppress:\n    def __init__(self, *exceptions):\n        self.exceptions = exceptions\n        self.exception = None\n    def __enter__(self):\n        return self\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        if exc_type and issubclass(exc_type, self.exceptions):\n            self.exception = exc_val\n            return True\n        return False", hint: "Return True from __exit__ to suppress. Use issubclass to check.", refs: [{ label: "Context Manager Types", url: "https://docs.python.org/3/reference/datamodel.html#context-managers" }] }
    ]
  },
  "comprehensions-adv": {
    name: "The Nested Nightmare", icon: "\u{1F578}\uFE0F",
    color: "from-purple-900 to-indigo-950", border: "border-purple-700",
    intro: "I weave webs of nested loops and conditions... Can you unravel my comprehensions?",
    rounds: [
      { type: "output", prompt: "Round 1/3 \u2014 What does this print?\n\nmatrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nresult = [row[i] for i in range(3) for row in matrix]\nprint(result)", answer: "[1, 4, 7, 2, 5, 8, 3, 6, 9]", hint: "Outer loop is i, inner is row. This reads columns: i=0 gives row[0] for each row.", refs: [{ label: "List Comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions" }] },
      { type: "bugfix", prompt: "Round 2/3 \u2014 Should invert dict mapping values to LISTS of keys.\n\noriginal = {\"a\": 1, \"b\": 2, \"c\": 1}\ninverted = {v: k for k, v in original.items()}\nprint(inverted)\n# Expected: {1: ['a', 'c'], 2: ['b']}", answer: "from collections import defaultdict\n\noriginal = {\"a\": 1, \"b\": 2, \"c\": 1}\ninverted = defaultdict(list)\nfor k, v in original.items():\n    inverted[v].append(k)\ninverted = dict(inverted)\nprint(inverted)", hint: "A dict comprehension can't accumulate multiple values per key. Use defaultdict(list).", refs: [{ label: "collections.defaultdict", url: "https://docs.python.org/3/library/collections.html#collections.defaultdict" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Using a single dict comprehension, map each character\nto its frequency count. Only include characters appearing more than once.\n\ntext = \"abracadabra\"\n# Expected: {'a': 5, 'b': 2, 'r': 2}", answer: "text = \"abracadabra\"\nfreq = {c: text.count(c) for c in set(text) if text.count(c) > 1}", hint: "Use set(text) for unique chars, text.count(c) for frequency, if clause to filter.", refs: [{ label: "Dict Comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" }] }
    ]
  },
  "fstrings": {
    name: "The Format Fiend", icon: "\u{1F4DC}",
    color: "from-emerald-900 to-green-950", border: "border-emerald-700",
    intro: "I twist every string into unreadable chaos! Only a master of f-string formatting can defeat my garbled output!",
    rounds: [
      { type: "output", prompt: "Round 1/3 \u2014 Predict the output:\n\nval = 42.567\nname = \"pi-ish\"\nprint(f\"{name:>10}: {val:08.2f}\")\nprint(f\"{1000000:,.0f}\")\nprint(f\"{'test':*^20}\")", answer: "    pi-ish: 00042.57\n1,000,000\n********test********", hint: ">10 right-aligns. 08.2f zero-pads to width 8. *^20 centers with * fill.", refs: [{ label: "Format Specification Mini-Language", url: "https://docs.python.org/3/library/string.html#format-specification-mini-language" }] },
      { type: "bugfix", prompt: "Round 2/3 \u2014 Fix the quoting issue:\n\ndata = {\"key\": \"value\"}\nprice = 19.99\nprint(f\"Dict: {data[\"key\"]}\")\nprint(f\"Debug: {price = :.2f}\")", answer: "data = {\"key\": \"value\"}\nprice = 19.99\nprint(f\"Dict: {data['key']}\")\nprint(f\"Debug: {price = :.2f}\")", hint: "Inside double-quoted f-string, use single quotes for dict key access.", refs: [{ label: "Formatted String Literals", url: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Write table_row(name, score, max_score) that returns:\n\"Player_1     ....  85/100  ( 85.0%)\"\n\nname left-aligned 12 chars, dot-filled to 18 total,\nscore as X/Y right-aligned 8 chars, percentage with 1 decimal.", answer: "def table_row(name, score, max_score):\n    pct = score / max_score * 100\n    return f\"{name:.<18s}{score:>4d}/{max_score:<4d} ({pct:5.1f}%)\"", hint: "Use .<18 for dot-filled alignment. > for right-align score.", refs: [{ label: "Format Specification Mini-Language", url: "https://docs.python.org/3/library/string.html#format-specification-mini-language" }] }
    ]
  },
  "context-managers": {
    name: "The Resource Leak", icon: "\u{1F30A}",
    color: "from-cyan-900 to-teal-950", border: "border-cyan-700",
    intro: "I am the Resource Leak... Every unclosed file, every dangling connection flows into my ocean of wasted memory!",
    rounds: [
      { type: "output", prompt: "Round 1/3 \u2014 Predict the flow:\n\nfrom contextlib import contextmanager\n\n@contextmanager\ndef leak_trap(name):\n    print(f\"opening {name}\")\n    try:\n        yield name.upper()\n    finally:\n        print(f\"closing {name}\")\n\nwith leak_trap(\"db\") as conn:\n    print(f\"using {conn}\")\n    print(\"done\")", answer: "opening db\nusing DB\ndone\nclosing db", hint: "Code before yield runs on entry, yield provides the as value, code after runs on exit.", refs: [{ label: "contextlib.contextmanager", url: "https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager" }] },
      { type: "bugfix", prompt: "Round 2/3 \u2014 Timer always prints 0 seconds:\n\nimport time\nfrom contextlib import contextmanager\n\n@contextmanager\ndef timed():\n    start = time.perf_counter()\n    elapsed = time.perf_counter() - start\n    yield\n    print(f\"Elapsed: {elapsed:.4f}s\")\n\nwith timed():\n    time.sleep(0.1)", answer: "import time\nfrom contextlib import contextmanager\n\n@contextmanager\ndef timed():\n    start = time.perf_counter()\n    yield\n    elapsed = time.perf_counter() - start\n    print(f\"Elapsed: {elapsed:.4f}s\")\n\nwith timed():\n    time.sleep(0.1)", hint: "elapsed is computed BEFORE yield. Move it AFTER yield.", refs: [{ label: "contextlib.contextmanager", url: "https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Write a class TempDir that creates a temp directory on enter,\nyields its path, and deletes it on exit. Use tempfile and shutil.", answer: "import tempfile\nimport shutil\nfrom pathlib import Path\n\nclass TempDir:\n    def __enter__(self):\n        self.path = Path(tempfile.mkdtemp())\n        return self.path\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        shutil.rmtree(self.path)\n        return False", hint: "Use tempfile.mkdtemp() to create, shutil.rmtree() to delete.", refs: [{ label: "tempfile.mkdtemp", url: "https://docs.python.org/3/library/tempfile.html#tempfile.mkdtemp" }] }
    ]
  },
  "lambda-functional": {
    name: "The Anonymous Sorcerer", icon: "\u{1F9D9}",
    color: "from-violet-900 to-purple-950", border: "border-violet-700",
    intro: "I have no name, yet I am everywhere... Can you command my anonymous power?",
    rounds: [
      { type: "output", prompt: "Round 1/3 \u2014 What does this produce?\n\nfrom functools import reduce\n\nnums = [3, 1, 4, 1, 5, 9]\na = sorted(nums, key=lambda x: -x)\nb = list(map(lambda x: x ** 2, filter(lambda x: x > 3, nums)))\nc = reduce(lambda acc, x: acc * x, nums)\nprint(a)\nprint(b)\nprint(c)", answer: "[9, 5, 4, 3, 1, 1]\n[16, 25, 81]\n540", hint: "key=-x gives descending. filter keeps >3 [4,5,9], map squares. reduce multiplies all.", refs: [{ label: "functools.reduce", url: "https://docs.python.org/3/library/functools.html#functools.reduce" }] },
      { type: "bugfix", prompt: "Round 2/3 \u2014 Classic closure trap. Each lambda should multiply by 0, 1, 2:\n\nmultipliers = [lambda x: x * i for i in range(3)]\nprint([m(10) for m in multipliers])\n# Expected: [0, 10, 20]\n# Actual:   [20, 20, 20]", answer: "multipliers = [lambda x, i=i: x * i for i in range(3)]\nprint([m(10) for m in multipliers])", hint: "Lambdas capture i by reference. Use default argument i=i to capture current value.", refs: [{ label: "Lambda Expressions", url: "https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Write compose(*funcs) that chains single-arg functions right-to-left.\n\n# f = compose(square, inc, double)\n# f(3)  # square(inc(double(3))) = 49", answer: "from functools import reduce\n\ndef compose(*funcs):\n    return lambda x: reduce(lambda acc, f: f(acc), reversed(funcs), x)", hint: "Use reduce with reversed(funcs). Accumulator starts with x.", refs: [{ label: "functools.reduce", url: "https://docs.python.org/3/library/functools.html#functools.reduce" }] }
    ]
  },
  "dataclasses": {
    name: "The Boilerplate Golem", icon: "\u{1F5FF}",
    color: "from-stone-800 to-gray-950", border: "border-stone-600",
    intro: "I am forged from a thousand lines of __init__, __repr__, __eq__... Can your @dataclass defeat me?",
    rounds: [
      { type: "output", prompt: "Round 1/3 \u2014 What does this print?\n\nfrom dataclasses import dataclass, field\n\n@dataclass(order=True)\nclass Golem:\n    power: int\n    name: str = field(compare=False)\n\na = Golem(10, \"Stone\")\nb = Golem(10, \"Iron\")\nc = Golem(20, \"Diamond\")\nprint(a == b)\nprint(sorted([c, a], key=lambda g: g.power))", answer: "True\n[Golem(power=10, name='Stone'), Golem(power=20, name='Diamond')]", hint: "compare=False on name means equality only checks power.", refs: [{ label: "dataclasses.field", url: "https://docs.python.org/3/library/dataclasses.html#dataclasses.field" }] },
      { type: "bugfix", prompt: "Round 2/3 \u2014 This dataclass has a mutable default bug:\n\nfrom dataclasses import dataclass\n\n@dataclass\nclass Inventory:\n    items: list = []\n    owner: str = \"player\"\n\ninv = Inventory()\ninv.items.append(\"sword\")", answer: "from dataclasses import dataclass, field\n\n@dataclass\nclass Inventory:\n    items: list = field(default_factory=list)\n    owner: str = \"player\"\n\ninv = Inventory()\ninv.items.append(\"sword\")", hint: "Mutable defaults like [] are shared. Use field(default_factory=list).", refs: [{ label: "Mutable Default Values", url: "https://docs.python.org/3/library/dataclasses.html#mutable-default-values" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Create a frozen dataclass Vector3 with x, y, z (float, default 0.0).\nAdd magnitude() returning Euclidean length, and __add__ for vector addition.\n\n# v = Vector3(1.0, 2.0, 2.0)\n# v.magnitude()  # 3.0\n# v + Vector3(1.0, 0.0, 0.0)  # Vector3(x=2.0, y=2.0, z=2.0)", answer: "from dataclasses import dataclass\nimport math\n\n@dataclass(frozen=True)\nclass Vector3:\n    x: float = 0.0\n    y: float = 0.0\n    z: float = 0.0\n\n    def magnitude(self) -> float:\n        return math.sqrt(self.x**2 + self.y**2 + self.z**2)\n\n    def __add__(self, other):\n        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)", hint: "frozen=True for immutability. __add__ returns a NEW Vector3.", refs: [{ label: "dataclasses \u2014 frozen", url: "https://docs.python.org/3/library/dataclasses.html#frozen-instances" }] }
    ]
  },
  "decorators": {
    name: "The Wrapper Wraith", icon: "\u{1F464}",
    color: "from-fuchsia-900 to-pink-950", border: "border-fuchsia-700",
    intro: "I wrap myself around your functions like a shadow... Layer after layer. Unwrap me if you dare!",
    rounds: [
      { type: "output", prompt: "Round 1/3 \u2014 Trace the stacked decorators:\n\nimport functools\n\ndef upper(func):\n    @functools.wraps(func)\n    def wrapper(*a, **kw):\n        return func(*a, **kw).upper()\n    return wrapper\n\ndef exclaim(func):\n    @functools.wraps(func)\n    def wrapper(*a, **kw):\n        return func(*a, **kw) + \"!!!\"\n    return wrapper\n\n@exclaim\n@upper\ndef whisper(text):\n    return text\n\nprint(whisper(\"help\"))", answer: "HELP!!!", hint: "Bottom-up: @upper wraps first (HELP), then @exclaim adds !!!.", refs: [{ label: "Decorators", url: "https://docs.python.org/3/glossary.html#term-decorator" }] },
      { type: "bugfix", prompt: "Round 2/3 \u2014 Memoize doesn't work with keyword arguments:\n\ndef memoize(func):\n    cache = {}\n    def wrapper(*args, **kwargs):\n        key = args\n        if key not in cache:\n            cache[key] = func(*args, **kwargs)\n        return cache[key]\n    return wrapper\n\n@memoize\ndef add(a, b):\n    print(\"computing\")\n    return a + b\n\nadd(1, 2)      # computing\nadd(1, b=2)    # should use cache but computes again", answer: "def memoize(func):\n    cache = {}\n    def wrapper(*args, **kwargs):\n        key = (args, tuple(sorted(kwargs.items())))\n        if key not in cache:\n            cache[key] = func(*args, **kwargs)\n        return cache[key]\n    return wrapper\n\n@memoize\ndef add(a, b):\n    print(\"computing\")\n    return a + b", hint: "Cache key only uses args, ignoring kwargs. Include kwargs as tuple(sorted(kwargs.items())).", refs: [{ label: "functools.lru_cache", url: "https://docs.python.org/3/library/functools.html#functools.lru_cache" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Write rate_limit(max_calls, period) decorator that raises\nRuntimeError if called more than max_calls times within period seconds.\nUse a deque to track timestamps.", answer: "import functools\nimport time\nfrom collections import deque\n\ndef rate_limit(max_calls, period):\n    def decorator(func):\n        calls = deque()\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            now = time.perf_counter()\n            while calls and calls[0] <= now - period:\n                calls.popleft()\n            if len(calls) >= max_calls:\n                raise RuntimeError(f\"Rate limit exceeded\")\n            calls.append(now)\n            return func(*args, **kwargs)\n        return wrapper\n    return decorator", hint: "Use deque for timestamps. Remove expired ones, check length vs max_calls.", refs: [{ label: "collections.deque", url: "https://docs.python.org/3/library/collections.html#collections.deque" }] }
    ]
  },
  "generators": {
    name: "The Infinite Iterator", icon: "\u221E",
    color: "from-sky-900 to-blue-950", border: "border-sky-700",
    intro: "I never end... I yield and yield and yield. Can you tame my laziness, or will you exhaust your memory trying?",
    rounds: [
      { type: "output", prompt: "Round 1/3 \u2014 What does this produce?\n\nfrom itertools import takewhile, dropwhile, accumulate\n\ndata = [1, 3, 5, 2, 4, 6]\na = list(takewhile(lambda x: x < 5, data))\nb = list(dropwhile(lambda x: x < 5, data))\nc = list(accumulate(data))\nprint(a)\nprint(b)\nprint(c)", answer: "[1, 3]\n[5, 2, 4, 6]\n[1, 4, 9, 11, 15, 21]", hint: "takewhile stops at first failure. dropwhile starts yielding from first failure. accumulate gives running sums.", refs: [{ label: "itertools.takewhile", url: "https://docs.python.org/3/library/itertools.html#itertools.takewhile" }] },
      { type: "bugfix", prompt: "Round 2/3 \u2014 This sieve should yield first 5 primes but hangs:\n\ndef integers(start=2):\n    while True:\n        yield start\n        start += 1\n\ndef sieve(nums):\n    while True:\n        prime = next(nums)\n        yield prime\n        nums = filter(lambda x: x % prime != 0, nums)\n\nfrom itertools import islice\nprint(list(islice(sieve(integers()), 5)))", answer: "def integers(start=2):\n    while True:\n        yield start\n        start += 1\n\ndef sieve(nums):\n    while True:\n        prime = next(nums)\n        yield prime\n        nums = (x for x in nums if x % prime != 0)\n\nfrom itertools import islice\nprint(list(islice(sieve(integers()), 5)))", hint: "Lambda captures prime by reference. Use a generator expression instead.", refs: [{ label: "filter", url: "https://docs.python.org/3/library/functions.html#filter" }] },
      { type: "scratch", prompt: "Round 3/3 \u2014 Write batched(iterable, n) yielding tuples of up to n items.\nDo NOT use itertools.batched (3.12+).\n\n# list(batched(range(7), 3))\n# [(0,1,2), (3,4,5), (6,)]", answer: "from itertools import islice\n\ndef batched(iterable, n):\n    it = iter(iterable)\n    while True:\n        batch = tuple(islice(it, n))\n        if not batch:\n            break\n        yield batch", hint: "Use islice(it, n) to take up to n items. Stop when batch is empty.", refs: [{ label: "itertools Recipes", url: "https://docs.python.org/3/library/itertools.html#itertools-recipes" }] }
    ]
  },
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
          { type: "output", label: "Predict the Output", prompt: "What does this print?\n\nfor i in range(4):\n    if i % 2 != 0:\n        print(i * 10)", answer: "10\n30", hint: "range(4) = 0,1,2,3. Which are odd?", refs: [{ label: "range()", url: "https://docs.python.org/3/library/stdtypes.html#range" }, { label: "if statements", url: "https://docs.python.org/3/tutorial/controlflow.html#if-statements" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "Should print 1 through 5. Two bugs — find and fix them.\n\nfor i in range(1, 5)\n    print[i]", answer: "for i in range(1, 6):\n    print(i)", hint: "Missing colon, wrong brackets on print, and off-by-one in range.", refs: [{ label: "for statements", url: "https://docs.python.org/3/tutorial/controlflow.html#for-statements" }, { label: "print()", url: "https://docs.python.org/3/library/functions.html#print" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a loop that prints every even number from 2 to 10 inclusive.", answer: "for i in range(2, 11, 2):\n    print(i)", hint: "range() takes an optional step argument.", refs: [{ label: "range()", url: "https://docs.python.org/3/library/stdtypes.html#range" }, { label: "for statements", url: "https://docs.python.org/3/tutorial/controlflow.html#for-statements" }] }
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
          { type: "output", label: "Predict the Output", prompt: "What prints?\n\ndef add(a, b=10):\n    return a + b\n\nprint(add(5))\nprint(add(5, 3))", answer: "15\n8", hint: "First call uses default b=10.", refs: [{ label: "Defining functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" }, { label: "Default argument values", url: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "Two bugs. Fix them.\n\ndef square(n)\n    return n * n\n\nprint(square(4))", answer: "def square(n):\n    return n * n\n\nprint(square(4))", hint: "Missing colon after def. Check indentation too.", refs: [{ label: "Defining functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write celsius_to_fahrenheit(c) that returns F = C * 9/5 + 32.", answer: "def celsius_to_fahrenheit(c):\n    return c * 9/5 + 32", hint: "def, one parameter, return with the formula.", refs: [{ label: "Defining functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" }, { label: "return statement", url: "https://docs.python.org/3/reference/simple_stmts.html#the-return-statement" }] }
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
          { type: "output", label: "Predict the Output", prompt: 'What prints?\n\nd = {"x": 3, "y": 7}\nfor k, v in d.items():\n    print(k, v * 2)', answer: "x 6\ny 14", hint: "Loop over items() gives key and value. Multiply each value by 2.", refs: [{ label: "dict.items()", url: "https://docs.python.org/3/library/stdtypes.html#dict.items" }, { label: "Dictionaries", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: 'Two errors. Fix them.\n\nfruits = ["apple", "banana"]\nfruits.add("cherry")\nprint(length(fruits))', answer: 'fruits = ["apple", "banana"]\nfruits.append("cherry")\nprint(len(fruits))', hint: "Lists use append(), not add(). Length is len(), not length().", refs: [{ label: "list.append()", url: "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists" }, { label: "len()", url: "https://docs.python.org/3/library/functions.html#len" }] },
          { type: "scratch", label: "Write from Scratch", prompt: 'Create a dict "person" with keys "name" and "age", then print each key-value pair with a loop.', answer: 'person = {"name": "Rahul", "age": 30}\nfor k, v in person.items():\n    print(k, v)', hint: "Create with {}, loop with .items().", refs: [{ label: "Dictionaries", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" }, { label: "Looping techniques", url: "https://docs.python.org/3/tutorial/datastructures.html#looping-techniques" }] }
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
          { type: "output", label: "Predict the Output", prompt: "What does this produce?\n\nresult = [x**2 for x in range(5) if x % 2 == 0]\nprint(result)", answer: "[0, 4, 16]", hint: "range(5)=0-4. Even ones are 0,2,4. Square them.", refs: [{ label: "List comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "Should uppercase each word.\n\nwords = ['hello','world']\nresult = [w.upper for w in words]", answer: "words = ['hello','world']\nresult = [w.upper() for w in words]", hint: "upper is a method — needs ().", refs: [{ label: "str.upper()", url: "https://docs.python.org/3/library/stdtypes.html#str.upper" }, { label: "List comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "One-liner: list of lengths of each word in:\nwords = ['python', 'is', 'fun']", answer: "lengths = [len(w) for w in words]", hint: "Apply len() inside the comprehension.", refs: [{ label: "List comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions" }, { label: "len()", url: "https://docs.python.org/3/library/functions.html#len" }] }
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
          { type: "output", label: "Predict the Output", prompt: "What prints?\n\nfirst, *middle, last = [10,20,30,40,50]\nprint(first)\nprint(middle)\nprint(last)", answer: "10\n[20, 30, 40]\n50", hint: "* in the middle collects everything that's not first or last.", refs: [{ label: "Tuples and sequences", url: "https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences" }, { label: "Assignment statements (*target)", url: "https://docs.python.org/3/reference/simple_stmts.html#assignment-statements" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "Should swap a and b. Fix it.\n\na = 1\nb = 2\na = b\nb = a\nprint(a, b)  # want: 2 1", answer: "a = 1\nb = 2\na, b = b, a\nprint(a, b)", hint: "Do it in one line: a, b = b, a", refs: [{ label: "Tuples and sequences", url: "https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Unpack coords = (3, 7, 2) into x, y, z and print their sum.", answer: "x, y, z = coords\nprint(x + y + z)", hint: "Three vars on the left.", refs: [{ label: "Tuples and sequences", url: "https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences" }, { label: "Unpacking", url: "https://docs.python.org/3/tutorial/controlflow.html#unpacking-argument-lists" }] }
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
          { type: "output", label: "Predict the Output", prompt: "Type hints don't affect runtime. What prints?\n\ndef add(a: int, b: int) -> int:\n    return a + b\n\nprint(add(2.5, 3.5))", answer: "6.0", hint: "Python doesn't enforce type hints — floats add normally.", refs: [{ label: "Type hints (typing module)", url: "https://docs.python.org/3/library/typing.html" }, { label: "Function annotations", url: "https://docs.python.org/3/tutorial/controlflow.html#function-annotations" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "Fix the return type annotation.\n\ndef greet(name: str) str:\n    return 'Hello, ' + name", answer: "def greet(name: str) -> str:\n    return 'Hello, ' + name", hint: "Return type uses -> before the type.", refs: [{ label: "Function annotations", url: "https://docs.python.org/3/tutorial/controlflow.html#function-annotations" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write multiply(a, b) with float type hints and a one-line docstring.", answer: 'def multiply(a: float, b: float) -> float:\n    """Return the product of a and b."""\n    return a * b', hint: "Annotate params and return, then triple-quoted docstring.", refs: [{ label: "Function annotations", url: "https://docs.python.org/3/tutorial/controlflow.html#function-annotations" }, { label: "Docstring conventions", url: "https://peps.python.org/pep-0257/" }] }
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
          { type: "output", label: "Predict the Output", prompt: "Careful — it's a trap.\n\ndef append_val(val, lst=[]):\n    lst.append(val)\n    return lst\n\nprint(append_val(1))\nprint(append_val(2))\nprint(append_val(3))", answer: "[1]\n[1, 2]\n[1, 2, 3]", hint: "The default list is shared — it keeps accumulating.", refs: [{ label: "Default argument values", url: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values" }, { label: "Common gotcha: mutable defaults", url: "https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "Fix so each call without a list starts fresh.\n\ndef collect(item, results=[]):\n    results.append(item)\n    return results", answer: "def collect(item, results=None):\n    if results is None:\n        results = []\n    results.append(item)\n    return results", hint: "Default None, initialise inside.", refs: [{ label: "Common gotcha: mutable defaults", url: "https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write safe make_tag_list(tag, tags=None) that appends tag to the list without the mutable default bug.", answer: "def make_tag_list(tag, tags=None):\n    if tags is None:\n        tags = []\n    tags.append(tag)\n    return tags", hint: "Default None, guard with if None, then append.", refs: [{ label: "Common gotcha: mutable defaults", url: "https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects" }, { label: "list.append()", url: "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists" }] }
        ]
      }
    ]
  },
  {
    id: "error-handling", title: "Error Handling", icon: "\u{1F6E1}\uFE0F",
    color: "from-amber-600 to-orange-700",
    description: "try/except, raising, and custom exceptions.",
    lessons: [
      {
        id: "try-except", title: "Try / Except / Finally",
        theory: `Python's \`try/except\` lets you intercept runtime errors. Add \`else\` for code that runs only when no exception occurred, and \`finally\` for guaranteed cleanup.

\`\`\`python
try:
    result = int(input())
except ValueError as e:
    print(f"Bad input: {e}")
else:
    print(f"Got {result}")
finally:
    print("Done")
\`\`\`

You can catch multiple exception types in one \`except\` with a tuple, or stack separate \`except\` blocks to handle each differently. The \`else\` block is useful for keeping the \`try\` body minimal — only wrap the line that might throw.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "What does this print?\n\ntry:\n    x = 1 / 0\nexcept ZeroDivisionError:\n    print(\"caught\")\nfinally:\n    print(\"cleanup\")", answer: "caught\ncleanup", hint: "The except block catches the error, then finally always runs regardless.", refs: [{ label: "Errors and Exceptions", url: "https://docs.python.org/3/tutorial/errors.html" }] },
          { type: "output", label: "Predict the Output", prompt: "What does this print?\n\ntry:\n    x = int(\"42\")\nexcept ValueError:\n    print(\"error\")\nelse:\n    print(f\"ok: {x}\")\nfinally:\n    print(\"done\")", answer: "ok: 42\ndone", hint: "int('42') succeeds, so except is skipped and else runs. finally always runs.", refs: [{ label: "try statement", url: "https://docs.python.org/3/reference/compound_stmts.html#the-try-statement" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: catch both ValueError and TypeError\ntry:\n    result = int(None)\nexcept ValueError, TypeError:\n    print(\"caught\")", answer: "try:\n    result = int(None)\nexcept (ValueError, TypeError):\n    print(\"caught\")", hint: "Multiple exception types must be wrapped in a tuple — parentheses are required.", refs: [{ label: "Handling Exceptions", url: "https://docs.python.org/3/tutorial/errors.html#handling-exceptions" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: print the exception message when key is missing\nd = {\"a\": 1}\ntry:\n    print(d[\"b\"])\nexcept KeyError:\n    print(f\"Missing key: {e}\")", answer: "d = {\"a\": 1}\ntry:\n    print(d[\"b\"])\nexcept KeyError as e:\n    print(f\"Missing key: {e}\")", hint: "You need to bind the exception to a variable using 'as' to reference it.", refs: [{ label: "Handling Exceptions", url: "https://docs.python.org/3/tutorial/errors.html#handling-exceptions" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a function safe_divide(a, b) that returns a / b.\nIf b is zero, return None instead of raising.\nIf either argument is not a number (TypeError), return None.", answer: "def safe_divide(a, b):\n    try:\n        return a / b\n    except (ZeroDivisionError, TypeError):\n        return None", hint: "Catch both ZeroDivisionError and TypeError in one except clause using a tuple.", refs: [{ label: "Errors and Exceptions", url: "https://docs.python.org/3/tutorial/errors.html" }] }
        ]
      },
      {
        id: "raising-custom", title: "Raising & Custom Exceptions",
        theory: `Use \`raise\` to throw exceptions explicitly. Create custom exception classes by subclassing \`Exception\`.

\`\`\`python
class InsufficientFunds(Exception):
    def __init__(self, balance, amount):
        super().__init__(f"Need {amount}, have {balance}")
        self.balance = balance
        self.amount = amount

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds(balance, amount)
    return balance - amount
\`\`\`

Exception chaining with \`raise ... from ...\` preserves the original cause. Use bare \`raise\` inside an except block to re-raise the current exception.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "What does this print?\n\ndef check(val):\n    if val < 0:\n        raise ValueError(\"negative\")\n    return val * 2\n\ntry:\n    print(check(3))\n    print(check(-1))\nexcept ValueError as e:\n    print(e)", answer: "6\nnegative", hint: "check(3) prints 6. check(-1) raises ValueError, so the except block prints the message.", refs: [{ label: "Raising Exceptions", url: "https://docs.python.org/3/tutorial/errors.html#raising-exceptions" }] },
          { type: "output", label: "Predict the Output", prompt: "class AppError(Exception):\n    pass\n\nclass NotFound(AppError):\n    pass\n\ntry:\n    raise NotFound(\"item 42\")\nexcept AppError as e:\n    print(type(e).__name__, e)", answer: "NotFound item 42", hint: "NotFound is a subclass of AppError, so except AppError catches it.", refs: [{ label: "User-defined Exceptions", url: "https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: custom exception with a status_code attribute\nclass HttpError(Exception):\n    def __init__(self, status_code, msg):\n        self.status_code = status_code\n\ntry:\n    raise HttpError(404, \"Not Found\")\nexcept HttpError as e:\n    print(f\"{e.status_code}: {e}\")", answer: "class HttpError(Exception):\n    def __init__(self, status_code, msg):\n        super().__init__(msg)\n        self.status_code = status_code\n\ntry:\n    raise HttpError(404, \"Not Found\")\nexcept HttpError as e:\n    print(f\"{e.status_code}: {e}\")", hint: "Without calling super().__init__(msg), the exception has no message.", refs: [{ label: "User-defined Exceptions", url: "https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Define a custom exception NegativeAge that stores the invalid age.\nWrite set_age(age) that raises NegativeAge if age < 0, otherwise returns age.\nNegativeAge's message should be \"Invalid age: {age}\".", answer: "class NegativeAge(Exception):\n    def __init__(self, age):\n        super().__init__(f\"Invalid age: {age}\")\n        self.age = age\n\ndef set_age(age):\n    if age < 0:\n        raise NegativeAge(age)\n    return age", hint: "Subclass Exception, call super().__init__ with your formatted message, and store the age attribute.", refs: [{ label: "User-defined Exceptions", url: "https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write parse_config(raw) that tries json.loads(raw).\nIf it raises json.JSONDecodeError, catch it and raise a new\nValueError(\"bad config\") chained from the original error.", answer: "import json\n\ndef parse_config(raw):\n    try:\n        return json.loads(raw)\n    except json.JSONDecodeError as e:\n        raise ValueError(\"bad config\") from e", hint: "Use 'raise NewException(...) from original' to chain exceptions.", refs: [{ label: "Exception Chaining", url: "https://docs.python.org/3/tutorial/errors.html#exception-chaining" }] }
        ]
      }
    ]
  },
  {
    id: "comprehensions-adv", title: "Dict & Set Comprehensions", icon: "\u{1F5DD}\uFE0F",
    color: "from-cyan-600 to-blue-700",
    description: "Beyond lists \u2014 dict and set comprehensions, nested comprehensions.",
    lessons: [
      {
        id: "dict-comprehensions", title: "Dict Comprehensions",
        theory: `Dict comprehensions use \`{key: value for item in iterable}\` syntax. They're ideal for transforming or filtering mappings in one expression.

\`\`\`python
original = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in original.items()}

scores = {"alice": 85, "bob": 42, "carol": 91}
passed = {k: v for k, v in scores.items() if v >= 60}
\`\`\`

You can also build dicts from two parallel sequences using \`zip\`, or derive keys/values with arbitrary expressions.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "names = [\"x\", \"y\", \"z\"]\nvals = [10, 20, 30]\nd = {k: v ** 2 for k, v in zip(names, vals)}\nprint(d)", answer: "{'x': 100, 'y': 400, 'z': 900}", hint: "zip pairs the lists element-wise. Each value is squared.", refs: [{ label: "Dict Comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" }] },
          { type: "output", label: "Predict the Output", prompt: "src = {\"A\": 1, \"B\": 2, \"C\": 3, \"D\": 4}\nout = {k: v for k, v in src.items() if v % 2 == 0}\nprint(out)", answer: "{'B': 2, 'D': 4}", hint: "The if clause filters to even values only.", refs: [{ label: "Comprehension docs", url: "https://docs.python.org/3/reference/expressions.html#displays-for-lists-sets-and-dictionaries" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: invert dict so values become keys\nm = {\"host\": \"localhost\", \"port\": \"5432\"}\ninv = [v, k for k, v in m.items()]\nprint(inv)", answer: "m = {\"host\": \"localhost\", \"port\": \"5432\"}\ninv = {v: k for k, v in m.items()}\nprint(inv)", hint: "Dict comprehensions use curly braces and a colon, not square brackets and comma.", refs: [{ label: "Dict Comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Given pairs = [(\"a\", 1), (\"b\", 2), (\"c\", 3)],\nuse a dict comprehension to create a dict with keys uppercased\nand values doubled. e.g. {\"A\": 2, \"B\": 4, \"C\": 6}", answer: "pairs = [(\"a\", 1), (\"b\", 2), (\"c\", 3)]\nresult = {k.upper(): v * 2 for k, v in pairs}", hint: "Unpack each tuple in the for clause, apply .upper() to the key and multiply the value.", refs: [{ label: "Dict Comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: count word lengths\nwords = [\"hello\", \"hi\", \"hey\"]\nlengths = {w, len(w) for w in words}\nprint(lengths)", answer: "words = [\"hello\", \"hi\", \"hey\"]\nlengths = {w: len(w) for w in words}\nprint(lengths)", hint: "Use a colon between key and value. A comma creates a set of tuples.", refs: [{ label: "Comprehension displays", url: "https://docs.python.org/3/reference/expressions.html#displays-for-lists-sets-and-dictionaries" }] }
        ]
      },
      {
        id: "set-nested-comprehensions", title: "Set Comprehensions & Nested",
        theory: `Set comprehensions look like dict comprehensions but without the colon: \`{expr for item in iterable}\`. They automatically deduplicate.

\`\`\`python
nums = [1, 2, 2, 3, 3, 3]
unique_squares = {x ** 2 for x in nums}  # {1, 4, 9}
\`\`\`

Nested comprehensions flatten loops. Read them left-to-right:

\`\`\`python
matrix = [[1, 2], [3, 4], [5, 6]]
flat = [val for row in matrix for val in row]
# [1, 2, 3, 4, 5, 6]
\`\`\`

Replace outer brackets with parentheses for a generator expression \u2014 lazy and memory-efficient.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "words = [\"Hello\", \"HELLO\", \"hello\", \"World\"]\nlowered = {w.lower() for w in words}\nprint(sorted(lowered))", answer: "['hello', 'world']", hint: "All variations of 'hello' collapse into one in the set.", refs: [{ label: "Sets", url: "https://docs.python.org/3/tutorial/datastructures.html#sets" }] },
          { type: "output", label: "Predict the Output", prompt: "matrix = [[1, 2, 3], [4, 5, 6]]\nflat = [v for row in matrix for v in row if v % 2 == 1]\nprint(flat)", answer: "[1, 3, 5]", hint: "The nested comprehension flattens first, then the if clause keeps only odd values.", refs: [{ label: "Nested List Comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#nested-list-comprehensions" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: flatten [[1,2],[3,4]] into [1,2,3,4]\nmatrix = [[1, 2], [3, 4]]\nflat = [val for val in row for row in matrix]\nprint(flat)", answer: "matrix = [[1, 2], [3, 4]]\nflat = [val for row in matrix for val in row]\nprint(flat)", hint: "The outer loop comes first. Read it like: for row in matrix: for val in row.", refs: [{ label: "Nested List Comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#nested-list-comprehensions" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Given data = {\"a\": [1, 2], \"b\": [3, 2], \"c\": [1, 4]},\nuse a set comprehension to collect all unique values.\nExpected: {1, 2, 3, 4}", answer: "data = {\"a\": [1, 2], \"b\": [3, 2], \"c\": [1, 4]}\nresult = {v for lst in data.values() for v in lst}", hint: "Iterate over data.values() to get the lists, then over each list.", refs: [{ label: "Sets", url: "https://docs.python.org/3/tutorial/datastructures.html#sets" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Use a generator expression with sum() to compute the total of\nall even numbers from 1 to 100 inclusive. Store in variable total.", answer: "total = sum(x for x in range(1, 101) if x % 2 == 0)", hint: "sum() accepts a generator expression directly.", refs: [{ label: "Generator Expressions", url: "https://docs.python.org/3/reference/expressions.html#generator-expressions" }] }
        ]
      }
    ]
  },
  {
    id: "fstrings", title: "f-strings & Formatting", icon: "\u{1F4DD}",
    color: "from-pink-600 to-rose-700",
    description: "Modern string formatting, alignment, and debug tricks.",
    lessons: [
      {
        id: "fstring-basics", title: "f-string Basics & Expressions",
        theory: `f-strings (Python 3.6+) embed expressions directly in string literals with \`f"...{expr}..."\`. Any valid expression works inside the braces.

\`\`\`python
name = "Ada"
scores = [90, 85, 92]
print(f"{name.lower()} avg: {sum(scores)/len(scores):.1f}")
# ada avg: 89.0
\`\`\`

Since Python 3.12, you can freely nest quotes inside f-string braces.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "x, y = 3, 4\nprint(f\"hyp={(x**2 + y**2) ** 0.5}\")", answer: "hyp=5.0", hint: "3**2 + 4**2 = 25, and 25**0.5 = 5.0.", refs: [{ label: "Formatted string literals", url: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings" }] },
          { type: "output", label: "Predict the Output", prompt: "items = [\"a\", \"b\", \"c\"]\nprint(f\"count={len(items)}, last={items[-1].upper()}\")", answer: "count=3, last=C", hint: "len(items) is 3, items[-1] is 'c', and .upper() makes it 'C'.", refs: [{ label: "Formatted string literals", url: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: print \"status: ACTIVE\"\nstatus = \"active\"\nprint(f\"status: {status.upper}\")", answer: "status = \"active\"\nprint(f\"status: {status.upper()}\")", hint: "upper is a method \u2014 you need parentheses to call it.", refs: [{ label: "String Methods", url: "https://docs.python.org/3/library/stdtypes.html#string-methods" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: print \"She said 'hello'\"\nword = \"hello\"\nmsg = f'She said \\'{word}\\''\nprint(msg)", answer: "word = \"hello\"\nmsg = f\"She said '{word}'\"\nprint(msg)", hint: "Use double quotes on the outside to avoid conflicting with inner single quotes.", refs: [{ label: "Formatted string literals", url: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Given nums = [10, 20, 30], use a single f-string to produce:\n\"items: 10, 20, 30 (total: 60)\"\nStore it in variable result.", answer: "nums = [10, 20, 30]\nresult = f\"items: {', '.join(str(n) for n in nums)} (total: {sum(nums)})\"", hint: "Use ', '.join() with a generator inside the f-string braces.", refs: [{ label: "str.join", url: "https://docs.python.org/3/library/stdtypes.html#str.join" }] }
        ]
      },
      {
        id: "format-specs-debug", title: "Format Specs & Debug",
        theory: `After the expression, add \`:\` followed by a format spec: \`f"{value:spec}"\`.

\`\`\`python
pi = 3.14159
print(f"{pi:.2f}")      # 3.14
print(f"{1000000:,}")    # 1,000,000
print(f"{'hi':>10}")     #         hi
print(f"{'hi':-^10}")    # ----hi----
\`\`\`

The \`=\` debug specifier (Python 3.8+) prints both expression and value:

\`\`\`python
x = 42
print(f"{x = }")   # x = 42
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "val = 3.14159\nprint(f\"{val:.3f}\")\nprint(f\"{1234567:,}\")", answer: "3.142\n1,234,567", hint: ":.3f rounds to 3 decimal places. :, adds thousand separators.", refs: [{ label: "Format Specification Mini-Language", url: "https://docs.python.org/3/library/string.html#format-specification-mini-language" }] },
          { type: "output", label: "Predict the Output", prompt: "word = \"py\"\nprint(f\"{word:*>6}\")\nprint(f\"{word:*^6}\")", answer: "****py\n**py**", hint: "> right-aligns, ^ centers. Fill char is *, width is 6.", refs: [{ label: "Format Specification Mini-Language", url: "https://docs.python.org/3/library/string.html#format-specification-mini-language" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Goal: print \"price = 9.99\" using = debug specifier\nprice = 9.99\nprint(f\"{price:=}\")", answer: "price = 9.99\nprint(f\"{price = }\")", hint: "The = debug specifier goes after the expression, not inside the format spec.", refs: [{ label: "Formatted string literals", url: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write format_table(rows) where rows is a list of (name, score) tuples.\nReturn a string with one line per row: name left-aligned in 12 chars,\npipe separator, score right-aligned in 6 chars with 1 decimal.\nExample row: \"Alice       |  85.0\"", answer: "def format_table(rows):\n    lines = [f\"{name:<12}|{score:>6.1f}\" for name, score in rows]\n    return \"\\n\".join(lines)", hint: "Use :<12 for left-align and :>6.1f for right-align with 1 decimal.", refs: [{ label: "Format Specification Mini-Language", url: "https://docs.python.org/3/library/string.html#format-specification-mini-language" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write debug_vars(**kwargs) that returns a string with each\nkey-value pair as \"key = value\", separated by \", \".\ne.g. debug_vars(x=1, y=2) -> \"x = 1, y = 2\"", answer: "def debug_vars(**kwargs):\n    parts = [f\"{k} = {v}\" for k, v in kwargs.items()]\n    return \", \".join(parts)", hint: "Iterate over kwargs.items() and format each pair.", refs: [{ label: "Formatted string literals", url: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings" }] }
        ]
      }
    ]
  },
  {
    id: "context-managers", title: "Context Managers", icon: "\u{1F6AA}",
    color: "from-teal-600 to-emerald-700",
    description: "with statements, file handling, and writing your own context managers.",
    lessons: [
      {
        id: "with-statement", title: "The with Statement",
        theory: `The \`with\` statement guarantees cleanup even if an exception occurs. Most common use is file I/O:

\`\`\`python
with open("data.csv") as f:
    contents = f.read()
# f is automatically closed here
\`\`\`

You can manage multiple resources in a single \`with\`:

\`\`\`python
with open("in.txt") as src, open("out.txt", "w") as dst:
    dst.write(src.read())
\`\`\`

The \`with\` statement calls \`__enter__\` on entry and \`__exit__\` on exit.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "class Gate:\n    def __enter__(self):\n        print(\"enter\")\n        return self\n    def __exit__(self, *args):\n        print(\"exit\")\n\nwith Gate() as g:\n    print(\"inside\")", answer: "enter\ninside\nexit", hint: "__enter__ runs first, then the block body, then __exit__.", refs: [{ label: "With Statement Context Managers", url: "https://docs.python.org/3/reference/datamodel.html#with-statement-context-managers" }] },
          { type: "output", label: "Predict the Output", prompt: "class Suppress:\n    def __enter__(self):\n        return self\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        if exc_type is ValueError:\n            print(\"caught\")\n            return True\n        return False\n\nwith Suppress():\n    raise ValueError(\"oops\")\nprint(\"done\")", answer: "caught\ndone", hint: "Returning True from __exit__ suppresses the exception.", refs: [{ label: "With Statement Context Managers", url: "https://docs.python.org/3/reference/datamodel.html#with-statement-context-managers" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# File ends up empty because data is never flushed\nf = open(\"log.txt\", \"w\")\nf.write(\"line 1\\n\")\nf.write(\"line 2\\n\")\n# program crashes here", answer: "with open(\"log.txt\", \"w\") as f:\n    f.write(\"line 1\\n\")\n    f.write(\"line 2\\n\")", hint: "Wrap file operations in a with statement so close() is guaranteed.", refs: [{ label: "Reading and Writing Files", url: "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Refactor nested with into a single statement\nwith open(\"a.txt\") as src:\n    with open(\"b.txt\", \"w\") as dst:\n        for line in src:\n            dst.write(line)", answer: "with open(\"a.txt\") as src, open(\"b.txt\", \"w\") as dst:\n    for line in src:\n        dst.write(line)", hint: "Python allows comma-separated context managers in one with statement.", refs: [{ label: "The with statement", url: "https://docs.python.org/3/reference/compound_stmts.html#the-with-statement" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write code that reads \"numbers.txt\" (one integer per line),\ncomputes the sum, and writes the result to \"total.txt\".\nUse with statements for both files.", answer: "with open(\"numbers.txt\") as f:\n    total = sum(int(line) for line in f)\n\nwith open(\"total.txt\", \"w\") as f:\n    f.write(str(total))", hint: "Iterate over a file object line by line. Use int() and sum().", refs: [{ label: "open() built-in", url: "https://docs.python.org/3/library/functions.html#open" }] }
        ]
      },
      {
        id: "custom-context-managers", title: "Custom Context Managers",
        theory: `Any object with \`__enter__\` and \`__exit__\` is a context manager. For simpler cases, \`contextlib.contextmanager\` lets you write a generator-based one:

\`\`\`python
from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")
    yield
    print(f"</{name}>")
\`\`\`

Everything before \`yield\` is \`__enter__\`, everything after is \`__exit__\`. The yielded value becomes the \`as\` target.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "from contextlib import contextmanager\n\n@contextmanager\ndef section(title):\n    print(f\"--- {title} ---\")\n    yield title.upper()\n    print(\"--- end ---\")\n\nwith section(\"intro\") as s:\n    print(s)", answer: "--- intro ---\nINTRO\n--- end ---", hint: "The yielded value is bound to s. Code before yield runs on entry, after on exit.", refs: [{ label: "contextlib.contextmanager", url: "https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Timer always shows 0 seconds\nimport time\nfrom contextlib import contextmanager\n\n@contextmanager\ndef timed():\n    start = time.perf_counter()\n    elapsed = time.perf_counter() - start\n    yield\n    print(f\"Elapsed: {elapsed:.4f}s\")", answer: "import time\nfrom contextlib import contextmanager\n\n@contextmanager\ndef timed():\n    start = time.perf_counter()\n    yield\n    elapsed = time.perf_counter() - start\n    print(f\"Elapsed: {elapsed:.4f}s\")", hint: "elapsed is computed BEFORE yield. Move it to AFTER yield.", refs: [{ label: "contextlib.contextmanager", url: "https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Timer class: elapsed is always near 0\nimport time\n\nclass Timer:\n    def __enter__(self):\n        self.elapsed = time.perf_counter()\n        return self\n    def __exit__(self, *args):\n        self.elapsed = time.perf_counter()\n        return False", answer: "import time\n\nclass Timer:\n    def __enter__(self):\n        self.start = time.perf_counter()\n        return self\n    def __exit__(self, *args):\n        self.elapsed = time.perf_counter() - self.start\n        return False", hint: "Store start time in __enter__ and compute the difference in __exit__.", refs: [{ label: "time.perf_counter", url: "https://docs.python.org/3/library/time.html#time.perf_counter" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Using @contextmanager, write tempdir() that creates a\ntemporary directory on entry (yield its path), and deletes it\non exit. Use tempfile.mkdtemp and shutil.rmtree.", answer: "from contextlib import contextmanager\nimport tempfile, shutil\n\n@contextmanager\ndef tempdir():\n    path = tempfile.mkdtemp()\n    try:\n        yield path\n    finally:\n        shutil.rmtree(path)", hint: "Use try/finally around yield so cleanup happens even on exception.", refs: [{ label: "contextlib.contextmanager", url: "https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a class-based context manager DBConnection that prints\n\"connecting\" on enter, returns {\"status\": \"open\"}, prints\n\"disconnecting\" on exit, and suppresses RuntimeError only.", answer: "class DBConnection:\n    def __enter__(self):\n        print(\"connecting\")\n        return {\"status\": \"open\"}\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        print(\"disconnecting\")\n        return exc_type is RuntimeError", hint: "__exit__ returns True only for RuntimeError to suppress it.", refs: [{ label: "With Statement Context Managers", url: "https://docs.python.org/3/reference/datamodel.html#with-statement-context-managers" }] }
        ]
      }
    ]
  },
  {
    id: "lambda-functional", title: "Lambda & Functional", icon: "\u03BB",
    color: "from-violet-600 to-purple-700",
    description: "Lambda expressions, map, filter, sorted with key functions.",
    lessons: [
      {
        id: "lambda-expressions", title: "Lambda Expressions",
        theory: `A \`lambda\` is an anonymous, single-expression function:

\`\`\`python
square = lambda x: x ** 2
\`\`\`

Lambdas shine as throwaway \`key\` functions:

\`\`\`python
pairs = [(1, "b"), (3, "a"), (2, "c")]
sorted(pairs, key=lambda p: p[1])

records = [{"name": "Ada", "score": 90}, {"name": "Bob", "score": 75}]
best = max(records, key=lambda r: r["score"])
\`\`\`

Lambdas cannot contain statements, only a single expression.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "words = [\"banana\", \"pie\", \"kiwi\", \"strawberry\"]\nprint(sorted(words, key=lambda w: len(w)))", answer: "['pie', 'kiwi', 'banana', 'strawberry']", hint: "sorted uses len() as the key. len('pie')=3, len('kiwi')=4, etc.", refs: [{ label: "Sorting HOW TO", url: "https://docs.python.org/3/howto/sorting.html" }] },
          { type: "output", label: "Predict the Output", prompt: "ops = [lambda x, n=n: x + n for n in range(3)]\nprint([fn(10) for fn in ops])", answer: "[10, 11, 12]", hint: "The default argument n=n captures the current value at each iteration.", refs: [{ label: "Lambda expressions", url: "https://docs.python.org/3/reference/expressions.html#lambda" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Should sort most recent first, but sorts oldest first\nevents = [\n    {\"name\": \"launch\", \"date\": \"2025-06-01\"},\n    {\"name\": \"beta\", \"date\": \"2025-01-15\"},\n    {\"name\": \"GA\", \"date\": \"2025-09-30\"},\n]\nresult = sorted(events, key=lambda e: e[\"date\"])", answer: "result = sorted(events, key=lambda e: e[\"date\"], reverse=True)", hint: "Add reverse=True to sort in descending order.", refs: [{ label: "sorted() built-in", url: "https://docs.python.org/3/library/functions.html#sorted" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# SyntaxError on this lambda\nhyp = lambda a, b:\n    (a**2 + b**2) ** 0.5", answer: "hyp = lambda a, b: (a**2 + b**2) ** 0.5", hint: "Lambdas must be a single expression on one line.", refs: [{ label: "Lambda expressions", url: "https://docs.python.org/3/reference/expressions.html#lambda" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Given students = [(\"Ada\", 88), (\"Bob\", 95), (\"Cat\", 72)],\nuse max with a lambda to find the tuple with highest score (store in top),\nand sorted with a lambda to sort by score descending (store in ranked).", answer: "students = [(\"Ada\", 88), (\"Bob\", 95), (\"Cat\", 72)]\ntop = max(students, key=lambda s: s[1])\nranked = sorted(students, key=lambda s: s[1], reverse=True)", hint: "Both max and sorted accept a key argument. Use index [1] for the score.", refs: [{ label: "max() built-in", url: "https://docs.python.org/3/library/functions.html#max" }] }
        ]
      },
      {
        id: "map-filter-functools", title: "map, filter & functools",
        theory: `\`map(func, iterable)\` applies a function to every item lazily. \`filter(func, iterable)\` keeps items where func returns truthy.

\`\`\`python
list(map(str.upper, ["hello", "world"]))  # ['HELLO', 'WORLD']
list(filter(lambda x: x > 0, [-1, 2, -3, 4]))  # [2, 4]
\`\`\`

\`functools.reduce\` collapses to a single value. \`functools.partial\` freezes some arguments:

\`\`\`python
from functools import reduce, partial
reduce(lambda acc, x: acc * x, [1, 2, 3, 4])  # 24
int_from_bin = partial(int, base=2)
int_from_bin("1010")  # 10
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "from functools import reduce\nnums = [1, 2, 3, 4, 5]\nresult = reduce(lambda a, b: a if a > b else b, nums)\nprint(result)", answer: "5", hint: "This reduce finds the maximum by comparing accumulator with each element.", refs: [{ label: "functools.reduce", url: "https://docs.python.org/3/library/functools.html#functools.reduce" }] },
          { type: "output", label: "Predict the Output", prompt: "result = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, range(6))))\nprint(result)", answer: "[0, 4, 16]", hint: "filter keeps even numbers [0, 2, 4]. map squares each: [0, 4, 16].", refs: [{ label: "map() built-in", url: "https://docs.python.org/3/library/functions.html#map" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Should print [2, 4, 6] but prints a map object\ndoubled = map(lambda x: x * 2, [1, 2, 3])\nprint(doubled)", answer: "doubled = map(lambda x: x * 2, [1, 2, 3])\nprint(list(doubled))", hint: "map() returns a lazy iterator. Wrap in list() to materialize.", refs: [{ label: "map() built-in", url: "https://docs.python.org/3/library/functions.html#map" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Use functools.partial to create csv_split that splits on commas.\nThen use map to apply it to lines = [\"a,b,c\", \"d,e,f\"].\nStore the result as a list in rows.", answer: "from functools import partial\n\ncsv_split = partial(str.split, sep=\",\")\nlines = [\"a,b,c\", \"d,e,f\"]\nrows = list(map(csv_split, lines))", hint: "partial(str.split, sep=',') creates a callable that splits on commas.", refs: [{ label: "functools.partial", url: "https://docs.python.org/3/library/functools.html#functools.partial" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Given data = [\"3\", \"7\", \"\", \"12\", \"0\", \"\"],\nuse filter to remove empty strings, map to convert to ints,\nthen functools.reduce to compute the sum. Store in total.", answer: "from functools import reduce\n\ndata = [\"3\", \"7\", \"\", \"12\", \"0\", \"\"]\ntotal = reduce(lambda a, b: a + b, map(int, filter(None, data)))", hint: "filter(None, iterable) removes falsy values (empty strings). Chain map and reduce.", refs: [{ label: "functools.reduce", url: "https://docs.python.org/3/library/functools.html#functools.reduce" }] }
        ]
      }
    ]
  },
  {
    id: "dataclasses", title: "Dataclasses", icon: "\u{1F4E6}",
    color: "from-lime-600 to-green-700",
    description: "Structured data without boilerplate \u2014 frozen, defaults, and post_init.",
    lessons: [
      {
        id: "dataclass-basics", title: "Dataclass Basics",
        theory: `The \`@dataclass\` decorator auto-generates \`__init__\`, \`__repr__\`, and \`__eq__\`:

\`\`\`python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
\`\`\`

Fields with defaults must come after fields without:

\`\`\`python
@dataclass
class Config:
    host: str
    port: int = 8080
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "from dataclasses import dataclass\n\n@dataclass\nclass Vec:\n    x: int\n    y: int\n\na = Vec(1, 2)\nb = Vec(1, 2)\nprint(a == b)\nprint(a is b)", answer: "True\nFalse", hint: "@dataclass generates __eq__ that compares field values. Equal but not the same object.", refs: [{ label: "dataclasses module", url: "https://docs.python.org/3/library/dataclasses.html" }] },
          { type: "output", label: "Predict the Output", prompt: "from dataclasses import dataclass\n\n@dataclass\nclass Item:\n    name: str\n    price: float = 0.0\n\nprint(Item(\"widget\"))", answer: "Item(name='widget', price=0.0)", hint: "Auto-generated __repr__ shows all fields with their values.", refs: [{ label: "dataclasses module", url: "https://docs.python.org/3/library/dataclasses.html" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Raises TypeError \u2014 fix the field ordering\nfrom dataclasses import dataclass\n\n@dataclass\nclass User:\n    role: str = \"viewer\"\n    name: str\n    email: str", answer: "from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    email: str\n    role: str = \"viewer\"", hint: "Fields without defaults must come before fields with defaults.", refs: [{ label: "dataclasses module", url: "https://docs.python.org/3/library/dataclasses.html" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Should NOT generate __eq__ (want identity comparison)\nfrom dataclasses import dataclass\n\n@dataclass\nclass Connection:\n    host: str\n    port: int", answer: "from dataclasses import dataclass\n\n@dataclass(eq=False)\nclass Connection:\n    host: str\n    port: int", hint: "Pass eq=False to @dataclass to skip __eq__ generation.", refs: [{ label: "@dataclass parameters", url: "https://docs.python.org/3/library/dataclasses.html#dataclasses.dataclass" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Create a dataclass Experiment with: name (str), n_samples (int),\nlearning_rate (float, default 0.001), tags (list[str], default empty list).\nUse field(default_factory=list) for the mutable default.", answer: "from dataclasses import dataclass, field\n\n@dataclass\nclass Experiment:\n    name: str\n    n_samples: int\n    learning_rate: float = 0.001\n    tags: list[str] = field(default_factory=list)", hint: "Mutable defaults must use field(default_factory=list).", refs: [{ label: "dataclasses.field", url: "https://docs.python.org/3/library/dataclasses.html#dataclasses.field" }] }
        ]
      },
      {
        id: "advanced-dataclasses", title: "Advanced Dataclasses",
        theory: `\`frozen=True\` makes instances immutable. \`__post_init__\` runs after \`__init__\` for validation or derived fields:

\`\`\`python
@dataclass
class Rect:
    w: float
    h: float
    area: float = field(init=False)

    def __post_init__(self):
        self.area = self.w * self.h
\`\`\`

\`order=True\` generates comparison methods. Use \`field(repr=False)\` to hide and \`field(compare=False)\` to exclude from equality.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "from dataclasses import dataclass, field\n\n@dataclass(order=True)\nclass Version:\n    major: int\n    minor: int\n    patch: int\n\nvs = [Version(2, 0, 1), Version(1, 9, 0), Version(2, 0, 0)]\nprint(sorted(vs)[-1])", answer: "Version(major=2, minor=0, patch=1)", hint: "order=True compares tuples of fields. (2,0,1) > (2,0,0) > (1,9,0).", refs: [{ label: "@dataclass parameters", url: "https://docs.python.org/3/library/dataclasses.html#dataclasses.dataclass" }] },
          { type: "output", label: "Predict the Output", prompt: "from dataclasses import dataclass, field\n\n@dataclass\nclass Metric:\n    name: str\n    value: float\n    _history: list = field(default_factory=list, repr=False, compare=False)\n\na = Metric(\"loss\", 0.5)\nb = Metric(\"loss\", 0.5)\na._history.append(0.5)\nprint(a == b)\nprint(a)", answer: "True\nMetric(name='loss', value=0.5)", hint: "_history is excluded from both comparison and repr.", refs: [{ label: "dataclasses.field", url: "https://docs.python.org/3/library/dataclasses.html#dataclasses.field" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Frozen dataclass: __post_init__ raises FrozenInstanceError\nfrom dataclasses import dataclass, field\n\n@dataclass(frozen=True)\nclass Patient:\n    weight_kg: float\n    height_m: float\n    bmi: float = field(init=False)\n\n    def __post_init__(self):\n        self.bmi = self.weight_kg / (self.height_m ** 2)", answer: "from dataclasses import dataclass, field\n\n@dataclass(frozen=True)\nclass Patient:\n    weight_kg: float\n    height_m: float\n    bmi: float = field(init=False)\n\n    def __post_init__(self):\n        object.__setattr__(self, \"bmi\", self.weight_kg / (self.height_m ** 2))", hint: "Frozen dataclasses block assignment. Use object.__setattr__ in __post_init__.", refs: [{ label: "Frozen instances", url: "https://docs.python.org/3/library/dataclasses.html#frozen-instances" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Create a frozen dataclass RGB with r, g, b (all int).\nAdd __post_init__ that raises ValueError if any channel is not in 0-255.", answer: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass RGB:\n    r: int\n    g: int\n    b: int\n\n    def __post_init__(self):\n        for ch in (self.r, self.g, self.b):\n            if not (0 <= ch <= 255):\n                raise ValueError(f\"Channel value {ch} out of range 0-255\")", hint: "In frozen dataclass, __post_init__ can still read fields for validation.", refs: [{ label: "dataclasses \u2014 post-init", url: "https://docs.python.org/3/library/dataclasses.html#post-init-processing" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Create dataclass TimeSeries with: name (str), values (list[float],\ndefault_factory=list), mean (float, init=False).\nCompute mean in __post_init__; use 0.0 if values is empty.", answer: "from dataclasses import dataclass, field\n\n@dataclass\nclass TimeSeries:\n    name: str\n    values: list[float] = field(default_factory=list)\n    mean: float = field(init=False)\n\n    def __post_init__(self):\n        self.mean = sum(self.values) / len(self.values) if self.values else 0.0", hint: "Use field(init=False) so mean isn't a constructor param.", refs: [{ label: "dataclasses \u2014 post-init", url: "https://docs.python.org/3/library/dataclasses.html#post-init-processing" }] }
        ]
      }
    ]
  },
  {
    id: "decorators", title: "Decorators", icon: "\u{1F3AD}",
    color: "from-fuchsia-600 to-pink-700",
    description: "Function wrappers, @syntax, and real-world patterns like timing and caching.",
    lessons: [
      {
        id: "decorator-basics", title: "Decorator Basics",
        theory: `Decorators are syntactic sugar for wrapping functions. Since functions are first-class objects, you can pass them as arguments and return them.

\`\`\`python
def shout(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result.upper()
    return wrapper

@shout
def greet(name):
    return f"hello, {name}"

# @shout is equivalent to: greet = shout(greet)
print(greet("world"))  # HELLO, WORLD
\`\`\``,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "def trace(func):\n    def wrapper(*args):\n        print(f\"calling {func.__name__}\")\n        return func(*args)\n    return wrapper\n\n@trace\ndef add(a, b):\n    return a + b\n\nresult = add(3, 4)\nprint(result)", answer: "calling add\n7", hint: "The wrapper prints the function name before calling the original.", refs: [{ label: "Decorators", url: "https://docs.python.org/3/glossary.html#term-decorator" }] },
          { type: "output", label: "Predict the Output", prompt: "def double_result(func):\n    def wrapper(*args):\n        return func(*args) * 2\n    return wrapper\n\n@double_result\ndef get_value():\n    return 5\n\nprint(get_value())\nprint(get_value.__name__)", answer: "10\nwrapper", hint: "Without functools.wraps, __name__ reflects the inner function.", refs: [{ label: "functools.wraps", url: "https://docs.python.org/3/library/functools.html#functools.wraps" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Decorator breaks the return value\ndef logger(func):\n    def wrapper(*args, **kwargs):\n        print(f\"Called {func.__name__}\")\n        func(*args, **kwargs)\n    return wrapper\n\n@logger\ndef square(x):\n    return x ** 2\n\nprint(square(5))  # Expected: 25, Got: None", answer: "def logger(func):\n    def wrapper(*args, **kwargs):\n        print(f\"Called {func.__name__}\")\n        return func(*args, **kwargs)\n    return wrapper\n\n@logger\ndef square(x):\n    return x ** 2\n\nprint(square(5))", hint: "The wrapper calls func() but doesn't return its result.", refs: [{ label: "Defining Functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Decorator should validate positive args\ndef positive_only(func):\n    def wrapper(*args):\n        for a in args:\n            if a < 0:\n                raise ValueError(\"Negative\")\n        return func(args)\n    return wrapper\n\n@positive_only\ndef multiply(a, b):\n    return a * b\n\nprint(multiply(3, 4))  # Expected: 12", answer: "def positive_only(func):\n    def wrapper(*args):\n        for a in args:\n            if a < 0:\n                raise ValueError(\"Negative\")\n        return func(*args)\n    return wrapper\n\n@positive_only\ndef multiply(a, b):\n    return a * b\n\nprint(multiply(3, 4))", hint: "func(args) passes a single tuple. Use func(*args) to unpack.", refs: [{ label: "Unpacking Argument Lists", url: "https://docs.python.org/3/tutorial/controlflow.html#unpacking-argument-lists" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a decorator count_calls that tracks how many times a function\nis called. Store the count as wrapper.call_count.\n\n# @count_calls\n# def say_hi(): print(\"hi\")\n# say_hi(); say_hi(); say_hi()\n# print(say_hi.call_count)  # 3", answer: "def count_calls(func):\n    def wrapper(*args, **kwargs):\n        wrapper.call_count += 1\n        return func(*args, **kwargs)\n    wrapper.call_count = 0\n    return wrapper", hint: "Functions are objects \u2014 you can set attributes on them.", refs: [{ label: "Function Objects", url: "https://docs.python.org/3/reference/datamodel.html#the-standard-type-hierarchy" }] }
        ]
      },
      {
        id: "practical-decorators", title: "Practical Decorators",
        theory: `Real-world decorators use \`functools.wraps\` to preserve metadata and can accept arguments via nested closures:

\`\`\`python
import functools

def retry(max_attempts=3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == max_attempts - 1:
                        raise
        return wrapper
    return decorator
\`\`\`

Stacking decorators applies bottom-up: \`@A @B def f\` means \`f = A(B(f))\`.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "import functools\n\ndef tag(name):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            return f\"<{name}>{func(*args, **kwargs)}</{name}>\"\n        return wrapper\n    return decorator\n\n@tag(\"b\")\n@tag(\"i\")\ndef greet(name):\n    return f\"Hi, {name}\"\n\nprint(greet(\"Ada\"))\nprint(greet.__name__)", answer: "<b><i>Hi, Ada</i></b>\ngreet", hint: "Bottom-up: @tag('i') wraps first, then @tag('b'). functools.wraps preserves the name.", refs: [{ label: "functools.wraps", url: "https://docs.python.org/3/library/functools.html#functools.wraps" }] },
          { type: "output", label: "Predict the Output", prompt: "from functools import lru_cache\n\ncall_count = 0\n\n@lru_cache(maxsize=None)\ndef fib(n):\n    global call_count\n    call_count += 1\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(6))\nprint(call_count)", answer: "8\n7", hint: "lru_cache memoizes results. Each n from 0 to 6 is computed exactly once: 7 calls.", refs: [{ label: "functools.lru_cache", url: "https://docs.python.org/3/library/functools.html#functools.lru_cache" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# @log should work without arguments, but process gets passed as message\nimport functools\n\ndef log(message):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            print(f\"{message}: calling {func.__name__}\")\n            return func(*args, **kwargs)\n        return wrapper\n    return decorator\n\n@log\ndef process():\n    return \"done\"\n\nprint(process())", answer: "import functools\n\ndef log(message=\"DEBUG\"):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            print(f\"{message}: calling {func.__name__}\")\n            return func(*args, **kwargs)\n        return wrapper\n    return decorator\n\n@log()\ndef process():\n    return \"done\"\n\nprint(process())", hint: "Without parens, @log passes process as message. Use @log() with a default.", refs: [{ label: "Decorators", url: "https://docs.python.org/3/glossary.html#term-decorator" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a decorator timer that prints how long a function takes:\n\"func_name took 0.1234s\". Use time.perf_counter and functools.wraps.", answer: "import time\nimport functools\n\ndef timer(func):\n    @functools.wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        elapsed = time.perf_counter() - start\n        print(f\"{func.__name__} took {elapsed:.4f}s\")\n        return result\n    return wrapper", hint: "Capture perf_counter before and after. Format with :.4f. Don't forget to return result.", refs: [{ label: "time.perf_counter", url: "https://docs.python.org/3/library/time.html#time.perf_counter" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a decorator factory validate_types that checks argument types.\n\n# @validate_types(int, int)\n# def add(a, b): return a + b\n# add(1, 2)    # OK\n# add(1, \"2\")  # raises TypeError", answer: "import functools\n\ndef validate_types(*types):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            for arg, expected in zip(args, types):\n                if not isinstance(arg, expected):\n                    raise TypeError(f\"Expected {expected.__name__}, got {type(arg).__name__}\")\n            return func(*args, **kwargs)\n        return wrapper\n    return decorator", hint: "Three nesting levels: factory takes types, decorator takes func, wrapper takes args.", refs: [{ label: "isinstance", url: "https://docs.python.org/3/library/functions.html#isinstance" }] }
        ]
      }
    ]
  },
  {
    id: "generators", title: "Generators & Itertools", icon: "\u267E\uFE0F",
    color: "from-sky-600 to-blue-700",
    description: "Lazy evaluation, yield, and itertools for memory-efficient data processing.",
    lessons: [
      {
        id: "generator-functions", title: "Generator Functions & Expressions",
        theory: `A generator function uses \`yield\` instead of \`return\`, producing values lazily:

\`\`\`python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

gen = countdown(3)
print(next(gen))  # 3
print(next(gen))  # 2
\`\`\`

Generator expressions are like list comps but lazy:

\`\`\`python
squares = (x**2 for x in range(1_000_000))  # no memory spike
\`\`\`

Generators are single-use iterators. You can \`send()\` values back in for coroutine-like patterns.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "def pairs(n):\n    for i in range(n):\n        yield i, i ** 2\n\ngen = pairs(4)\nnext(gen)\na, b = next(gen)\nprint(f\"{a}:{b}\")\nprint(list(gen))", answer: "1:1\n[(2, 4), (3, 9)]", hint: "First next() yields (0,0) and discards it. Second yields (1,1). list() consumes the rest.", refs: [{ label: "Generator Expressions", url: "https://docs.python.org/3/reference/expressions.html#generator-expressions" }] },
          { type: "output", label: "Predict the Output", prompt: "def accumulator():\n    total = 0\n    while True:\n        value = yield total\n        if value is None:\n            break\n        total += value\n\ngen = accumulator()\nprint(next(gen))\nprint(gen.send(10))\nprint(gen.send(20))", answer: "0\n10\n30", hint: "next() starts the generator, yielding 0. send(10) resumes, total becomes 10. send(20) makes it 30.", refs: [{ label: "generator.send", url: "https://docs.python.org/3/reference/expressions.html#generator.send" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Should produce chunks but uses wrong slice syntax\ndef chunks(lst, size):\n    for i in range(0, len(lst), size):\n        yield lst[i, i + size]\n\nprint(list(chunks(list(range(10)), 3)))", answer: "def chunks(lst, size):\n    for i in range(0, len(lst), size):\n        yield lst[i:i + size]\n\nprint(list(chunks(list(range(10)), 3)))", hint: "lst[i, i + size] is a tuple index. Use colon for slicing: lst[i:i + size].", refs: [{ label: "Sequence Slicing", url: "https://docs.python.org/3/library/stdtypes.html#common-sequence-operations" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Should yield unique elements but logic is inverted\ndef unique(iterable):\n    seen = set()\n    for item in iterable:\n        if item in seen:\n            yield item\n        seen.add(item)\n\nprint(list(unique([3, 1, 4, 1, 5, 3, 6])))", answer: "def unique(iterable):\n    seen = set()\n    for item in iterable:\n        if item not in seen:\n            yield item\n        seen.add(item)\n\nprint(list(unique([3, 1, 4, 1, 5, 3, 6])))", hint: "Yield items NOT in seen, not items that are in seen.", refs: [{ label: "Sets", url: "https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write a generator fibonacci() that yields the infinite Fibonacci\nsequence (0, 1, 1, 2, 3, 5, 8, ...). Then create a generator\nexpression even_fibs that yields only even Fibonacci numbers.", answer: "def fibonacci():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n\neven_fibs = (x for x in fibonacci() if x % 2 == 0)", hint: "Use a, b = b, a + b for the classic fib pattern. Filter with if x % 2 == 0.", refs: [{ label: "Yield Expressions", url: "https://docs.python.org/3/reference/expressions.html#yield-expressions" }] }
        ]
      },
      {
        id: "itertools-essentials", title: "itertools Essentials",
        theory: `The \`itertools\` module provides memory-efficient building blocks:

\`\`\`python
from itertools import chain, islice, groupby, product

list(chain([1, 2], [3, 4]))       # [1, 2, 3, 4]
list(islice(range(100), 5, 10))   # [5, 6, 7, 8, 9]
list(product("AB", [1, 2]))       # [('A',1),('A',2),('B',1),('B',2)]
\`\`\`

\`groupby\` only groups **consecutive** elements \u2014 sort first! \`combinations\`/\`permutations\` are great for search problems.`,
        exercises: [
          { type: "output", label: "Predict the Output", prompt: "from itertools import chain, islice\n\na = chain(range(3), range(10, 13))\nb = islice(a, 2, 5)\nprint(list(b))", answer: "[2, 10, 11]", hint: "chain produces 0,1,2,10,11,12. islice takes indices 2,3,4.", refs: [{ label: "itertools.chain", url: "https://docs.python.org/3/library/itertools.html#itertools.chain" }] },
          { type: "output", label: "Predict the Output", prompt: "from itertools import groupby\n\ndata = \"AAABBBCCAB\"\nresult = [(k, len(list(g))) for k, g in groupby(data)]\nprint(result)", answer: "[('A', 3), ('B', 3), ('C', 2), ('A', 1), ('B', 1)]", hint: "groupby groups consecutive equal elements. Final AB aren't merged with earlier groups.", refs: [{ label: "itertools.groupby", url: "https://docs.python.org/3/library/itertools.html#itertools.groupby" }] },
          { type: "bugfix", label: "Fix the Bug", prompt: "# Should print all 2-letter combinations from \"ABCD\"\nfrom itertools import combinations\n\nfor combo in combinations(\"ABCD\"):\n    print(\"\".join(combo))", answer: "from itertools import combinations\n\nfor combo in combinations(\"ABCD\", 2):\n    print(\"\".join(combo))", hint: "combinations() requires a second argument r for combination length.", refs: [{ label: "itertools.combinations", url: "https://docs.python.org/3/library/itertools.html#itertools.combinations" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write windowed(iterable, n) that yields sliding windows as tuples.\n\nlist(windowed([1,2,3,4,5], 3))\n# [(1,2,3), (2,3,4), (3,4,5)]", answer: "from itertools import islice\n\ndef windowed(iterable, n):\n    it = iter(iterable)\n    window = tuple(islice(it, n))\n    if len(window) == n:\n        yield window\n    for item in it:\n        window = window[1:] + (item,)\n        yield window", hint: "Build first window with islice. Then slide by dropping first and appending new.", refs: [{ label: "itertools.islice", url: "https://docs.python.org/3/library/itertools.html#itertools.islice" }] },
          { type: "scratch", label: "Write from Scratch", prompt: "Write flatten(nested) that yields all scalar values from\narbitrarily nested lists. Do NOT use itertools.\n\nlist(flatten([1, [2, [3, 4], 5], [6]]))\n# [1, 2, 3, 4, 5, 6]", answer: "def flatten(nested):\n    for item in nested:\n        if isinstance(item, list):\n            yield from flatten(item)\n        else:\n            yield item", hint: "Use recursion with 'yield from' for nested lists.", refs: [{ label: "yield from", url: "https://docs.python.org/3/reference/expressions.html#yield-expressions" }] }
        ]
      }
    ]
  },
];

const EXERCISE_META = {
  output: { label: "Predict the Output", icon: "🔍", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800" },
  bugfix: { label: "Fix the Bug",        icon: "🐛", color: "text-red-400",    bg: "bg-red-900/20 border-red-800" },
  scratch:{ label: "Write from Scratch", icon: "✍️", color: "text-blue-400",  bg: "bg-blue-900/20 border-blue-800" },
};


interface RefLink {
  label: string;
  url: string;
}

interface Exercise {
  type: "output" | "bugfix" | "scratch";
  prompt: string;
  answer: string;
  hint: string;
  label?: string;
  refs?: RefLink[];
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
    if (!clean) throw new Error("Empty response from grader — please try again.");
    let parsed;
    try { parsed = JSON.parse(clean); } catch { throw new Error("Grading response was cut off — please try again."); }

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
    const p: Progress = {};
    MODULES.forEach(m => { p[m.id] = { exercises:{}, bossDefeated:false, bossRound:0, bossAnswers:{} }; });
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pr_progress");
      if (saved) { try { const s = JSON.parse(saved); Object.keys(s).forEach(k => { if (p[k]) p[k] = { ...p[k], ...s[k] }; }); } catch {} }
    }
    return p;
  });
  // ─── SYNC CODE ───
  const [syncCode, setSyncCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pr_sync_code");
  });
  const [syncInput, setSyncInput] = useState("");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // persist progress to localStorage + KV
  const saveToKV = useCallback(async (code: string, xpVal: number, streakVal: number, progressVal: Progress) => {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, data: { xp: xpVal, streak: streakVal, progress: progressVal } }),
      });
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem("pr_xp", String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem("pr_streak", String(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem("pr_progress", JSON.stringify(progress)); }, [progress]);

  // debounced save to KV whenever state changes
  useEffect(() => {
    if (!syncCode) return;
    const t = setTimeout(() => { saveToKV(syncCode, xp, streak, progress); }, 1500);
    return () => clearTimeout(t);
  }, [syncCode, xp, streak, progress, saveToKV]);

  const handleSyncConnect = async () => {
    const code = syncInput.trim();
    if (!code) return;
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.found && json.data) {
        const d = json.data;
        if (d.xp != null) setXp(d.xp);
        if (d.streak != null) setStreak(d.streak);
        if (d.progress) setProgress(d.progress);
        setSyncStatus("Loaded progress from cloud!");
      } else {
        // New code — push current local state up
        await saveToKV(code, xp, streak, progress);
        setSyncStatus("New sync code created — progress saved!");
      }
      setSyncCode(code);
      localStorage.setItem("pr_sync_code", code);
      setSyncInput("");
    } catch {
      setSyncStatus("Sync failed — check your connection.");
    }
    setSyncing(false);
  };

  const handleSyncDisconnect = () => {
    setSyncCode(null);
    localStorage.removeItem("pr_sync_code");
    setSyncStatus(null);
  };

  // boss state
  const [bossRound, setBossRound] = useState(0);
  const [bossAnswers, setBossAnswers] = useState({});
  const [bossResult, setBossResult] = useState<GradeResult | null>(null);
  const [bossWon, setBossWon] = useState(false);
  const [bossIntroSeen, setBossIntroSeen] = useState(false);

  // drill state
  const [drillExercises, setDrillExercises] = useState<Exercise[]>([]);
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillResult, setDrillResult] = useState<GradeResult | null>(null);
  const [drillScore, setDrillScore] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);

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

  // ── DRILL ──
  const getCompletedTopics = (): string[] => {
    const topics: string[] = [];
    for (const mod of MODULES) {
      for (const lesson of mod.lessons) {
        const allDone = lesson.exercises.every((_, i) => progress[mod.id]?.exercises[`${lesson.id}-${i}`]);
        if (allDone) topics.push(lesson.title);
      }
    }
    return topics;
  };

  const startDrill = async () => {
    const topics = getCompletedTopics();
    if (topics.length === 0) return;
    setDrillExercises([]); setDrillIdx(0); setDrillScore(0);
    setDrillComplete(false); setDrillResult(null);
    setUserAnswer(""); setShowHint(false);
    setDrillLoading(true); setScreen("drill");
    try {
      const res = await fetch("/api/drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const exercises = await res.json();
      if (exercises.error) throw new Error(exercises.error);
      setDrillExercises(exercises);
    } catch {
      setScreen("module");
    }
    setDrillLoading(false);
  };

  const handleDrillSubmit = async () => {
    if (!userAnswer.trim() || !drillExercises[drillIdx]) return;
    setGrading(true);
    try {
      const r = await gradeWithClaude(drillExercises[drillIdx], userAnswer);
      setDrillResult(r);
      if (r.correct) {
        setDrillScore(s => s + 1);
        setStreak(s => s + 1);
        addXp(XP_PER_DRILL);
      } else setStreak(0);
    } catch (e) {
      setDrillResult({ correct: false, feedback: e instanceof Error ? e.message : "Grading failed." });
    }
    setGrading(false);
  };

  const nextDrillExercise = () => {
    if (drillIdx + 1 < drillExercises.length) {
      setDrillIdx(i => i + 1); setUserAnswer(""); setDrillResult(null); setShowHint(false);
    } else {
      setDrillComplete(true);
    }
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

          {/* Sync */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Cloud Sync</div>
            {syncCode ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm text-gray-300">Syncing as: <span className="font-mono text-emerald-400">{syncCode}</span></div>
                  <div className="text-xs text-gray-500 mt-0.5">Progress auto-saves across devices</div>
                </div>
                <button onClick={handleSyncDisconnect} className="text-xs text-gray-500 hover:text-red-400">Disconnect</button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-2">Enter a sync code to save progress across devices. Use the same code on any device to pick up where you left off.</p>
                <div className="flex gap-2">
                  <input value={syncInput} onChange={e => setSyncInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSyncConnect()}
                    placeholder="e.g. rahul-python-2026"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500" />
                  <button onClick={handleSyncConnect} disabled={!syncInput.trim() || syncing}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium">
                    {syncing ? "Syncing..." : "Connect"}
                  </button>
                </div>
              </div>
            )}
            {syncStatus && <div className="mt-2 text-xs text-emerald-400">{syncStatus}</div>}
          </div>

          {/* Level roadmap */}
          <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
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

          {/* Drill button */}
          {activeMod.lessons.some(l => l.exercises.every((_, i) => progress[activeMod.id]?.exercises[`${l.id}-${i}`])) && (
            <button onClick={startDrill} disabled={drillLoading}
              className="w-full rounded-xl p-4 border-2 border-purple-600 bg-purple-900/20 text-purple-300 hover:bg-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center font-bold mb-4">
              ⚔️ Training Arena — Drill Mode
              <div className="text-xs font-normal text-purple-400 mt-0.5">5 random exercises from completed topics · +{XP_PER_DRILL} XP each</div>
            </button>
          )}

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
            {currentEx.refs && currentEx.refs.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-700/50 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs text-gray-500">📚 Docs:</span>
                {currentEx.refs.map((ref, ri) => (
                  <a key={ri} href={ref.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">{ref.label}</a>
                ))}
              </div>
            )}
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
                      {round.refs && round.refs.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-700/50 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-xs text-gray-500">📚 Docs:</span>
                          {round.refs.map((ref: RefLink, ri: number) => (
                            <a key={ri} href={ref.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">{ref.label}</a>
                          ))}
                        </div>
                      )}
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

      {/* ── DRILL ── */}
      {screen === "drill" && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={()=>setScreen("module")} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">‹ Back</button>

          {drillLoading && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 animate-pulse">⚔️</div>
              <h1 className="text-xl font-bold text-purple-300 mb-2">Training Arena</h1>
              <p className="text-gray-400 text-sm flex items-center justify-center gap-2"><Spinner /> The Arena Master is forging your challenges...</p>
            </div>
          )}

          {!drillLoading && !drillComplete && drillExercises.length > 0 && (() => {
            const dex = drillExercises[drillIdx];
            const dmeta = EXERCISE_META[dex.type];
            return (
              <>
                <div className="bg-gradient-to-r from-purple-900 to-violet-950 border border-purple-700 rounded-xl p-4 mb-5 flex items-center gap-3">
                  <span className="text-3xl">⚔️</span>
                  <div>
                    <div className="font-bold text-sm text-purple-200">Training Arena</div>
                    <div className="flex gap-1 mt-1">
                      {drillExercises.map((_,i)=>(
                        <div key={i} className={`h-2 w-8 rounded-full ${i<drillIdx?"bg-emerald-500":i===drillIdx?"bg-purple-400 animate-pulse":"bg-gray-600"}`}/>
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-sm text-gray-400">Challenge {drillIdx+1}/{drillExercises.length}</span>
                </div>
                <div className={`border rounded-xl p-4 mb-3 ${dmeta.bg}`}>
                  <div className={`flex items-center gap-2 font-bold mb-2 text-sm ${dmeta.color}`}>{dmeta.icon} {dmeta.label}</div>
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">{dex.prompt}</pre>
                </div>
                <textarea value={userAnswer} onChange={e=>setUserAnswer(e.target.value)} onKeyDown={handleTab} disabled={!!drillResult}
                  placeholder={dex.type==="output"?"Type what you think prints...":"Write your Python code here..."}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-mono text-gray-100 resize-none focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  rows={dex.type==="output"?4:7}/>
                {!drillResult && <button onClick={()=>setShowHint(h=>!h)} className="text-xs text-gray-500 hover:text-gray-300 mt-1.5 block">{showHint?"▾ Hide":"💡 Hint"}</button>}
                {showHint && !drillResult && <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 mt-1 mb-2">{dex.hint}</div>}
                {drillResult && (
                  <div className={`rounded-xl p-3 mt-3 mb-3 border text-sm ${drillResult.correct?"bg-emerald-900/30 border-emerald-700 text-emerald-200":"bg-red-900/30 border-red-800 text-red-200"}`}>
                    <div className="font-bold mb-0.5">{drillResult.correct?"✅ Correct!":"❌ Not quite."}</div>
                    <div className="text-gray-300">{drillResult.feedback}</div>
                  </div>
                )}
                <div className="mt-2">
                  {!drillResult ? (
                    <button onClick={handleDrillSubmit} disabled={!userAnswer.trim()||grading}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                      {grading?<><Spinner/>Grading...</>:"Submit Answer"}
                    </button>
                  ) : drillResult.correct ? (
                    <button onClick={nextDrillExercise}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium text-sm">
                      {drillIdx+1<drillExercises.length?"Next Challenge →":"Finish Drill ✓"}
                    </button>
                  ) : (
                    <button onClick={()=>{setDrillResult(null);setUserAnswer("");}}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-lg font-medium text-sm">Try Again</button>
                  )}
                </div>
              </>
            );
          })()}

          {!drillLoading && drillComplete && (
            <div className="text-center py-12">
              <div className="text-7xl mb-4">{drillScore === 5 ? "🏆" : drillScore >= 3 ? "⚔️" : drillScore >= 1 ? "🛡️" : "💀"}</div>
              <h1 className="text-2xl font-bold mb-2 text-purple-200">Arena Complete!</h1>
              <div className="text-4xl font-bold text-white mb-2">{drillScore}/{drillExercises.length}</div>
              <p className="text-gray-400 text-sm mb-1">
                {drillScore === 5 && "Flawless victory! The Arena Master bows before you."}
                {drillScore === 4 && "Impressive! Only one challenge bested you."}
                {drillScore === 3 && "Well fought, warrior. Return to sharpen your blade."}
                {drillScore === 2 && "The arena humbles even the bravest. Keep training."}
                {drillScore === 1 && "A hard-won point. The arena awaits your return."}
                {drillScore === 0 && "Defeated... but every warrior falls before they rise."}
              </p>
              <p className="text-yellow-400 text-sm font-medium mb-8">+{drillScore * XP_PER_DRILL} XP earned</p>
              <div className="flex gap-3 justify-center">
                <button onClick={startDrill}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl">
                  Fight Again ⚔️
                </button>
                <button onClick={()=>setScreen("module")}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl">
                  Leave Arena
                </button>
              </div>
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
              {levelUpData.level === 4 && "You're writing real Python now. Deeper dungeons lie ahead."}
              {levelUpData.level === 5 && "Exceptions fear you. Time to master the dark arts of decorators."}
              {levelUpData.level === 6 && "You wrap functions like a pro. The infinite streams await."}
              {levelUpData.level === 7 && "Generators yield to your command. One final step remains."}
              {levelUpData.level === 8 && "Pythonista. The highest rank. The code speaks for itself."}
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