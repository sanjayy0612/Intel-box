# IntelBox design system

Handoff document. Reference it when implementing frontend work — e.g. "implement
the run detail screen per `docs/design-system.md`".

Every color and type decision in the app should derive from this document. If
something isn't specified here, it isn't in the system yet — add it here first,
then build it.

> **Amendments.** Section 12 lists every change made to the original handoff
> during implementation, with the measurement that forced each one. Five of the
> original color values failed the contrast floor in section 9; those values are
> corrected in place below, and section 12 records what they were.

---

## 1. Design thesis

IntelBox is a self-hosted market intelligence agent for sales, BD, and research
work. Its one real differentiator is that **the agent decides which research
tools it needs** instead of running a fixed pipeline. Everything in the design
should serve that claim.

The visual direction is a **specialty coffee lab**: a cupping score sheet
crossed with a research terminal. Warm, precise, instrument-like. Light,
disciplined chrome with one dark inset panel where the work happens — espresso
in a white cup.

**The single job of the interface:** make the agent's reasoning legible, then
get out of the way of the report.

### Anti-defaults — do not build these

Machine-generated design converges on a few recognisable looks. Avoid all three:

1. Cream background (`#F4F1EA`-ish) + high-contrast serif display + terracotta
   accent.
2. Near-black background + one acid-green or vermilion accent.
3. Broadsheet layout — hairline rules everywhere, zero border-radius, dense
   newspaper columns.

The palette below is warm *and* avoids (1) by making the accent green and
rationing the warm gold to a single semantic role. Hold that line.

Also avoid: pillowy 16px+ radii, drop shadows for hierarchy, gradient fills,
icon-per-feature grids, animated counters, and decorative numbered markers.

---

## 2. Color

Six tokens. Nothing outside this list ships.

| Token | Hex | Role |
|---|---|---|
| Roast | `#191512` | Primary text; the extraction log panel background |
| Porcelain | `#F4F2ED` | App background |
| Cup | `#FFFFFF` | Cards, panels, input surfaces |
| Verdigris | `#2F5D50` | Primary accent — primary buttons, links, active nav, fresh state |
| Crema | `#E0A64B` | Active or expiring — running steps, aging cache. Rationed. |
| Ash | `#8C8579` | Muted text, hairlines, disabled |
| Ember | `#A63D33` | Failure, stale cache, destructive |

Verdigris is coffee-leaf green and patina on an espresso machine — warm-adjacent
without being terracotta. Crema is the only warm gold in the system.

### Crema has one meaning

Crema means **something is happening, or is about to need you**. It appears on:

- the currently running tool call in the extraction log
- a cache entry aging toward its 30-day expiry
- a follow-up coming due

It does not appear as decoration, on hover states, in the logo, or in a fourth
context. If you find it somewhere that isn't one of those three, that context is
wrong.

Within a sanctioned context, a list may legitimately show several at once — the
company library's freshness column marks every aging entry, because marking only
one would make the column useless. The rule bans a second *context* in a
viewport, not a second row of the same one.

### Status semantics

Every state indicator draws from this mapping — do not invent new colors for new
states.

| State | Color | Form |
|---|---|---|
| Idle / queued | Ash | Hairline pill, no fill |
| Running | Crema | Filled pill, mono label |
| Complete / fresh | Verdigris | 6px dot, or filled pill |
| Aging (cache 21–30 days) | Crema | 6px dot |
| Stale (cache 30+ days) | Ember | 6px dot + "Re-run" action |
| Failed | Ember | Filled pill + reason text |
| Skipped | Ash | Struck-through mono label |

### CSS custom properties

