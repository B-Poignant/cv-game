# Game design: "Headhunted"

The story, rules and tone of cv-game. Every feature should fit this document. If a feature
changes the design, update this file (see the `update-docs` skill). Feature IDs (`F-0xx`)
refer to [FEATURES.md](FEATURES.md).

## Pitch

> _A burned-out developer just wants to code in peace. Instead: 500 "exciting
> opportunities" a day. Today, **you** are one of those recruiters._

Visitors play **recruiters** hunting **the dev** (the CV's owner, a computer-controlled
character) across a map that **is** his CV. Catching him isn't enough: he only says yes to a
pitch that matches who he really is. The only way to win is to read the CV, so a real
recruiter who plays leaves knowing the profile and holding the contact details.

## Language

The game interface and the dev's lines are in **English**. The CV content (panels, intel)
stays in **French**, as written by its owner.

## Tone

Humorous, self-aware and friendly. We laugh _with_ recruiters, not at them. The CV content
itself stays accurate and serious; the humour lives in the framing, the dev's lines and the
hazards.

**Guidelines**

- Short lines (one bubble, under about 60 characters). Puns are fine; meanness isn't.
- Poke fun at recruiting clichés: "rockstar ninja", "fast-paced environment", "competitive
  salary", "quick call?", "perfect fit".
- The dev is grumpy but likeable. He secretly wants the right job.
- Never mock real companies or people.

**Example lines**

| Situation               | Line                                          |
| ----------------------- | --------------------------------------------- |
| Recruiter gets close    | "Not open to work… unless it's remote."       |
| Running away            | "Is this about a _rockstar ninja_ role? Bye!" |
| Bad pitch (wrong stack) | "COBOL? I said TypeScript. Read the CV!"      |
| Bad pitch (onsite)      | "5 days in the office? I'll pass."            |
| Recruiter has no intel  | "Do you even know what I do?"                 |
| Good pitch              | "…OK. You actually read it. You got me."      |
| Idle                    | "Just one more commit…"                       |

## Characters

### The dev (NPC, F-060)

- The CV's owner. He wanders the map, runs away from recruiters, and taunts them in speech bubbles.
- Run by the **server**, so every recruiter sees the same dev in the same place.
- He's slightly **slower** than recruiters but turns well, and **sprints** for a moment when
  one gets very close. Recruiters catch him by cornering him against buildings and map edges,
  or by closing in from two sides, not just by running after him.
- **Name:** Ben.
- **Look:** casual, with jeans, a white shirt and glasses. The outfit adapts to the current theme
  (F-050): yellow-skinned in Simpsons, paper cut-out in South Park.

### Recruiters (players, F-012)

- Every visitor. They choose a name and a company when joining (with funny defaults such as
  "Alex from SynergyCorp"), shown above their head.
- They carry the **intel cards** they've earned (F-031).

## The map is the CV (F-005)

The hub map is split into **districts**, one per CV section. Each district's name is painted
on the ground, and its building holds that section's minigame.

| District          | CV section | Building minigame        | Intel it gives (examples)                  |
| ----------------- | ---------- | ------------------------ | ------------------------------------------ |
| Skills Park       | Skills     | Buzzword catcher (F-071) | Core stack, favourite tools, disliked tech |
| Experience Avenue | Experience | Career timeline (F-072)  | Seniority, industries, role types          |
| Projects Lab      | Projects   | Project match-up (F-073) | What he likes building                     |
| Education Campus  | Education  | Quiz (F-074)             | Background, languages spoken               |
| Hidden            | —          | The chest (F-040)        | Secret card: a deal-breaker or a soft spot |

The map is 24×24, one quarter per district: Skills Park (top-left), Experience Avenue
(top-right) and Education Campus (bottom-left) are built. Recruiters arrive at the
crossroads in the middle. The bottom-right quarter is kept for the Projects Lab, once the CV
has projects; until then it's where Ben starts and where the chest hides.

## Core loop

```
spawn as a recruiter
   → explore the CV map
   → enter a building → play its minigame → win: CV section panel + intel card
   → (repeat until you hold ≥ 3 intel cards)
   → chase the dev, corner him, touch him
   → pitch dialog: build an offer from what you learned
       ├─ bad pitch  → he escapes with a joke, 30 s cooldown before you can pitch again
       └─ good pitch → "You got me!" → reward panel
```

A first visit should take about **5 minutes** to reach a reward.

**Until every minigame exists (F-070):** SKILLS plays its buzzword catcher (F-071); the
other buildings, opened from up close (2 tiles at most), give their intel card directly, and the chest gives the secret one. EXPERIENCE and SKILLS give a card
each (EDUCATION gives none yet), so with the chest that's exactly the 3 cards needed to pitch.

## Minigames (F-070 framework)

Every minigame is short (30–60 s), playable with the keyboard or mouse, and **teaches its CV
section**: winning it requires noticing the real content. When it ends, the section's panel
(F-030) opens, so even a loser reads the CV.

### Skills Park: buzzword catcher (F-071), the first one to build

