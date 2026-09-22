# StackEDU Design System

> Design system for **StackEDU** — a centralised Educational Management System for Rwandan tertiary institutions, built by **StackForgeAI**.

This system covers color, typography, spacing, iconography, components, and a working web UI kit for the platform. It is grounded in the existing **StackFix** repair‑management product (whose tokens were lifted directly into this system) and the StackEDU PRD v1.1.

---

## Index

| File / Folder | Purpose |
|---|---|
| `colors_and_type.css` | Single source of truth for color, type, spacing, radii, shadow, motion tokens. |
| `assets/` | Logo marks, brand glyphs. Drop new artwork here. |
| `fonts/` | Clash Grotesk OTF files (primary UI face). |
| `preview/` | Visual specimen cards rendered in the Design System tab. |
| `ui_kits/stackedu_web/` | High‑fidelity React/JSX recreation of the StackEDU web app. Start at `ui_kits/stackedu_web/index.html`. |
| `SKILL.md` | Agent skill manifest — load this to design with the StackEDU brand. |
| `uploads/` | Original source materials (PRD docx, original logos). |

---

## 1 · Company & Product Context

**StackForgeAI** is a Kigali‑based technology company (Kiyovu, Kigali; RDB TIN 156306392) building AI‑powered software and digital infrastructure for African governments, universities, and businesses. Its stated ambition is to be the leading AI infrastructure & software engineering company in Kigali and Africa.

### Products in the StackForgeAI portfolio