```css
:root {
  --roast:      #191512;
  --porcelain:  #F4F2ED;
  --cup:        #FFFFFF;
  --verdigris:  #2F5D50;
  --crema:      #E0A64B;
  --ash:        #8C8579;
  --ember:      #A63D33;

  --bg:              var(--porcelain);
  --surface:         var(--cup);
  --surface-sunken:  #EDEAE4;
  --surface-inset:   var(--roast);

  --text:            var(--roast);
  --text-secondary:  #5C564E;
  --text-muted:      #6E685D;   /* darkened Ash; see §12.1 */
  --text-on-inset:   #EDE9E1;
  --text-on-accent:  #FFFFFF;
  --text-on-ember:   #FFFFFF;   /* §12.4 */

  --hairline:         rgba(25, 21, 18, 0.10);
  --hairline-strong:  rgba(25, 21, 18, 0.18);
  --hairline-inset:   #2E2823;

  --accent:        var(--verdigris);
  --accent-hover:  #264C41;
  --ember-on-inset: #D9695C;    /* §12.3 */

  --focus-ring: 0 0 0 3px rgba(47, 93, 80, 0.18);
}
```

`--ash` remains the palette token for dots, hairlines, and text on the Roast
inset panel, where it measures 5.0:1. It is not used for muted text on light
surfaces — see §12.1.

### Dark mode

Ship it — this is a tool people keep open during focused work. Dark mode
inverts the chrome but **not** the extraction log, which is already Roast and
stays put. That's the point: in light mode the log is a dark inset; in dark mode
it's flush with its surroundings and the surrounding chrome recedes.

```css
[data-theme="dark"] {
  --bg:              #14110F;
  --surface:         #1E1A17;
  --surface-sunken:  #100E0C;
  --surface-inset:   #100E0C;

  --text:            #EDE9E1;
  --text-secondary:  #B5AEA3;
  --text-muted:      #928B7F;   /* §12.2 */

  --hairline:         rgba(237, 233, 225, 0.10);
  --hairline-strong:  rgba(237, 233, 225, 0.18);

  --accent:         #529B84;    /* §12.2 */
  --accent-hover:   #62AB94;
  --text-on-accent: #12100E;    /* §12.2 — dark label on a light fill */

  --focus-ring: 0 0 0 3px rgba(82, 155, 132, 0.32);
}
```

Verdigris lightens in dark mode to hold contrast against the dark surface.
Crema and Ember stay as-is — they read correctly on both.

**`--text-on-accent` is theme-dependent.** In light mode a Verdigris fill takes
a white label; in dark mode the accent is light enough to need a dark one. Never
hardcode `#FFFFFF` on an accent surface. Ember is dark in both themes, so it has
its own always-white `--text-on-ember`.

### Contrast requirements

- Body text on any surface: 4.5:1 minimum.
- Mono metadata labels: 4.5:1. Raw Ash does not clear this on Cup (3.7:1) or
  Porcelain (3.3:1), which is why `--text-muted` is a darkened Ash rather than
  Ash itself.
- Verdigris on Cup passes for text and for large UI. White on Verdigris passes.
- Never encode information by color alone. Every status color pairs with a
  label, glyph, or shape (see the status table — each row has a distinct form).

Verified with axe-core across all ten routes in both themes; see §12.6.

---

## 3. Typography

Three faces, three jobs. All available on Google Fonts.

| Role | Face | Weights | Used for |
|---|---|---|---|
| UI / display | Schibsted Grotesk | 400, 500 | Headings, buttons, nav, body chrome |
| Data / label | IBM Plex Mono | 400, 500 | Eyebrows, timestamps, tool names, metrics, log entries, IDs |
| Reading | Source Serif 4 | 400, 600 | The intelligence brief body — nowhere else |

**Bundle the fonts, don't fetch them.** They are installed as `@fontsource`
packages and imported in `src/main.jsx`. IntelBox is self-hosted with no
telemetry and must work air-gapped; a CDN request on every page load contradicts
the product's own argument.

### Why three

The mono isn't decorative. Cupping score sheets and agent tool-logs are both
genuinely tabular records of timed observations — mono is the correct face for
run IDs, durations, tool names, and result counts, and it does the work a
"technical" accent color would otherwise be asked to do.