- **Goal:** tech logos and buzzwords fall from the top. Catch the ones in the dev's real
  stack and dodge the ones he dislikes, plus pure buzzwords ("synergy", "blockchain-native").
- **Controls:** ←/→ (or Q/D, A/D) move a basket.
- **Win:** reach the target score before time runs out. Catching a disliked item costs points.
- **Teaches:** the real skill list, and what he doesn't want.
- **Intel:** "Core stack: …".

### Experience Avenue: career timeline (F-072, idea)

Drag job cards into chronological order. Teaches the career path and seniority.

### Projects Lab: match-up (F-073, idea)

Match each project to its technology and description. Teaches what he builds.

### Education Campus: quiz (F-074, idea)

Three quick multiple-choice questions about the education section. Teaches background and languages.

## The pitch (F-042)

- **Requirements:** touching the dev with **at least 3 intel cards**. With fewer, he dodges
  and says "Do you even know what I do?". Touching is checked **on the server** (distance
  under 0.8 tile).
- **The dialog:** the recruiter picks one option per category to build an offer:
  - **Stack:** e.g. TypeScript / Java / PHP / COBOL
  - **Work mode:** remote / hybrid / onsite
  - **Role:** e.g. lead full stack / manager / backend / "rockstar ninja"
  - **Pitch line:** three canned openers, one of them sincere ("I read your CV…")
- **Scoring (server-side):** each choice is compared with the dev's real preferences (shared
  config). Any part that fails ends the pitch: the dev answers with a line explaining what
  was wrong (work mode first, the deal-breaker), which hints at the right answer. With no
  failing part he's hired, after a grumble for each part that's only accepted. A bad pitch
  makes that recruiter wait 30 s before pitching again.
- **Opening lines:** "Hi! Open to a quick call?" and "You're a perfect fit for our fast-paced
  team!" fail; "I read your CV, and this job fits it." is the sincere one.
- **Preferences (the real ones):**

  | Category  | Perfect                                                                   | Accepted (with a grumble)                                         | Fails                                |
  | --------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
  | Stack     | PHP (Symfony, Laravel) or JavaScript/TypeScript (Vue.js, Ember.js, React) | —                                                                 | anything else                        |
  | Work mode | Remote                                                                    | Hybrid                                                            | Onsite                               |
  | Role      | Lead full stack developer, tech lead, engineering manager                 | Full stack developer, back-end PHP developer, front-end developer | Game developer, "rockstar ninja 10x" |

  No other deal-breakers (the owner's answer). The CV backs this stack up: a test
  in `tests/unit/content/cv.test.ts` checks that every preferred technology is in the skills.

## Multiplayer

- Every recruiter chases the same dev at the same time, but each one plays **on their own**:
  a good pitch shows that recruiter the reward, and Ben keeps running for everyone else.
  There are no rounds or winners (competitive rounds, F-024, were dropped).
- **Alone:** the rules are the same with one recruiter. When the server is down, the game
  stays explorable (F-023), but the chase and the pitch need the server.

## Rewards (F-043, F-041)

A good pitch opens the **"You got me!" panel**:

- the **real contact details** (email, LinkedIn, …), with copy buttons
- a **CV PDF** download
- the **"Hired the dev"** achievement

Other achievements (F-041): "Read the whole CV" (every section panel opened), "Found the
chest", "Hired in under 2 minutes", "Pitched like a pro" (first try).

## Technical principles

- **The server decides.** The dev's movement, catches, intel counts and pitch scores are
  computed on the server, like player moves today (F-022).
- **Shared config** (`shared/`, done in phase 0). The map size, spawn point, building layout,
  walkability rule and the dev's preferences live in one place imported by both client and
  server. Districts (F-005) go there too.
- **Known limit:** minigame results are reported by the client, so a modified client could
  fake intel. That's acceptable at these stakes; revisit if a leaderboard is added.

## Open questions (needs the CV owner)

- [x] Real CV content: experiences, skills, education, languages (F-030), in `src/content/cv.ts`.
      Still missing: **projects** (the Projects Lab district has nothing to show yet).
- [x] The dev's real preferences: stack and work mode (F-042). Still open: role types and
      deal-breakers.
- [ ] Review the skill levels in `src/content/cv.ts` (derived from years of use)
- [x] Contact details to reveal, and the CV PDF file (F-043): LinkedIn, email, `public/CV_POIGNANT_BENJAMIN.pdf`
- [x] The dev's name and look (F-060): Ben, jeans, white shirt, glasses
- [x] Which districts besides Skills and Experience, and where they go on the map (F-005):
      Education Campus (bottom-left); the bottom-right quarter waits for the Projects Lab
- [x] Should a straight chase be enough to catch the dev? No: he sprints when a recruiter
      gets very close, so recruiters have to corner him (F-061).

## Ideas not yet scheduled

- Speech bubbles for the dev (F-062) and recruiter-spam hazards: flying "exciting
  opportunity" emails that slow you down (F-063).
- A minimap showing districts and the dev's last known position.
- Recruiter emotes ("👋", "📞 quick call?").
- A leaderboard of fastest hires (needs server-side checks of minigame results first).
- Seasonal events: "Black Friday hiring spree" with double recruiters.