| Product | Status | What it is |
|---|---|---|
| **StackFix** | Live | Repair‑management SaaS. Tracks service requests, technicians, and operational metrics. *(Source of this design system's tokens.)* |
| **StackEDU** | In development | Centralised Educational Management System for Rwandan tertiary institutions. *(The focus of this system.)* |
| **Rwanda Directory** | Coming soon | Digital directory of registered businesses by industry. |

### StackEDU in one paragraph

StackEDU is a centralised, cloud‑based EMS for Rwandan universities, polytechnics, and colleges. It replaces fragmented spreadsheets, manual fee tracking, and hand‑computed results with a single, mobile‑first platform engineered for the Rwandan context: MTN MoMo and Airtel Money integration, card and bank‑transfer payments, SMS notifications, offline‑tolerant design, and compliance with Rwanda's data protection framework. One login, one data store, one source of truth.

### Roles served (6)

`Student` · `Lecturer` · `Bursar` (admin) · `Academic Admin` · `Librarian` (admin) · `ICT Manager`. Each role has a strictly‑scoped permission set — see Part C of the master context.

### Source materials

- **EMS Master Context** — `uploads/EMS_Master_Context_StackForgeAI.docx` (full PRD, design foundation, and tech architecture).
- **StackFix codebase** — `https://github.com/StackForgeAI-Projects/stackfix` (the production repo whose tokens this system was extracted from). Browse it for ground‑truth component implementations (shadcn/ui + Radix UI on Tailwind v4) — the StackEDU implementation will closely mirror its structure.
- **Brand marks** — `uploads/Icon white BG New (1).png`, `uploads/Icon black BG New (1).png` (also normalised into `assets/`).
- **Company site** — `https://stackforgeai.africa`

---

## 2 · Content Fundamentals

StackEDU's voice is **institutional, plain, and reassuring** — it speaks like a calm registrar, not like a startup. Students using their own mobile data on a slow connection need to understand *exactly* what is happening, why, and what to do next. Lecturers entering grades at the end of a long term need to make zero mistakes. The copy supports both.

### Voice

- **Direct address — "you" / your".** Always second person to the end‑user. Never first‑person plural ("we", "our") inside the product; "we" is reserved for institutional comms.
- **Active voice, present tense.** *"Results published 12 Dec."* not *"Results were published on the 12th of December."*
- **Plain English, British spelling.** "Programme", "enrolment", "organise", "centralised". Match Rwandan English‑medium academic conventions.
- **Numbers and dates carry the weight.** Surface the figure or the date — let it land first. *"RWF 380,000 outstanding · due 30 Jun"* not *"You have an outstanding balance of three hundred and eighty thousand Rwandan Francs due on the 30th of June."*

### Tone

- **Confident, never breezy.** No exclamation marks. No "Awesome!" / "Oops!" / emoji.
- **Reassuring on payments and results.** When money or grades are involved, the copy errs toward clarity over cleverness: *"Payment received. Receipt #PAY‑002841 sent to your email."*
- **Specific on errors.** Error copy names the field, says what happened, says what to do. *"Mobile number must start with 078, 079, 072 or 073."* not *"Invalid input."*

### Casing

- **Sentence case** for headings, buttons, menu items, and table column headers — *"Course registration"*, *"Submit for review"*, not "Course Registration" or "SUBMIT FOR REVIEW".
- **Uppercase labels** (with `letter-spacing: 0.04em`) reserved for chips, status badges, and `.t-label` micro‑labels — *"ENROLLED"*, *"PAID"*, *"PENDING REVIEW"*.

### Conventions

- **Currency** — *RWF 380,000* (ISO code first, integer Rwandan Francs only, comma thousands separator, no decimal).
- **Dates** — *30 Jun 2026* in tables / dense UI; *Tuesday, 30 June 2026* in confirmations and full views.
- **Times** — 24‑hour clock: *14:30*, not *2:30 PM*.
- **Student / staff IDs** — set in `JetBrains Mono`: `STU‑2024‑0481`, `LEC‑0117`. Always uppercase, hyphenated.
- **Phone numbers** — *+250 78 234 5678* with a non‑breaking space after the country code.
- **Programme names** — Title Case: *BSc Software Engineering*.

### Sample microcopy

| Surface | Copy |
|---|---|
| CTA on dashboard | **Pay fees** / **Register courses** / **View results** |
| Empty state | **No notifications yet.** When fees, results or registrations are released you'll see them here. |
| Success toast | **Result submitted.** SE401 marks published to 42 students. |
| Destructive confirm | **Suspend Jean‑Paul Mugisha?** Suspended students lose portal access until reinstated. This is reversible. |
| Error (form) | **Enter a valid Rwandan mobile number** — must start with 078, 079, 072 or 073. |
| Fee hold banner | **Fee hold active.** Course registration is blocked until your balance is cleared. See the Bursar's office. |
| Inline help | Marks out of 100. Auto‑rounded to one decimal place on publish. |

---

## 3 · Visual Foundations

### Personality in one line

**Institutional clarity with a single, electric jolt of brand green.** Mostly quiet, mostly monochrome — then `--brand` (#20F44E) lights up the one action that matters on the screen.

### Color

- **Two anchor colors carry the brand.** `--ink` (#05131D) — a near‑black with a hint of blue — owns the sidebar, dark surfaces, and primary text. `--brand` (#20F44E) is an electric, slightly cool green used **sparingly**: primary CTAs, active nav state, focus rings, progress bars, the logo accent slab.
- **Light app surface.** The app canvas is `--background` (#F8FAFC) with white (`--card`) panels and a 1px `--border` (#E2E8F0) rule. Avoid grey gradients; cards are flat with hairline borders, lifted only by `--shadow-sm` on hover.
- **Semantic colors are calm.** Success, warning, error, info each have a strong stem (`--success` etc.) and a desaturated background (`--success-bg` etc.) used for badge fills and inline alerts. They never carry brand weight.
- **No bluish‑purple gradients.** No emoji‑coded category cards. No tinted hero washes. If a surface feels too quiet, the answer is the Ink sidebar or a single brand‑green focal element — not gradient soup.

### Typography

- **Clash Grotesk** (headings & display) — geometric, modern, slightly characterful at heavier weights. Used for `Display 48/700`, `H1 32/700`, `H2 24/700`, `H3 18/600`, marketing copy, and the page hero. Weights in use: 400, 500, 600, 700.
- **Inter** (paragraphs & UI text) — neutral, highly legible at small sizes. Used for `Body Large 16/400`, `Body 14/400`, `Body Small 13/400`, `Caption 12/400`, `Label 11/600`, and every form / table / button. Weights in use: 400, 500, 600, 700.
- **JetBrains Mono** (numerals & IDs) — `13px`, `400`, for student IDs (`STU‑2024‑0481`), course codes (`SE401`), and payment references.
- **Tight tracking on big Clash Grotesk sizes.** `letter-spacing: -0.02em` on Display, `-0.015em` on H1, `-0.01em` on H2; default on Inter body.
- **Generous line height on long copy.** `1.6` on Body Large, `1.5` on Body — readable on phones over a 3G connection.
- **Pretty text wrap.** `text-wrap: pretty` on body paragraphs and headlines.

### Spacing

4px base grid; tokens at 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Card internal padding is 24px (`--space-6`); page horizontal padding is 32px (`--space-8`); section breaks 48px (`--space-12`). Field row gap inside forms is 16px (`--space-4`).

### Radii

A medium‑rounded system, never pill‑heavy. **Cards & modals:** `--radius-xl` (18px) / `--radius-2xl` (22px). **Buttons & inputs:** `--radius-md` (12px) / `--radius-lg` (14px). **Badges & chips:** `--radius-sm` (10px). The logo mark itself has a softer corner ramp (`~26px` at the 700×700 export size) and reads as `--radius-3xl` at small sizes — used for marketing surfaces and onboarding splashes.

### Borders

1px solid `--border` (#E2E8F0) is the workhorse. Cards, inputs, table rules, dividers — all share this token. Dark surfaces use `--ink-border` (#1F2A35). Focus is a 3px `--brand` ring at 35% opacity (`--shadow-focus`), never a thicker outline.

### Shadows

A small system, all `Ink`‑tinted (rgba(5,19,29,…)) rather than neutral black so shadows feel native to the palette.

- `--shadow-xs` — flat icon backgrounds.
- `--shadow-sm` — card resting (only when needed; many cards sit on borders alone).
- `--shadow-md` — popovers, hovered cards.
- `--shadow-lg` — sheets, dropdown menus.
- `--shadow-xl` — modals, dialogs.
- `--shadow-focus` — keyboard focus ring (brand‑green, 35% opacity).

### Hover, press, focus

- **Hover (light surface):** background shifts to `--muted` (#F1F5F9) or border darkens to `--foreground` at 12% mix. No scale, no translate.
- **Hover (CTA `--brand`):** the green deepens ~6% (`#0CE03E`); on Ink CTAs the surface lifts to `--ink-surface`.
- **Press:** brightness × 0.96 on filled buttons; no scale on row hovers.
- **Focus:** always the 3px brand‑green ring (`--shadow-focus`) — visible on every interactive element. Never rely on default browser outline.
- **Disabled:** opacity 0.5, no hover state, `cursor: not-allowed`.

### Backgrounds & imagery

- The app is **flat and panelled** — no full‑bleed photography behind UI. Imagery (institution logos, student avatars) is contained inside cards and avatars.
- **Marketing & onboarding** screens may use a single Ink hero with the brand‑green accent slab from the logo as a graphic motif — never gradients or stock photography of students. If institution photography is provided, it is treated with a slight cool/warm balance to sit alongside the green without clashing.
- **No patterns, no textures, no grain.**

### Animation

A small, restrained motion vocabulary:

- **Easings** — `--ease-out` (cubic‑bezier(0.16, 1, 0.3, 1)) for enter; `--ease-in-out` for state toggles.
- **Durations** — `120ms` (state changes: hover, focus), `180ms` (popovers, dropdowns), `280ms` (sheets, modals).
- **Allowed:** fade + 4px translate for toasts and popovers; opacity for skeletons; width transitions for progress bars.
- **Disallowed:** bounce easings, spring physics, parallax, looping ambient animation, hero word‑by‑word reveals.

### Transparency & blur

Used sparingly. A single `backdrop-filter: blur(12px)` on the modal scrim (rgba(5,19,29,0.4)) and on the mobile sidebar drawer overlay. Body, sidebar, cards are fully opaque.

### Card anatomy

Default card: `background: var(--card)` · `border: 1px solid var(--border)` · `border-radius: var(--radius-xl)` (18px) · `padding: var(--space-6)` (24px) · no shadow at rest, `--shadow-sm` on hover when interactive. Card title uses `.t-h3`; supporting text `.t-body-sm`.

### Layout rules

- **Fixed sidebar** 248px expanded / 72px collapsed, full‑height, `--ink` background.
- **Sticky top header** 64px, white, hairline bottom border.
- **Content max‑width** 1400px, centred, with 32px horizontal padding.
- **Mobile** (<= 768px): sidebar becomes a left‑drawer behind a hamburger; header shrinks to 56px; content padding drops to 16px.

---

## 4 · Iconography

**Library — Lucide React (v0.575+).** Same library used in StackFix. Import individual icons by name; do not bundle the full set.

- **Stroke style:** 1.5px (Lucide default `stroke-width: 2` adjusted down to `1.5` via a wrapper for a more refined look at 16–20px sizes).
- **Sizes in use:** 14px (inline in text), 16px (table rows, inputs), 18px (nav, dropdown triggers), 20px (sidebar, header buttons), 24px (stat tiles, large CTAs).
- **Color:** inherits `currentColor` — typically `--muted-foreground` at rest, `--foreground` on hover, `--brand` only when paired with an active/selected state.

A non‑exhaustive list of the icons relied on across the platform: `LayoutDashboard`, `GraduationCap`, `BookOpen`, `Library`, `CalendarDays`, `Wallet`, `CreditCard`, `Receipt`, `Users`, `UserCog`, `FileText`, `ClipboardCheck`, `ChartLine`, `BellRing`, `Search`, `Settings`, `LogOut`, `ChevronDown`, `ChevronRight`, `Check`, `X`, `Upload`, `Download`, `Plus`, `Filter`, `MoreHorizontal`, `Loader2`, `ShieldCheck`, `AlertTriangle`, `Info`, `CheckCircle2`, `XCircle`.

In this design system we **link Lucide from CDN** (`https://unpkg.com/lucide@latest/dist/umd/lucide.js`) inside the UI kit to keep prototypes lightweight. Production StackEDU consumes `lucide-react` from npm.

**Other icon vocabulary:**

- **No emoji.** Anywhere. They look casual and read inconsistently across Rwandan Android devices.
- **No unicode icons** (★, ✓ etc) except inside the JetBrains Mono ID style where a `·` separator is allowed.
- **Logo mark** (`assets/logo-mark-on-light.png`, `assets/logo-mark-on-dark.png`) — used for splash, sidebar collapsed state, favicon. The mark has a green accent slab that is **iconic to the brand** and is the only place the bright green appears as a non‑functional graphic.
- **Institution logos** — uploaded by each institution during onboarding, displayed in the header on a 64×64 white tile next to the StackEDU mark.

---

## 5 · Caveats & substitutions

- **Type system overridden from the master context.** The original master context specified Plus Jakarta Sans across the board. Per direction from the project owner this has been replaced with a two‑family system: **Clash Grotesk** for headings and display (local OTF files in `fonts/`), and **Inter** for paragraphs and UI text (Google Fonts CDN). Plus Jakarta Sans is no longer referenced anywhere in this system. If StackFix's production CSS still uses Plus Jakarta Sans, the StackEDU implementation should be updated to match.
- **Inter and JetBrains Mono are loaded from Google Fonts CDN.** No local files provided for these. Swap to local files under `fonts/` if data residency requires it.
- **No Figma file provided** — this system is derived from the EMS Master Context document only. The StackFix codebase (linked above) is the closest visual reference for component patterns.
- **Lucide is the icon set by inference** — confirmed by the master context. The actual SVG sprite is loaded from CDN in the UI kit; production should `npm i lucide-react`.

See `SKILL.md` for instructions on using this system inside an agent like Claude Code.