Source Serif appears **only** inside the rendered report body. The brief is
long-form prose meant to be read at length; serif is functional there. It must
not leak into headings, cards, marketing copy, or the playbook panel's chrome.
One exception, strictly enforced — it lives in `Report.module.css` and nowhere
else.

```css
:root {
  --font-ui:    "Schibsted Grotesk Variable", "Schibsted Grotesk", system-ui, sans-serif;
  --font-mono:  "IBM Plex Mono", ui-monospace, "SF Mono", monospace;
  --font-read:  "Source Serif 4 Variable", "Source Serif 4", Georgia, serif;
}
```

### Scale

| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 40 / 1.05 | 500 | -0.02em | Landing hero only |
| `h1` | 30 / 1.15 | 500 | -0.015em | Page title |
| `h2` | 22 / 1.25 | 500 | -0.01em | Section, company name |
| `h3` | 17 / 1.35 | 500 | 0 | Card title, panel header |
| `body` | 15 / 1.6 | 400 | 0 | Default |
| `body-sm` | 13.5 / 1.55 | 400 | 0 | Secondary, table cells |
| `caption` | 12 / 1.4 | 400 | 0 | Helper text, hints |
| `mono-label` | 11 / 1.2 | 500 | 0.08em | Eyebrows, uppercase |
| `mono-data` | 12.5 / 1.4 | 400 | 0 | Log lines, durations, IDs |
| `read` | 17 / 1.7 | 400 | 0 | Report body (Source Serif) |

Available as utility classes — `.t-h1`, `.t-body-sm`, `.t-mono-label` — in
`src/styles/base.css`.

Two UI weights only: 400 and 500. No 600, no 700 — heavier weights make a
warm-neutral palette look cheap. Source Serif may use 600 for headings *inside*
the report, since that's a document, not chrome.

**Sentence case everywhere.** Never Title Case, never all-caps — except
`mono-label`, whose uppercase treatment is what distinguishes an eyebrow from a
heading.

Optical detail: `tabular-nums` is applied to `.t-mono-label`, `.t-mono-data`, and
anything carrying `[data-numeric]`, so durations and counts don't jitter as they
update during a live run.

---

## 4. Space, shape, surface

**Spacing** — 4px base. Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`. Nothing
between steps.

- Card padding: `20px 24px`
- Section rhythm: `32px` between sections, `48px` above a new page region
- Form field gap: `16px`
- Table row height: `48px`; dense variant `40px`
- Page gutter: `32px` desktop, `20px` tablet, `16px` mobile

**Radius** — `--radius-sm: 4px`, `--radius: 6px`, `--radius-pill: 999px`.
6px is the default for cards, inputs, buttons, and panels. It reads as precise
tooling rather than consumer-app softness. Nothing gets 12px or above. Pills are
for status indicators only.

**Borders** — `1px solid var(--hairline)`. Hierarchy comes from hairlines and
spacing, never from shadows.

**Elevation** — one shadow in the system, and only for genuinely floating layers
(dropdowns, drawers, dialogs):

```css
--shadow-float: 0 8px 24px rgba(25, 21, 18, 0.10),
                0 2px 6px rgba(25, 21, 18, 0.06);
```

Cards, panels, and tables get no shadow. If two floating layers are open at
once, the second should have been a drawer or a dialog.

**Layout** — persistent left rail, 220px expanded / 56px collapsed. Content max
width 1200px. Primary content split is 8/4 (report + side panels) on the run and
profile screens; single column elsewhere. Rail collapses to a top bar under
900px, and to glyph-only under 560px.

**Motion**

```css
--dur-fast: 120ms;  --dur-base: 180ms;  --dur-slow: 280ms;
--ease: cubic-bezier(0.2, 0, 0.13, 1);
```

Animate `transform` and `opacity` only. The one orchestrated moment in the app
is a new log entry arriving during a live run: fade + 4px upward translate over
`--dur-base`. Nothing else animates on arrival. No page transitions, no
staggered card reveals, no animated counters.

Wrap every animation in `@media (prefers-reduced-motion: no-preference)`. The
app must be fully usable and legible with motion off — a live run with reduced
motion simply appends entries with no transition, and the landing hero shows the
finished log rather than replaying it.

---

## 5. Components

Implemented in `src/components/ui/`, exported from its `index.js`. Build screens
from these; a screen that needs a new primitive needs an entry in this section
first.

### Buttons

Height 36px, `padding: 0 16px`, radius 6px, `font-ui` 14px/500.

- **Primary** — Verdigris fill, `--text-on-accent` label. **One per view, maximum.**
- **Secondary** — transparent, `1px solid var(--hairline-strong)`, hover fills
  `--surface-sunken`.
- **Ghost** — transparent, no border, hover fills `--surface-sunken`. For
  table-row and toolbar actions.
- **Destructive** — Ember label on secondary chassis; fill only on the
  confirmation step inside a dialog.

Avoid disabled buttons. Keep them enabled and explain on use — a disabled
control is low-contrast and offers no tooltip on touch. Where you must disable,
pass `disabledReason`, which surfaces on hover and focus.

Never a spinner inside a button. Run state belongs in the extraction log, which
is the one place the app reports progress.

### Inputs

Height 38px, `--surface` background, `1px solid var(--hairline-strong)`, radius
6px, 15px `font-ui`. Focus: `box-shadow: var(--focus-ring)` plus border to
Verdigris. Label above at `body-sm`/500; helper text below at
`caption`/`--text-muted`.

Placeholders show a **real valid example** — `Zepto`, `quick commerce` — never
`e.g. …` and never a restatement of the label.

`ChoiceField` and `ToggleField` cover scope controls. Both carry a helper line
stating the consequence of the choice in plain language.

### Tables

The primary data surface (company library, tracker, people). Hairline row
separators, no vertical rules, no zebra striping. Header row: `mono-label`,
`--text-muted`, sticky. Numeric and date columns right-aligned with
`tabular-nums`. Whole row is the click target — implemented as a real link in
the first cell with a stretched `::after`, so it keeps keyboard focus and an
accessible name. Row actions appear as ghost buttons on hover and on
`:focus-within`; an action that is the affordance for a state, like a stale row's
`Re-run`, stays visible.

Below 700px each row becomes a stacked block, with the column header moving into
a mono label beside each value. Empty cells drop out rather than stacking as a
bare label.

### Status pill

`--radius-pill`, `padding: 4px 10px`, `mono-label`. Fill and form per the status
table in §2. Never more than one pill per row or card region.

### Freshness dot

6px circle + `body-sm` relative age ("researched 4 days ago"). Verdigris fresh,
Crema aging, Ember stale. Stale rows always pair the dot with a visible "Re-run"
ghost button — the color is a hint, the button is the affordance.

### Tabs

Underline style, `1px` Verdigris on the active tab, `--text-muted` on inactive.
Count badges in `mono-data`. Roving `tabindex` with arrow, Home, and End keys.
Tabs switch panels within one record — they never change the URL's meaning
beyond a fragment, and they never hide something the user needs to compare
against what's currently shown.

### Drawer

Right-side, 480px, `--shadow-float`, ESC and overlay-click to dismiss, focus
trapped, focus restored to the trigger on close. Used for person detail and
draft editing — anywhere the user needs detail without losing their place in a
list.

### Empty states

An invitation, not an apology. `h3` naming the space, one line of `body-sm`
explaining it, one primary button.

- Company library: "Research your first company" → `Run research`
- Tracker: "No outreach sent yet" → `View drafts`
- Run detail, pre-start: "The agent hasn't chosen its tools yet" → `Start run`

Never "No data available", never "Nothing here yet", never an illustration.

---

## 6. The signature element: the extraction log

This is the one thing the app should be remembered by. It gets the boldness
budget; everything around it stays quiet.

**What it is.** A Roast-background inset panel that renders the agent's tool-use
loop as a timed, numbered record — a brew log. Live during a run, permanent
afterward as part of the run's provenance.

**Structure.** Panel header: `mono-label` "Extraction log" left, running totals
("4 calls · 7.4s") right. Then one row per tool call, separated by
`--hairline-inset`:

```
01  web_search                                            1.8s
    Zepto funding, category share, launches — 12 results

02  competitor_search                                     3.2s
    6 competitors mapped in the same category

03  scrape_url                                               —
    Skipped — Search results already covered the about page

04  linkedin_search                                       2.4s
    Looking for growth and category leads
```

Grid: `26px | 1fr | auto`. Index in `mono-data`/`--text-muted`; tool name in
`mono-data` at `--text-on-inset`; the human-readable outcome beneath in
`body-sm` at Ash. Duration right-aligned, `tabular-nums`. The index is rendered
bare, not bracketed — see §12.5.

Below 520px the duration drops to its own line under the tool name; the index
column stays.

**The running row** takes Crema on its top hairline, its index, its tool name,
and its duration. It is the only Crema in the viewport. A 2px extraction bar
under the last row fills toward completion.

**Numbering is load-bearing.** The calls genuinely are a sequence — order
carries information the reader needs, because each call was chosen in reaction
to the previous result. This is the case where numbered markers earn their
place; do not copy the pattern to non-sequential lists elsewhere in the app. The
index counts *calls*, not distinct tools: an agent that searches twice shows two
rows.

**Show skipped steps.** When the agent declines a tool, render the row with the
tool name struck through in Ash and state the reason. Most products would hide
this. Surfacing it is the single most persuasive detail in the interface — it's
the visible proof that the agent reasoned rather than fanned out. Never suppress
a skip.

Skips are collected after the tool loop ends: the agent is asked to close with
one `SKIPPED: tool_name -- reason` line per tool it didn't call, and
`orchestrator._parse_skip_reasons` turns those into steps. A tool that was never
offered to the agent — `linkedin_search` when the run was scoped without people —
is not a skip and is not shown.

**Failure text.** Ember is 2.9:1 on Roast and cannot be used for text inside the
panel. Failed rows use `--ember-on-inset`, and always pair the color with a
written "Failed —" label.

**Fallback mode.** When no LLM provider is configured the orchestrator calls all
four tools unconditionally. The run carries `fallback_mode: true` and the log
says so plainly at the top of the panel: "No provider configured — running all
tools." Do not let the fallback masquerade as agentic behaviour.

**Semantics.** The panel is an `<ol>` with `aria-live="polite"`. The extraction
bar is a `role="progressbar"` with a real `aria-valuenow`. Only genuinely new
rows animate; a poll that re-renders the list must not re-animate it.

---

## 7. Information architecture

Ten routes. Detail lives in tabs and drawers, not in more pages — every
additional route is something a user has to learn.

### Public

**1. `/` — Landing.** Most visitors arrive from GitHub and decide in ten seconds
whether to clone. The hero is **a real extraction log replaying**, showing the
agent choosing `web_search`, then deciding it needs `competitor_search`, then
skipping the scrape. Show the claim working rather than describing it. The
replay never renders an empty panel — it holds the finished log, then restarts
from the first row. Below: what you get (brief, playbook, people), the
self-hosted argument (no accounts, no telemetry, MIT), setup in four commands.

### Workspace

**2. `/app` — Dashboard.** Answers "what's happening": runs in flight, recent
briefs, cache entries approaching 30 days, and **follow-ups due**.
`IntelBoxRepository.find_follow_ups_due` already exists in the backend and
nothing surfaces it — this page is where that becomes visible.

**3. `/research/new` — New research.** Company, category, plus scope: research
depth, whether to look for decision-makers at all, force-refresh to bypass
cache. State the consequence in plain language ("this will re-run every tool the
agent chooses") rather than hiding it.

**4. `/runs/:id` — Run detail.** The extraction log, then results settling in
beneath it. Tabs once complete: Brief · Competitors · People · Drafts.

**5. `/companies` — Company library.** The biggest gap in the original UI: every
profile is persisted with a 30-day cache and nothing lets you browse it. Table
of company, category, last researched, freshness, people found, outreach status.
Sortable, searchable, stale rows flagged.

**6. `/companies/:slug` — Company profile.** The persisted brief as a readable
document — this is where Source Serif earns its place. Competitors and people as
tabs. Re-run in the header, showing cache age.

**7. `/outreach` — Outreach.** Draft queue grouped by company. Edit, approve,
mark sent. Draft editing in a drawer, because you're comparing drafts rather
than navigating away from them.

**8. `/tracker` — Tracker.** Sent / opened / replied as a table with a follow-up
column. Deliberately not a kanban — this is a data-review task, and kanban would
be decoration. Manual updates via `POST /track`; the same table absorbs
automated follow-up detection later with no redesign.

**9. `/settings` — Settings.** Tabbed: **Provider** (with a live indicator of
which provider is actually resolving — `agent/llm/` auto-detects from whichever
key is set and that's otherwise invisible), **Search** (SearXNG URL + health
check), **Storage** (MCP/Mongo connection state), **Cache** (TTL). Do not render
`google-genai` as configurable; it's an unused dependency and showing it implies
a code path that doesn't exist.

**10. `/login` — Auth.** Stub for the planned multi-user support so the shell
doesn't need rebuilding later. It says accounts aren't wired up rather than
pretending to authenticate.

### Deliberately not pages

Person detail (drawer), competitor comparison (tab on the company profile),
report export (an action, not a destination).

---

## 8. Copy rules

Words are design material. Same intentionality as spacing.

- **Sentence case** everywhere except `mono-label` eyebrows.
- **Buttons name what happens**, verb first: `Run research`, `Mark sent`,
  `Re-run`, `Save changes`. Never `Submit`, `OK`, `Go`.
- **An action keeps its name through the flow.** The button that says `Run
  research` produces a state that says "Researching", and a result that says
  "Research complete."
- **User's vocabulary, not the code's.** "Research depth", never "tool
  fan-out". "Outreach status", never "tracker state". "Last researched", never
  "cache TTL" outside the settings page.
- **Errors say what broke and what to do.** One sentence, no `Error:` prefix, no
  first person, never a raw exception. "SearXNG didn't respond. Check the URL in
  settings." Not "Error: I was unable to complete the request."
- **No "successfully", no "please", no "simply" or "just".** The success state is
  the success message. `Draft saved`, not `Your draft was saved successfully!`
- **Use contractions.** "Can't reach the database", not "Cannot".
- **"Your", not "my".** "Your companies", never "My companies".
- No exclamation marks in system copy. No emoji anywhere.

---

## 9. Quality floor

Not negotiable, and not announced in the UI:

- Responsive to 360px. The rail collapses, tables become stacked rows below
  700px, the extraction log stays legible at every width.
- Visible keyboard focus on every interactive element — a 3px Verdigris ring,
  offset so it stays visible on a Verdigris fill. Never `outline: none` without
  a replacement.
- Full keyboard operation: tab order follows visual order, drawers and dialogs
  trap focus and restore it on close, ESC dismisses. A skip link is the first
  tab stop on every workspace screen.
- `prefers-reduced-motion` respected everywhere.
- Semantic HTML. The extraction log is an ordered list. Live regions
  (`aria-live="polite"`) announce new log entries and run completion.
- Every icon-only control has an `aria-label`; decorative icons are
  `aria-hidden`.
- Text contrast 4.5:1 minimum, verified against both themes.
- No information conveyed by color alone.

---

## 10. Repo notes

`frontend/` — React 18 + Vite 8, `react-router-dom`, no state library.

- **`src/styles/tokens.css`** is the only place raw values live. Everything else
  is a CSS Module beside its component. There are no inline `style={}` objects;
  they can't express focus states, media queries, or `prefers-reduced-motion`.
- **`src/api/client.js`** is the only module that talks to the API.
  **`src/api/adapters.js`** owns every derivation from the API shape to the view
  shape, so components never parse a step key. Anything the backend doesn't send
  is `null`, never approximated — the log is a record, and an invented duration
  is worse than none.
- **`VITE_USE_FIXTURES=1`** runs the whole UI against `src/fixtures/` instead of
  a live backend. `fixtures/runs.js` covers every state in the §2 status table;
  `fixtures/simulate.js` replays a scripted run against the wall clock so the
  live states are reviewable without SearXNG, Mongo, and an LLM key. Any new
  state needs a fixture, or it can't be reviewed.
- **`src/hooks/useAgentRun.js`** is the only hook wired to the backend: `POST
  /run`, then poll `GET /run/:id` every 2s until `completed | failed | cached`.
  It is shared across screens through `app/RunContext.jsx` so navigating from
  `/research/new` to `/runs/:id` doesn't restart the run.
- **`react-markdown` + `Report.module.css`** render the brief. That container is
  the only place that gets `--font-read`.

Backend contract the UI depends on: `AgentStep` carries `kind`, `tool_name`,
`duration_ms`, and a `skipped` status; `AgentRunRecord` carries `fallback_mode`.
Steps are merged by `key` via `AgentRunRecord.apply_step` — anything that
collects them must merge rather than append, or every call renders twice.

---

## 11. Reviewing your own work

Before calling a screen done:

1. Count the Crema. More than one *context*? Cut until one.
2. Count the primary buttons. More than one? Demote.
3. Is Source Serif anywhere outside a report body? Remove it.
4. Any radius above 6px, any shadow on a non-floating element, any gradient?
   Remove it.
5. Does anything animate that isn't a new log entry arriving? Remove it.
6. Read every string. Does it name what the user controls, or what the system
   does internally? Rewrite toward the user.
7. Turn the palette off — grayscale the screen. Is every state still
   distinguishable? If not, the color was doing work a label should do.
8. Run the axe pass in both themes. Zero violations, or it isn't done.
9. Then remove one more thing.

---

## 12. Amendments

Changes to the original handoff, each with what forced it.

**12.1 — `--text-muted` in light mode: `#8C8579` (Ash) → `#6E685D`.**
Ash measures 3.7:1 on Cup and 3.3:1 on Porcelain, against the 4.5:1 floor in §9.
The original document anticipated this ("do not let Ash on Porcelain slip below
this") but left `--text-muted` pointing at Ash. Muted text now uses a darkened
Ash; the raw `--ash` token is unchanged and still used for dots, hairlines, and
text on the Roast panel, where it measures 5.0:1.

**12.2 — dark mode: `--text-muted` `#837C71` → `#928B7F` (was 4.2:1);
`--accent` `#4A8A76` → `#529B84` (was 4.3:1 as text); `--text-on-accent`
→ `#12100E`.**
The accent change forced the third. Dark Verdigris has to clear 4.5:1 twice — as
link and active-nav text on `--surface`, and under the label on a filled button —
and those pull in opposite directions. No single green does both while carrying
white text. Filled accent surfaces therefore take a dark label in dark mode, the
way Crema pills already do in both.

**12.3 — added `--ember-on-inset: #D9695C`.**
Ember is 2.9:1 on Roast. Failure text inside the extraction log needs a
lightened Ember at the same hue. Scoped to the inset panel; do not use it
elsewhere.

**12.4 — added `--text-on-ember: #FFFFFF`.**
Once `--text-on-accent` became theme-dependent, Ember fills inherited a dark
label in dark mode and dropped to 3.0:1. Ember is dark in both themes, so its
label is white in both and needs its own token.

**12.5 — extraction log index rendered `01`, not `[ 01 ]`.**
§6 gave both a bracketed index in its example and a `26px` index column. `[ 01 ]`
needs roughly 52px at `mono-data` and wrapped to three lines. The grid is the
normative value; the brackets were ASCII framing.

**12.6 — verification.**
axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) across all ten routes in
both themes: zero violations. Keyboard behaviour that axe can't see — drawer
focus trap, ESC, focus restoration, tab arrow keys, skip link — is covered by a
scripted Playwright pass.
