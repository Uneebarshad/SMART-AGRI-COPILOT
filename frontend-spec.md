# Smart Agri Copilot — Frontend Specification

| Field | Value |
| --- | --- |
| Document | `frontend-spec.md` (project root) |
| Version | 1.0.0 |
| Date | 3 September 2026 |
| Status | Ready for implementation — hackathon MVP |
| Audience | Frontend developers and AI coding agents building `frontend/` |
| Implementation target | `frontend/` — React 18 + Vite + Tailwind CSS (JavaScript/JSX) |

This document is the complete, implementation-ready specification for the Smart Agri Copilot web frontend. It contains **no application code** and defines no backend implementation; it defines what to build, how it must behave, and how to verify it. A developer or coding agent should be able to implement the frontend from this document without guessing major requirements.

---

## 0. How to read this specification

### 0.1 Requirement keywords

| Keyword | Meaning |
| --- | --- |
| **MUST / MUST NOT** | Required for the hackathon MVP. Non-negotiable. |
| **SHOULD / SHOULD NOT** | Required unless a documented trade-off is approved; implement if timeline allows. |
| **MAY** | Explicitly optional. Safe to skip without approval. |

### 0.2 Sources of truth and precedence

1. **This document** — authoritative for frontend scope, behavior, screens, and acceptance criteria.
2. `.qoder/skills/frontend-design/SKILL.md`, `design-system.md`, `patterns.md` — normative for visual tokens, code conventions, and canonical component implementations.
3. Root `README.md` and `frontend/README.md` — project structure and folder conventions.
4. `frontend/package.json` — dependency policy (hard constraint).

Conflict resolution: this document wins for *behavior and scope*; `design-system.md` wins for *visual token values*; `package.json` wins for *dependencies`. Any conflict MUST be reported in the implementation notes, not silently resolved.

### 0.3 Ambiguity handling

Where an important requirement is genuinely ambiguous (e.g., authentication, chat streaming), this spec documents the ambiguity explicitly in **Appendix A — Open questions and decisions**, together with the recommended default for the MVP. Implementers MUST follow the recommended default and MUST NOT invent conflicting behavior.

### 0.4 Out of scope

- Backend endpoints, models, database, or AI logic (only the **API contract** is defined in §15).
- Building the mobile app (only **compatibility rules** in §19).
- Authentication server, payments, marketplace, IoT sensor integration, CI/CD.

### 0.5 Document map

| § | Area | § | Area |
| --- | --- | --- | --- |
| 1 | Frontend goal | 12 | Accessibility |
| 2 | Target users | 13 | Internationalization |
| 3 | Design principles | 14 | Frontend state management |
| 4 | Application structure | 15 | API integration contract |
| 5 | Required screens | 16 | Security considerations |
| 6 | AI assistant UI | 17 | Performance |
| 7 | Image-based diagnosis UI | 18 | Error / empty / loading states |
| 8 | Dashboard | 19 | Mobile app future compatibility |
| 9 | Responsive design | 20 | Frontend user flows |
| 10 | Component system | 21 | Non-functional requirements |
| 11 | Design system | 22 | Acceptance criteria |

---

## 1. Frontend goal

### 1.1 Purpose

Smart Agri Copilot is an AI-powered agriculture assistant that helps farmers with **crop management, disease identification, and smart farming recommendations**. The frontend is the farmer's daily companion: it presents an AI assistant, image-based leaf/crop disease diagnosis, weather-based farming conditions, crop recommendations, and actionable advice — in the farmer's own language, on the device they already own.

The frontend is a **web application today**, but every architectural decision MUST preserve the ability to convert the product into a **mobile application later without a major rewrite** (§19).

### 1.2 Experience goals

- **Simple** — a farmer with an entry-level smartphone and low technical literacy reaches a useful outcome in under 60 seconds without instruction.
- **Trustworthy** — confidence levels, disclaimers, and sources are always visible for AI output; the app never presents AI guesses as facts and never shows fake data.
- **Modern** — clean, intentional, agriculture-grounded visual design; never a generic AI/SaaS dashboard template.
- **Responsive** — identical feature completeness from a 360 px phone to a 1280 px+ desktop.
- **Fast** — every screen shows feedback immediately; skeletons instead of blank pauses; no layout jumps.

### 1.3 What success looks like (hackathon demo)

1. A first-time user picks اردو / Roman Urdu / English, sets a district, and lands on the dashboard — all in under 60 seconds.
2. They ask the assistant a real farming question in their language and get a plain-language answer with follow-up suggestions.
3. They photograph a diseased leaf, get a diagnosis with confidence, treatment steps, and a disclaimer.
4. They see today's weather with a concrete farming advisory ("Avoid spraying — rain expected within 3 hours").
5. Everything works one-handed on a mid-range Android phone.

### 1.4 Non-goals (MUST NOT build)

| Non-goal | Rationale |
| --- | --- |
| Dark mode | Single warm-light theme per design system; tokens are centralized for later addition. |
| Offline mode / service worker / PWA install | Out of MVP scope; connectivity-tolerant UX (§18) covers degraded networks. |
| Push notifications | In-app notifications panel only (§5.11); push arrives with the future mobile app. |
| Client-side calls to third-party APIs (weather, AI models) | All data flows through the backend (§15.1); keeps keys secure and enables mobile reuse. |
| Marketplace, payments, IoT dashboards | Not part of the product scope. |

---

## 2. Target users

### 2.1 Primary users

Smallholder and family farmers in Pakistan (the initial market implied by the language set: English, Urdu, Roman Urdu), typically managing 1–25 acres of wheat, cotton, maize, rice, sugarcane, or vegetables.

| Attribute | Reality | Frontend consequence |
| --- | --- | --- |
| Technical ability | Low to moderate; WhatsApp-experienced, app-inexperienced | Large touch targets, plain language, no jargon, guided flows |
| Language | Urdu (primary), Roman Urdu (very common in typing), English (educated/younger) | Trilingual UI + AI responses (§13); Urdu is RTL |
| Devices | Mostly mid-range Android phones (2–4 years old); some iPhones; occasional desktop use | 360 px floor, Android Chrome / WebView baseline, low-end performance budget (§17) |
| Connectivity | Intermittent 2G–4G; expensive or capped data | Small payloads, compressed uploads, tolerant loading/error states (§18) |
| Usage conditions | Outdoors in glare, one-handed, dusty hands, shared devices | High-contrast light theme, ≥ 44 px targets, 16 px body text, no hover-only UI |
| Reading habits | Mixed literacy; numbers and icons carry meaning | Icon + text labels (never icon-only), units with values, Western digits (Appendix A9) |

### 2.2 Personas (design archetypes)

| Persona | Profile | Needs from the app |
| --- | --- | --- |
| **Rashid, 47** — wheat & maize farmer, Vehari | Urdu-first, entry-level Android, checks phone in the evening | Ask questions by typing Urdu; scan a leaf; spray/irrigation advice he can trust |
| **Ayesha, 29** — progressive vegetable grower, Multan | Roman Urdu + English, mid-range Android, data-savvy | Quick answers, crop planning ("what should I plant"), history of past checks |
| **Usman, 35** — agriculture extension officer | English, desktop + phone, demos to farmers | Fast, credible demo flow; disclaimers and sources he can point to |

### 2.3 Usage conditions

- Mobile-first: ≥ 80 % of sessions on phones; one-handed operation MUST be possible on all core flows.
- Outdoor readability: WCAG AA contrast is a floor, not a target (§12).
- Interruptions are normal: flows MUST tolerate app switching mid-diagnosis without data loss beyond the in-flight request.

---

## 3. Design principles

| # | Principle | What it means | How it is enforced |
| --- | --- | --- | --- |
| 1 | **Simplicity** | Each screen answers one question and offers one primary action | One primary `Button` per view; `PageHeader` + single column flow; ≤ 5 primary nav items |
| 2 | **Accessibility** | Usable by low-literacy, older, and assistive-tech users | §12 checklist is a MUST; WCAG 2.1 AA |
| 3 | **Mobile-first** | Designed at 360 px, enhanced upward | Write single-column layout first, then `sm:`/`md:`/`lg:` (§9) |
| 4 | **Clear visual hierarchy** | The eye lands on the important thing first | Fraunces display headings, one `h1` per page, badge/status colors reserved for meaning |
| 5 | **Trust and transparency** | Users see what the AI knows and doesn't | Confidence badges, persistent disclaimers, sources when available, clearly-labeled demo fixtures |
| 6 | **Minimal cognitive load** | Fewer choices, sensible defaults, progressive disclosure | District prefilled from settings; advanced inputs optional; follow-up chips instead of blank chat |
| 7 | **Fast interaction** | Feedback is instant; waiting is honest | Skeletons mirror final layout; chat message appears immediately when sent; every data view has all five states (§18) |
| 8 | **Readable typography** | Text is the interface for this audience | 16 px body floor, 12 px absolute floor, sentence case, units with values (§11.2) |
| 9 | **Consistent spacing** | Calm, predictable rhythm | 4 px spacing scale only; token classes only (§11.3) |
| 10 | **Clear error and loading states** | No dead ends, no blank screens | §18 state strategy applies to every data view |

---

## 4. Application structure

### 4.1 Technology foundation and hard constraints

| Constraint | Rule |
| --- | --- |
| Framework | React 18 + Vite + Tailwind CSS 3 (as currently in `frontend/`) |
| Language | JavaScript (`.jsx`) — **no TypeScript** |
| Dependencies | Only `react`, `react-dom` **plus `react-router-dom`**, which this spec authorizes (multi-page routing is required). No other npm additions without user approval — no UI kits, icon packs, animation libraries, state libraries, or i18n frameworks |
| Icons | Inline SVG components (24×24, 1.5 px stroke, `currentColor`, `aria-hidden`) in `src/components/ui/icons/`; never emoji as functional UI icons |
| Fonts | One webfont pair — Fraunces (display) + Inter (body) — loaded via `<link>` in `frontend/index.html`; the single documented exception for Urdu is §13.6 |
| Styling | Tailwind token classes only (`field/soil/sun/sky/rust`, `shadow-card`, scale-based radius/spacing); no inline `style` props, no arbitrary values (`bg-[#3f7d3a]`, `w-[183px]`) |
| State | React built-ins only: Context + hooks + reducers (§14); no Redux/Zustand |
| HTTP | Every network call goes through `src/services/api.js` `request()` wrapper (§15.1); components and pages never call `fetch` |

### 4.2 Directory structure

```
frontend/src/
├── components/
│   ├── ui/              # Presentational primitives — props in, events out; never call services
│   │   └── icons/        # One inline-SVG component per icon file
│   ├── layout/          # AppShell, Navbar, Sidebar, BottomNav, PageHeader, navItems
│   ├── assistant/       # Chat composites (ChatMessage, ChatInput, TypingIndicator, …)
│   ├── diagnosis/       # Leaf-scan composites (ImageDropzone, DiagnosisResult, …)
│   ├── weather/         # Weather composites
│   ├── fields/          # Field cards / grids
│   ├── recommendations/ # Advice cards
│   └── history/         # History list composites
├── pages/               # Routing targets — page-level composition only, no fetch logic
├── hooks/               # useApi, useConversation, useDiagnosis, useWeather, …
├── services/            # api.js — the single HTTP boundary
├── lib/                 # Pure, DOM-free helpers: cn, formatters, validation, storage adapter
├── i18n/                # I18nProvider, useT hook, locales/ (en, ur, ur-Latn)
└── assets/
```

Rules:

- `components/ui/` are purely presentational; they receive data via props and emit events.
- Pages compose components; data flows **hook → component props**; hooks call services; services call HTTP.
- Pure business logic (validation, formatting, reducers) lives in `lib/` with no DOM or React imports — this is the mobile-compatibility seam (§19).
- Fixtures for not-yet-built endpoints live in hooks behind a `USE_FIXTURE` flag, clearly labeled — never inside presentational components, never presented as live data.

### 4.3 Navigation model

Primary navigation — a single source of truth in `src/components/layout/navItems.js`, rendered by both `Sidebar` (desktop) and `BottomNav` (mobile), capped at **5 items**:

| id | Label | Route | Icon | Notes |
| --- | --- | --- | --- | --- |
| `home` | Home | `/` | `SproutIcon` | Dashboard |
| `assistant` | Assistant | `/assistant` | `ChatIcon` (create; same 24×24/1.5 style) | Core product — always one tap away |
| `diagnosis` | Disease check | `/diagnosis` | `LeafIcon` | Image-based leaf/crop diagnosis |
| `weather` | Weather | `/weather` | `CloudRainIcon` | Current + forecast + advisories |
| `settings` | Settings | `/settings` | `SettingsIcon` | Language, district, preferences |

> **Documented divergence:** the illustrative `NAV_ITEMS` in `patterns.md` lists `fields` instead of `assistant`. This spec intentionally places the **AI assistant in primary navigation** because it is the product's core promise ("Agri Copilot") and must be reachable in one tap from anywhere; **My fields** becomes a secondary destination from Home. `BottomNav` still respects the 5-item cap.

Secondary routes (reached contextually and from the desktop sidebar / mobile menu):

| Route | Screen | Reached from |
| --- | --- | --- |
| `/fields` | My fields | Home crops widget, sidebar, mobile menu |
| `/crop-recommendation` | Crop recommendation | Home quick actions |
| `/recommendations` | Recommendations feed | Home recommendations widget ("View all") |
| `/diseases`, `/diseases/:id` | Disease & pest library | Diagnosis results, weather alerts, sidebar |
| `/history` | History | Assistant header, Home recent activity, sidebar, mobile menu |
| `/diagnosis/:scanId` | Saved scan result | History |
| `/assistant/:conversationId` | Resumed conversation | History |
| `/welcome` | Welcome / onboarding | Automatic first run; Settings ("Replay intro") |

### 4.4 Application shell

One `AppShell` wraps every authenticated-area page (all routes except `/welcome` and `*`):

| Region | Mobile (< 1024 px) | Desktop (≥ 1024 px) |
| --- | --- | --- |
| Top | `Navbar` — `h-14`, `bg-white`, `border-b border-soil-200`: brand mark + name, notification bell, menu button (opens slide-in sheet with full route list + language switch) | none |
| Side | none | `Sidebar` — fixed `w-64`, `bg-white`, `border-r border-soil-200`: brand block (with notification bell at right of the brand row), primary nav, divider, secondary links (My fields, History, Recommendations, Disease library), user block at bottom |
| Bottom | `BottomNav` — fixed, `bg-white`, `border-t border-soil-200`, 5 tabs, `min-h-[56px]` items, `pb-[env(safe-area-inset-bottom)]` | none |
| Content | `main` with `pb-20` to clear the tab bar; page padding `p-4 md:p-6` | `lg:pl-64`; content `max-w-6xl mx-auto`; page padding `lg:p-8` |

- Active tab/link: `bg-field-50 text-field-800` with `aria-current="page"`.
- The shell mirrors native-app structure (tab bar + screens) intentionally — it maps 1:1 to React Native tabs later (§19).
- When `react-router-dom` is added, sidebar/bottom-nav anchors become `<NavLink>` with the same class logic; `AppShell` renders routed pages as children — nothing else changes (per `patterns.md`).
- Skip link ("Skip to main content") SHOULD be the first focusable element, targeting `#main`.

### 4.5 Route table

| Path | Page component (`src/pages/`) | Loading strategy | Tier |
| --- | --- | --- | --- |
| `/` | `DashboardPage` | Eager (initial route, fastest first paint) | MUST |
| `/welcome` | `WelcomePage` | Eager (first run) | MUST |
| `/assistant` | `AssistantPage` | Lazy | MUST |
| `/assistant/:conversationId` | `AssistantPage` | Lazy | MUST |
| `/diagnosis` | `DiagnosisPage` | Lazy | MUST |
| `/diagnosis/:scanId` | `ScanResultPage` | Lazy | MUST |
| `/weather` | `WeatherPage` | Lazy | MUST |
| `/crop-recommendation` | `CropRecommendationPage` | Lazy | MUST |
| `/recommendations` | `RecommendationsPage` | Lazy | MUST |
| `/history` | `HistoryPage` | Lazy | MUST |
| `/settings` | `SettingsPage` | Lazy | MUST |
| `/diseases` | `DiseaseLibraryPage` | Lazy | SHOULD |
| `/diseases/:id` | `DiseaseDetailPage` | Lazy | SHOULD |
| `/fields` | `FieldsPage` | Lazy | SHOULD |
| `*` | `NotFoundPage` | Lazy | SHOULD |

Lazy pages load via `React.lazy` + `Suspense` with a full-page skeleton fallback that mirrors the target layout. Scroll position restores to top on route change; focus moves to the page `h1` (§12).

### 4.6 Reusable layout components

| Component | Responsibility |
| --- | --- |
| `AppShell` | Composes Navbar/Sidebar/BottomNav + `main`; owns safe-area padding |
| `Navbar` | Mobile top bar: brand, notification bell, menu trigger |
| `Sidebar` | Desktop navigation column (primary + secondary + user block) |
| `BottomNav` | Mobile 5-tab bar, driven by `navItems.js` |
| `PageHeader` | `h1` + optional subtitle + action slot (wraps to full-width on mobile) |
| `navItems.js` | Single source of navigation structure |
| `MobileMenuSheet` | Slide-in sheet: all routes grouped + language quick switch (mobile) |
| `NotificationBell` | Bell + unread badge; opens panel (desktop dropdown / mobile bottom sheet) |

---

## 5. Required screens

### 5.0 Screen inventory and priority

| # | Screen | Route | Tier |
| --- | --- | --- | --- |
| 5.1 | Welcome / onboarding | `/welcome` | MUST |
| 5.2 | Dashboard | `/` | MUST (details §8) |
| 5.3 | AI assistant | `/assistant` | MUST (details §6) |
| 5.4 | Disease check (leaf scan) | `/diagnosis` | MUST (details §7) |
| 5.5 | Crop recommendation | `/crop-recommendation` | MUST |
| 5.6 | Weather & farming conditions | `/weather` | MUST |
| 5.7 | Recommendations feed | `/recommendations` | MUST |
| 5.8 | History | `/history` | MUST |
| 5.9 | Settings | `/settings` | MUST |
| 5.10 | Disease & pest library | `/diseases` | SHOULD |
| 5.11 | Notifications (panel, not a page) | — | SHOULD |
| 5.12 | My fields | `/fields` | SHOULD |
| 5.13 | Not found | `*` | SHOULD |

Every screen below uses this template: purpose, user goal, key UI elements, actions, information displayed, and the four operational states (empty / loading / error / responsive). Universal state rules live in §18.

### 5.1 Welcome / onboarding — `/welcome` (MUST)

| Aspect | Requirement |
| --- | --- |
| Purpose | First-run orientation: choose language, set district, learn what the app does — in the user's own language before they commit |
| User goal | Reach the dashboard confidently in under 60 seconds |
| Entry points | Automatic redirect from any route when `agri.onboarded` is not set in local storage; "Replay intro" from Settings |
| Key UI elements | Step 1 — three large language cards (English / اردو / Roman Urdu) with native names and a check mark when selected; Step 2 — three value rows with icons ("Ask anything" — AI assistant, "Scan a leaf" — instant disease check, "Local weather" — daily farming advice) with progress dots; Step 3 — district select (from `lib/districts.js`) and primary button "Start using Agri Copilot". Brand hero with sprout mark at top |
| Actions | Select language (applies instantly, no reload, `dir`/`lang` update live); Next; Back; Select district; Finish |
| Data displayed | Static language list, static district list — no network calls on this screen |
| Empty state | Not applicable (no fetched data) |
| Loading state | Not applicable |
| Error state | Not applicable |
| Responsive behavior | Single column, `max-w-md` centered on desktop; language cards and buttons full-width; steps remain the same on all sizes |
| Persistence | Writes `agri.lang`, `agri.district`, `agri.onboarded` |

Language selection on this screen is the most important trust moment in the product: Urdu MUST render correctly (RTL) immediately upon selection. Future authentication screens, if added, slot in before this flow (Appendix A1).

### 5.2 Dashboard (Home) — `/` (MUST)

Full specification: **§8**. Summary: the farmer's single glance at today — weather with advisory, alerts, quick actions, crops/fields summary, recent AI activity, and top recommendations.

### 5.3 AI Assistant — `/assistant` (MUST)

Full specification: **§6**. Summary: full-screen conversational copilot with suggested questions, follow-ups, multilingual responses, sources and disclaimers, and conversation resume.

### 5.4 Disease check — `/diagnosis` (MUST)

Full specification: **§7**. Summary: camera/gallery upload with preview, guided analysis state, diagnosis result with confidence, treatment steps and disclaimers, plus a list of past scans.

`/diagnosis/:scanId` renders the same `DiagnosisResult` component in read-only mode for a previously saved scan (reached from History); it MUST NOT re-run analysis.

### 5.5 Crop recommendation — `/crop-recommendation` (MUST)

| Aspect | Requirement |
| --- | --- |
| Purpose | Answer "what should I plant?" for this district, season, soil, and water situation |
| User goal | Get a ranked, explainable shortlist of suitable crops |
| Entry points | Home quick action "What to plant"; crop-recommendation link from assistant follow-ups (MAY) |
| Key UI elements | Form card: district (prefilled from settings), season (Auto / Rabi / Kharif), soil type (Loamy / Clay / Sandy / Saline / Not sure), irrigation (Rain-fed / Canal / Tube well), optional notes; primary button "Get suggestions"; results as ranked cards: crop name (localized), fit badge (High/Medium/Low suitability → success/neutral/warning tones), reason bullets ("Matches Rabi season", "Suitable for loamy soil"), sowing window, water need, common diseases (link to library or assistant), CTA "Ask assistant about growing {crop}" |
| Actions | Submit form; change inputs and resubmit; open assistant with prefilled question; open disease library entries |
| Information displayed | Ranked crops with reasons, sowing windows, water needs, disease risks |
| Empty state | Before first search: short guidance panel ("Tell us about your field and we'll suggest the best crops."). After search with zero matches: friendly message plus suggestion to relax inputs (e.g., set soil to "Not sure") |
| Loading state | Three skeleton result cards while `GET /api/crops` is in flight; submit button shows spinner and disables |
| Error state | `ErrorState` with retry; inputs preserved so retry does not lose the form |
| Responsive behavior | Form single column; result cards single column on mobile, 2 columns ≥ `md` |

### 5.6 Weather & farming conditions — `/weather` (MUST)

| Aspect | Requirement |
| --- | --- |
| Purpose | Current conditions, short forecast, and actionable farming advisories for the selected district |
| User goal | Decide today's fieldwork: spray, irrigate, harvest, protect |
| Entry points | Bottom nav / sidebar; Home weather widget |
| Key UI elements | District selector (top); current conditions card: large temperature (Fraunces), condition icon + localized text, feels like, humidity, wind, rain chance; advisory banners (tone-colored: info/sky, warning/sun, danger/rust — e.g., "Avoid spraying today — rain expected within 3 hours"); forecast list rows (day, icon, high/low, rain chance). No charts — lists and stats only, per the design system |
| Actions | Change district; refresh; open assistant ("Ask about this weather") |
| Information displayed | Temperature (°C), humidity (%), wind (km/h), rain chance (%), 5-day forecast, advisories; "Updated HH:MM" timestamp SHOULD be shown |
| Empty state | If forecast is unavailable but current conditions exist: show current + inline notice "Forecast unavailable right now" |
| Loading state | Skeleton current-card + skeleton forecast rows |
| Error state | `ErrorState` with retry; stale previously-loaded data MAY remain visible with a "Couldn't refresh" banner |
| Responsive behavior | Condition stats grid `grid-cols-2` on mobile → `md:grid-cols-4`; forecast rows full width; advisory banners full width |

### 5.7 Recommendations feed — `/recommendations` (MUST)

| Aspect | Requirement |
| --- | --- |
| Purpose | Single list of actionable farming advice (irrigation, spraying windows, fertilizer, alerts) derived from weather + crop context |
| User goal | See what to do next, in priority order |
| Entry points | Home recommendations widget "View all"; notification tap |
| Key UI elements | Filter chips by type (All / Irrigation / Spray / Fertilizer / Alerts — MAY); recommendation cards: type badge, title, one-line summary, date, affected crop chip (when applicable), expand-for-details region, "Ask assistant" link |
| Actions | Expand/collapse details; open assistant with the recommendation as context; filter |
| Information displayed | Title, summary, details, type, date, related crop |
| Empty state | "No recommendations right now — check the weather or ask the assistant" with actions to both |
| Loading state | Skeleton cards |
| Error state | `ErrorState` with retry |
| Responsive behavior | Single column list; details expand inline |

### 5.8 History — `/history` (MUST)

| Aspect | Requirement |
| --- | --- |
| Purpose | Everything the user has already done with the copilot, in one place |
| User goal | Resume a conversation or review a past leaf scan |
| Entry points | Assistant header "History"; Home recent activity; sidebar/mobile menu |
| Key UI elements | Segmented tab control: "Conversations" / "Leaf scans". Conversation rows: first-question preview, message count, relative time; scan rows: 48 px thumbnail, crop, disease name or "Uncertain", confidence badge, date |
| Actions | Open conversation (`/assistant/:conversationId`); open scan (`/diagnosis/:scanId`); delete item with confirm modal (SHOULD); switch tabs |
| Information displayed | Item previews, timestamps, result badges |
| Empty state (per tab) | Conversations: "No conversations yet — ask your first question" with CTA to assistant. Scans: "No leaf scans yet — scan your first leaf" with CTA |
| Loading state | Skeleton list rows |
| Error state | `ErrorState` with retry |
| Responsive behavior | Full-width rows; thumbnails fixed 48 px; actions remain reachable one-handed |

### 5.9 Settings — `/settings` (MUST)

| Aspect | Requirement |
| --- | --- |
| Purpose | Language, location, preferences, and information the user needs to trust the app |
| User goal | Switch language; change district; review disclaimers; clear local data |
| Entry points | Bottom nav / sidebar (primary nav item) |
| Key UI elements | Cards per section: **Language** — three selectable cards (English / اردو / Roman Urdu), applies instantly without reload; **Location** — district select; **Profile** — guest name (optional, local only); **Data** — "Clear local history" with confirm modal; **About** — version, AI advice disclaimer ("Agri Copilot gives AI guidance. For critical decisions, confirm with your local agriculture officer."), data practices summary; "Replay intro" link |
| Actions | Select language; change district; edit name; clear data; replay onboarding |
| Information displayed | Current selections, version, disclaimers |
| Empty / loading / error | All sections are local (no loading states needed); district list is a static constant |
| Responsive behavior | Single column of cards |
| Persistence | `agri.lang`, `agri.district`, profile fields in local storage via `lib/storage.js` |

A "Sign in" entry MUST NOT be rendered until authentication exists (no dead UI — Appendix A1).

### 5.10 Disease & pest library — `/diseases`, `/diseases/:id` (SHOULD)

| Aspect | Requirement |
| --- | --- |
| Purpose | Browse/searchable reference of crop diseases and pests, linked from diagnosis results |
| User goal | Learn about a disease: symptoms, spread, treatment, prevention |
| Entry points | Diagnosis result "Read more"; weather alert links; sidebar/mobile menu |
| Key UI elements | Search input; crop filter chips (Wheat / Cotton / Maize / Rice / …); result cards (localized name, affected crops, severity badge); detail view: description, symptoms list, spread conditions, treatment steps, prevention, optional image, "Ask assistant about this" CTA |
| Actions | Search; filter; open detail; hand off to assistant |
| Information displayed | Localized disease/pest reference content from `GET /api/diseases` |
| Empty state | "No matches for '{query}'" + suggestion to clear filters |
| Loading state | Skeleton cards |
| Error state | `ErrorState` with retry |
| Responsive behavior | Cards 1 column mobile, 2 columns ≥ `md`; detail single column |

### 5.11 Notifications (SHOULD — panel, not a page)

| Aspect | Requirement |
| --- | --- |
| Purpose | Surface time-sensitive items: weather alerts, new recommendations, disease-risk warnings |
| Entry points | Bell icon — in the mobile `Navbar` and in the desktop `Sidebar` brand row |
| Key UI elements | Bell button with unread-count badge; panel (desktop dropdown / mobile bottom sheet, `role="dialog"`); items: type icon, title, body, relative time; "Mark all as read" (MAY) |
| Actions | Open panel; tap item → deep link (alert → `/weather`; recommendation → `/recommendations`); close |
| Data source | `GET /api/notifications` fetched when the panel opens (no polling, no push in MVP) |
| Empty state | "You're all caught up" |
| Loading state | Skeleton rows inside the panel |
| Error state | Inline panel message with retry |
| Responsive behavior | Bottom sheet on mobile (with safe-area padding), anchored dropdown ≥ `lg` |

### 5.12 My fields — `/fields` (SHOULD)

| Aspect | Requirement |
| --- | --- |
| Purpose | Lightweight registry of the farmer's plots to personalize dashboard and AI context |
| User goal | Add/edit fields (name, crop, area, sowing date); see them at a glance |
| Entry points | Home crops widget; sidebar/mobile menu |
| Key UI elements | Field cards (name, crop badge, area in acres/hectares, sowing date); "Add field" form (inline card or modal): name, crop select, area, sowing date (optional) |
| Actions | Add; edit; delete (confirm modal, SHOULD) |
| Information displayed | Field list; count summary |
| Empty state | `EmptyState` — "No fields yet" + "Add your first field" CTA |
| Loading state | Skeleton cards |
| Error state | `ErrorState` with retry |
| Responsive behavior | Cards 1 column mobile, 2 columns ≥ `md` |
| Data source | `GET/POST /api/fields` (§15.12) — fixtures until backend ships |

### 5.13 Not found — `*` (SHOULD)

Full-page `EmptyState` with a friendly message ("This page doesn't exist") and a primary "Go home" action. No navigation chrome change.

---

## 6. AI Assistant UI

The assistant is the product's centerpiece. It must feel like an **agriculture copilot** — grounded in farming context, multilingual, transparent about confidence — not a generic chatbot.

### 6.1 Layout and shell behavior

| Region | Specification |
| --- | --- |
| Header | Sticky bar: conversation title ("Assistant" or the conversation's title), "New chat" button, "History" link, and a small language indicator showing the active language (tap → language quick-switch menu, same options as Settings) |
| Message area | Scrollable list; newest message scrolled into view; scroll-to-bottom FAB when the user has scrolled up (MAY); `max-w-3xl` centered |
| Composer | Docked at the bottom of the chat area: text input (auto-grows to 4 lines max), send button (primary), attach button (camera/gallery icon). Sits above the `BottomNav` on mobile with `env(safe-area-inset-bottom)` respected |
| Mobile keyboard | Composer is pinned via normal document flow (not `position: fixed` hacks); input text is 16 px to prevent iOS zoom; content does not scroll behind the keyboard |

### 6.2 Message bubbles

| Property | User message | Assistant message |
| --- | --- | --- |
| Alignment | End (right in LTR, left in RTL) | Start (left in LTR, right in RTL) |
| Surface | `bg-field-100` tinted bubble | White card with `border border-soil-200`, `rounded-xl` |
| Max width | 85 % of the message column | 85 %; body copy measure ≤ ~65ch |
| Text | Plain text, user line breaks preserved | Plain text with line breaks and simple bullet lists; **never rendered as HTML or markdown** (§16.4) |
| Metadata | Timestamp `text-xs text-soil-500` | Timestamp + optional collapsible "Sources" block |
| Status | `sending` (opacity 60 %) → `sent` → `failed` (rust border + "Couldn't send — tap to retry") | `pending` placeholder bubble → content |

The first assistant message in an empty conversation is a greeting from "Agri Copilot" plus a one-line capability summary, localized.

### 6.3 Typing / loading state

- While awaiting a response, an assistant placeholder bubble with three pulsing dots is appended (the only permitted looping animation besides skeletons/spinner).
- A `role="status"` + `aria-live="polite"` region announces "Agri Copilot is thinking…" once per request (§12).
- The composer stays editable (the user may type the next question) but send is disabled while a request is in flight; a "Stop" button (MAY) aborts via `AbortController`.
- Because responses can take tens of seconds, the pending state SHOULD show staged context ("Checking your question…") rather than a bare spinner.

### 6.4 Suggested questions and quick actions

- **Empty conversation:** 4 suggested-question chips, localized and season-appropriate (backend-driven when available, static localized defaults otherwise), e.g., "What's causing yellow spots on my wheat?", "When should I irrigate cotton this week?" — plus a quick-actions row: "Scan a leaf", "See weather", "What should I plant".
- **After each answer:** follow-up chips rendered under the assistant message from the response's `follow_ups[]` (when provided); tapping a chip sends it as a new user message. If the backend provides none, the chips are omitted (no dead UI).
- Chips wrap and meet the 44 px touch-target height.

### 6.5 Image hand-off in the assistant

- The composer's attach button opens the device camera/gallery picker (same input as §7.1). On selection the assistant asks: "Run a leaf scan with this photo?" → confirm routes to `/diagnosis` with the image preloaded (the conversation stays in history).
- Rationale: diagnosis is a distinct, specialized capability; routing it to the dedicated flow keeps chat text-first, avoids duplicating multimodal chat in the backend, and gives the photo the full diagnosis UI (§7). Direct in-chat image analysis is a documented MAY for later (Appendix A2).

### 6.6 Voice interaction (placeholder architecture)

- Voice input/output is **not** in the MVP. No dead or disabled microphone buttons are rendered.
- Architecture reservation: the composer reserves its trailing slot (after send) for a future mic control; conversation state and the chat service accept text strings only, so a speech-to-text layer can be added in front of the same `POST /api/assistant/chat` call without refactoring. Same for text-to-speech playback of `answer` text.

### 6.7 Multilingual interaction

- Every request carries the active `language` (`en` / `ur` / `ur-Latn`); the backend returns the answer in that language; the frontend displays it verbatim without client-side translation.
- The UI chrome (labels, buttons, empty states) is localized via §13.
- If the user types Urdu in an English UI, no language policing occurs — the request passes through and the backend decides the reply language (typically matching the message). This behavior is documented, not corrected client-side.
- RTL: the entire chat mirrors — bubble alignment, timestamps, send/attach icon placement — via logical CSS utilities (`ms-`, `me-`, `text-start`), not per-case overrides.

### 6.8 Sources, confidence, and disclaimers

- **Sources (MAY):** when a response includes `sources: [{ title, url? }]`, render a collapsible "Sources" disclosure under the message; URLs, if shown, are plain-text links with `rel="noopener noreferrer"`. If absent, render nothing.
- **Per-message confidence:** not shown for general chat (meaningless there); confidence UI is reserved for diagnosis results (§7.4).
- **Disclaimer:** a persistent, subtle one-line notice sits above the composer: "AI guidance — confirm important decisions with your local agriculture officer." It is part of the layout (not a dismissible toast) and is localized.

### 6.9 Conversation history

- Conversations persist server-side keyed by `conversation_id` (§15.4); the History screen (§5.8) lists them and resumes them at `/assistant/:conversationId` by fetching prior messages.
- "New chat" starts a fresh `conversation_id` on the first message.
- Local fallback while the backend conversations endpoint is absent: store the last N conversations locally via `lib/storage.js` behind a labeled adapter (Appendix A5); the hook API stays identical so the swap is invisible to components.
- A conversation that no longer exists (404 on resume) shows an inline "This conversation is no longer available" message with "Start a new chat".

### 6.10 Error behavior

| Case | Frontend behavior |
| --- | --- |
| Send fails (network / 5xx) | User message marked `failed`; inline retry re-sends the same payload; composer remains usable |
| 4xx (e.g., message too long) | Inline error under the failed message with the backend's human-readable message; no retry offered for validation errors |
| Timeout (45 s) | Treated as failure with retry |
| Navigating away mid-request | In-flight request aborted; on return, the last persisted state loads |

---

## 7. Image-based crop / disease diagnosis UI

### 7.1 Entry and capture architecture

- Primary entry: "Scan a leaf" quick action on Home, the Disease check tab, and the assistant image hand-off (§6.5).
- Capture MUST use the native approach with no custom camera UI: `<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment">` — one input offering camera (mobile) and file choice (desktop also supports drag-and-drop onto the dropzone).
- A short photo tip sheet (collapsible, localized): "One leaf fills the frame · natural daylight · avoid blur" — capture quality materially affects diagnosis quality.

### 7.2 Upload, preview, replace

1. **Selection & validation (client-side, before any upload):** JPEG/PNG/WebP only; ≤ 8 MB; must decode. Invalid file → inline `Banner` error with the reason; nothing is uploaded.
2. **Preview:** the image renders in a fixed-aspect frame (object URL), with a crop select (Wheat / Cotton / Maize / Rice / Other — optional, "helps accuracy") and an optional note field (≤ 200 chars).
3. **Remove / replace:** explicit buttons — "Remove" clears state and revokes the object URL; "Replace" opens the picker again.
4. **Analyze:** primary button "Analyze leaf" — disabled until an image exists; the disabled state is visibly inert (§18).

### 7.3 Analysis loading state

- Dedicated multi-stage pending UI (inference can take up to ~90 s): the preview stays visible with an overlay; a step list progresses "Uploading photo… / Analyzing leaf… / Preparing advice…" (labels stage elapsed time cosmetically — they MUST NOT display fake progress percentages or claim backend events).
- A skeleton result card renders below, mirroring the final result layout.
- "Cancel" aborts the request and restores the capture state; the photo remains for retry.

### 7.4 Diagnosis result presentation

Result card (also used read-only at `/diagnosis/:scanId`):

| Element | Specification |
| --- | --- |
| Header | Disease name (localized) + severity badge (Mild → neutral, Moderate → warning, Severe → danger) + scan date |
| Confidence | Badge tiered from the numeric `confidence`: High ≥ 0.80 (success), Medium 0.60–0.79 (warning), Low < 0.60 (danger) — e.g., "High confidence (87 %)" |
| Photo thumbnail | The analyzed image, 4:3, `rounded-lg` |
| Symptoms | Bulleted list ("What you're likely seeing") |
| Treatment | Numbered, imperative steps ("Apply a recommended fungicide within 3 days…") |
| Prevention | Bulleted list for next season |
| Next actions | "Ask assistant about this" (prefills a question mentioning the disease), "Read more" → library detail (when built), "Scan another leaf" |
| Disclaimer | Persistent `Banner` (info tone) directly under the result: "AI estimate — confirm with your local agriculture officer before spraying or applying treatment." |

Special result states:

- **Healthy** (`status: "healthy"`): success-tone result — "No disease detected — your plant looks healthy," with general care tips.
- **Uncertain** (`status: "uncertain"`): neutral result with retake guidance (lighting, focus, single leaf) and a "Try again" primary action; never presented as a diagnosis.
- **Low-confidence diagnosis:** the result renders, but the confidence badge is danger-toned and retake guidance appears above the treatment steps.

### 7.5 Past scans

Below the capture area, "Past scans" lists recent scans (thumbnail, crop, disease or "Uncertain", confidence badge, date) → tap opens `/diagnosis/:scanId`. Empty state: "Your leaf scans will appear here."

### 7.6 Error handling

| Case | Behavior |
| --- | --- |
| Upload/analysis network failure or timeout (90 s) | `ErrorState` with retry; photo and form state preserved so retry needs one tap |
| `image_invalid` / `image_too_large` from backend | Inline banner with the backend message; return to capture state |
| No camera/file API available | Falls back to plain file selection; if even that is unavailable, an explanatory empty state is shown |

---

## 8. Dashboard (Home)

The dashboard answers, in one glance: **"What do I need to know about my farm today, and what can this app do for me?"** Every widget earns its place; anything that does not serve that question is excluded.

### 8.1 Widget inventory (vertical order)

| # | Widget | Tier | Content |
| --- | --- | --- | --- |
| 1 | **Greeting header** | MUST | Time-of-day greeting ("Good morning"), date, district |
| 2 | **Weather now + advisory** | MUST | Compact current-conditions strip (temp, rain chance, humidity, wind as `StatCard`s) + top advisory banner (e.g., "Good conditions for spraying today") → tap opens `/weather` |
| 3 | **Quick actions** | MUST | 2×2 grid of labeled icon buttons: "Ask the assistant" → `/assistant`; "Scan a leaf" → `/diagnosis`; "What to plant" → `/crop-recommendation`; "See weather" → `/weather` |
| 4 | **Active alerts** | SHOULD | Zero or more alert cards (weather warning, disease risk) in tone colors; omitted entirely when empty (no placeholder) |
| 5 | **My fields / crops summary** | SHOULD | Field cards (name, crop badge, area) or `EmptyState` CTA "Add your first field" → `/fields` |
| 6 | **Recent AI activity** | MUST | Two rows: last assistant question + answer preview, and last scan thumbnail + disease badge → tap resumes/opens |
| 7 | **Recommendations** | MUST | Top 2 `RecommendationCard`s + "View all" → `/recommendations` |

### 8.2 Dashboard behavior rules

- **Widgets load and fail independently.** Each widget has its own loading skeleton and its own inline error with retry; one failing widget MUST NOT blank the page or block the others.
- **Loading:** skeleton grid matching the final layout (skeleton stat cards, skeleton rows) — never a full-screen spinner.
- **Empty:** each widget defines its own empty state with a next action (§18.2); the dashboard is never a dead end — quick actions always render.
- **Responsive:** single column on mobile; ≥ `md` the stat grid becomes `md:grid-cols-4`; fields/recommendations may pair into two columns; content column `max-w-6xl`.
- **Data:** a composite `GET /api/dashboard` endpoint is recommended (one request, §15.3); per-widget endpoints are the acceptable alternative.

---

## 9. Responsive design

Mobile-first is mandatory: every layout is authored as a single 360 px column first, then refined with `sm:` (640 px), `md:` (768 px), `lg:` (1024 px) breakpoints. The `lg` breakpoint switches navigation (bottom bar → sidebar).

### 9.1 Breakpoint behavior matrix

| Concern | Mobile (< 768 px) | Tablet (768–1023 px) | Desktop (≥ 1024 px) |
| --- | --- | --- | --- |
| Navigation | `Navbar` + `BottomNav` (5 tabs) | Same as mobile; grids widen | `Sidebar w-64`, no bottom bar |
| Page width | Full width, `p-4` | `p-6`, content widens | `max-w-6xl`, `p-8`, `lg:pl-64` |
| Stat/weather grids | `grid-cols-2` | `grid-cols-3` | `grid-cols-4` |
| Data collections | Stacked cards / rows — never horizontal table scroll | Same + wider rows | Tables MAY render ≥ `md` where defined; cards below |
| Dashboard | Single column | Single column, wider widgets | Two-column arrangements allowed |
| Assistant | Full-height chat; composer above tab bar | Same + wider message column | `max-w-3xl` centered chat |
| Image upload | Camera capture emphasis, large buttons | Same | Drag-and-drop dropzone + file picker |
| Forms | Single column; stacked submit | Short pairs MAY use `sm:grid-cols-2` | Same |

### 9.2 Touch and small-screen rules (MUST)

- Touch targets ≥ 44 × 44 px (`h-11` default controls; bottom-nav items `min-h-[56px]`).
- No horizontal scrolling at 360 px — ever, including chat, tables, and upload previews.
- No hover-only affordances; every hover state has a visible/tappable equivalent.
- Fixed pixel page/container widths are forbidden; responsive and logical units only.
- Safe areas respected: `pb-[env(safe-area-inset-bottom)]` on the bottom bar; chat composer clears it.
- Both orientations remain usable without content loss.
- Inputs use 16 px font size to suppress mobile zoom-on-focus.

---

## 10. Component system

Canonical implementations for `ui/` primitives live in `patterns.md` — extend via props/variants before creating near-duplicates.

### 10.1 UI primitives (`src/components/ui/`)

| Component | Responsibility | Key props / variants |
| --- | --- | --- |
| `Button` | All clickable actions | `variant`: primary / secondary / outline / ghost / danger; `size`: sm / md (44 px) / lg; `fullWidth` |
| `SubmitButton` | Pending-aware submit | `isSubmitting` (keeps width, swaps label for spinner, disables) |
| `TextField` | Single-line input with full field anatomy | `label`, `required`, `hint`, `error` (aria wiring per §12) |
| `SelectField` | Select control, same anatomy | Same + `options` |
| `TextAreaField` | Multiline control, same anatomy | Same + autosize |
| `Card` | Surface container | Optional header (title + action link) and footer; hover only when clickable |
| `Badge` | Status chips | `tone`: success / warning / danger / info / neutral; `dot` for live states |
| `Banner` | Inline feedback | `tone`: success / error / info; `role` switches alert/status |
| `StatCard` | Metric tile | `icon`, `label`, `value`, `unit`, `trend`, `trendTone` |
| `Skeleton` (+ `StatCardSkeleton`, list variants) | Loading placeholders mirroring final layout | `className` |
| `EmptyState` | Friendly dead-end prevention | `icon`, `title`, `description`, `action` |
| `ErrorState` | Human-readable failure + retry | `message`, `onRetry` |
| `Toast` | Transient confirmation (bottom-center mobile / bottom-right desktop, auto-dismiss ~4 s + dismiss control) | Build only when ≥ 2 features need it |
| `Modal` / `BottomSheet` | Confirmations and mobile sheets (SHOULD) | `role="dialog"`, focus trap, Escape/backdrop close |
| `SegmentedControl` | Tab switching (History) | `tabs`, active id |
| `icons/*` | Inline SVGs, one per file | `className` sizing; `aria-hidden` |

### 10.2 Layout components (`src/components/layout/`)

`AppShell`, `Navbar`, `Sidebar`, `BottomNav`, `PageHeader`, `navItems.js`, `MobileMenuSheet`, `NotificationBell` — specified in §4.6.

### 10.3 Feature composites (`src/components/<feature>/`)

| Component | Responsibility |
| --- | --- |
| `assistant/ChatMessage` | One message row (user/assistant), status, sources disclosure |
| `assistant/ChatInput` | Composer: input, send, attach, future voice slot |
| `assistant/TypingIndicator` | Pending assistant bubble with dots |
| `assistant/SuggestedQuestions` | Chips for empty state and follow-ups |
| `diagnosis/ImageDropzone` | Capture/gallery/drag-drop input with validation |
| `diagnosis/ImagePreview` | Preview frame, remove/replace, crop + note fields |
| `diagnosis/AnalysisProgress` | Multi-stage analyzing state |
| `diagnosis/DiagnosisResult` | Result card (§7.4); reused read-only at `/diagnosis/:scanId` |
| `diagnosis/PastScansList` | Recent scan rows |
| `weather/WeatherNow` | Current conditions card |
| `weather/ForecastList` | Forecast rows |
| `weather/AdvisoryBanner` | Tone-mapped advisory |
| `fields/FieldCard`, `fields/FieldsGrid` | Field display |
| `recommendations/RecommendationCard` | Advice card with inline expand |
| `history/HistoryList` | Conversations / scans rows |
| `dashboard/*` | Widget composites assembling the above |

Rules: composites assemble `ui/` primitives; they receive data via props and emit events; they never call services directly (hooks do).

---

## 11. Design system

Canonical source: `.qoder/skills/frontend-design/design-system.md` (values below restate it for self-containment). Brand personality: **grounded, capable, warm** — modern farm operations, not neon eco-green, not indigo SaaS. If a needed value is missing, choose the nearest token; never invent arbitrary values.

### 11.1 Color

Five semantic palettes (Tailwind theme extension per `patterns.md`); never mix `gray-*` into `soil-*` interfaces.

| Palette | Role | Key tokens |
| --- | --- | --- |
| `field` — deep crop green | Primary actions, brand, active nav, success | 600 `#3D7540` (primary bg, AA on white); hover 700 / active 800; tints 50/100; text-on-white 600+; 800 `#2A4B2E` on tints |
| `soil` — warm neutrals | Structure, text, borders, backgrounds | Page bg 50 `#FAF9F7`; card white + border 200 `#E2DED5`; body text 700 `#585045` (7.8:1); headings 900; secondary 500/600 |
| `sun` — warm amber | Warnings, attention (sparingly) | Text 700 `#A25D1A`; bg 50/100 with 800 text; chart highlight 400/500 |
| `sky` — information | Info | Banners 50 with 800 text; info text 700+ |
| `rust` — earthy red | Errors and destructive only | Button 600 `#AB3B2D`; error text 700; banner 50 + 800 text |

Rules: one primary color per screen (green); status = background-tint + dark text of the same family (`bg-sun-100 text-sun-800`); no gradients; no dark mode in MVP; tokens are centralized so a dark theme can be added later without component rewrites.

### 11.2 Typography

Fonts: **Fraunces** (display — `h1`/`h2`, big stats; 600–700, `tracking-tight`) + **Inter** (body/UI; 400–700), loaded via `<link>` with `display=swap`; preconnect both Google Fonts hosts.

| Element | Style |
| --- | --- |
| Page title `h1` | `font-display text-2xl md:text-3xl font-semibold tracking-tight text-soil-900` |
| Section title `h2` | `font-display text-lg md:text-xl font-semibold tracking-tight text-soil-900` |
| Card title | `text-base font-semibold text-soil-900` |
| Body | `text-base text-soil-700 leading-relaxed` (16 px floor) |
| Dense UI / metadata | `text-sm text-soil-600` |
| Hints, captions, timestamps | `text-xs text-soil-500` — 12 px absolute floor (outdoor/older audience) |
| Buttons | `text-sm font-medium` |

Sentence case everywhere; one `h1` per page; stat numbers use `font-display`; never center long body text.

### 11.3 Spacing, radius, elevation

- **Spacing:** 4 px scale only. Page `p-4 md:p-6 lg:p-8`; card `p-4 md:p-5`; grid gaps `gap-4 md:gap-6`.
- **Radius:** `rounded-sm` 6 px (table badges) · `rounded` 8 px · `rounded-md` 10 px (buttons, inputs) · `rounded-lg` 14 px (media, icon tiles) · `rounded-xl` 20 px (cards, modals) · `rounded-full` (badges, avatars).
- **Shadows:** token-only — `shadow-card` (resting), `shadow-raised` (hover/overlay). No other shadows, no colored glows.

### 11.4 Iconography

Inline-SVG components in `src/components/ui/icons/`: 24×24 viewBox, `stroke-width="1.5"`, round caps/joins, `currentColor`, default `w-5 h-5`, `aria-hidden="true"`. Core set (create as needed): `sprout, leaf, droplet, thermometer, sun, cloud-rain, bug, camera, search, bell, user, settings, logout, menu, x, chevron-right, chevron-down, arrow-up, arrow-down, check-circle, alert-triangle, info, map-pin, calendar, chart, spinner`, plus `chat` (added by this spec). Never emoji as functional UI icons; emoji only inside user-authored content.

### 11.5 Buttons, forms, cards, status

- **Button:** variants primary / secondary / outline / ghost / danger; sizes sm `h-9`, md `h-11` (default), lg `h-12`; `rounded-md font-medium transition-colors duration-150`; focus-visible ring 2 `field-600` (`rust-600` for danger); disabled `opacity-60 cursor-not-allowed`; verb-first labels ("Scan leaf", "Add field").
- **Form field anatomy:** visible `<label>` (`text-sm font-medium soil-800`) → control (`h-11 rounded-md border soil-300 bg-white px-3 text-base`; focus `border-field-600 ring-2 ring-field-600/20`) → hint (`text-xs soil-500`) → error (`text-xs rust-700` + icon, `aria-describedby` wired, `aria-invalid` set; invalid swaps field→rust; disabled `bg-soil-100`). Required fields show `*` + `sr-only "(required)"`. Forms single-column on mobile.
- **Card:** `bg-white border border-soil-200 rounded-xl shadow-card p-4 md:p-5`; clickable cards get `hover:border-field-300 hover:shadow-raised` + focus semantics (treated as buttons/links).
- **Status indicators:** `Badge` tones (§10.1); tinted background + dark text of the same family; "live" states add a small dot; status is never conveyed by color alone — always paired with text.

### 11.6 Motion and copy tone

- Motion: 150 ms (hovers) / 200 ms (default fades) / 250 ms (drawers, panels); color/opacity/transform only; state feedback via color/border/shadow, never scale/movement; the only looping animations are skeletons and spinners; honor `prefers-reduced-motion` globally.
- Copy: sentence case; verb-first buttons; plain farm language ("Leaf disease check", not "Phytopathology inference"); units with values (`24 mm`, `18°C`, `6.4 pH`); dates as "12 Mar 2026"; never lorem ipsum — draft realistic copy when unknown.

---

## 12. Accessibility

Target: **WCAG 2.1 AA** across the entire application. Accessibility is a MUST-tier requirement, not a polish pass.

### 12.1 Contrast and readability

- Body text `soil-700` (7.8:1 on white) or darker; headings `soil-900`; secondary text `soil-500`/`soil-600` only at `text-sm`+.
- Warning text uses `sun-700` or darker — never `sun-500`/`sun-600` on white (fails AA).
- Status is never conveyed by color alone — every badge, alert, and trend also carries text (§11.5).
- Body text 16 px; absolute floor 12 px for captions only.

### 12.2 Keyboard navigation

- Every interactive element is reachable and operable by keyboard; logical tab order matches visual/RTL order.
- Visible focus on all interactive elements: `focus-visible:ring-2 ring-offset-2` (`field-600`; `rust-600` for danger). Outlines are never removed without an equivalent.
- `Modal`/`BottomSheet`: focus trapped while open, Escape and backdrop close, focus returns to trigger.
- Chat: Enter sends, Shift+Enter inserts a newline; the message list is not a tab trap.
- A skip link ("Skip to main content") SHOULD be the first focusable element, targeting `#main`.

### 12.3 Semantic HTML

- Landmarks per page: `nav` (bottom bar/sidebar), one `main`, `aside` where present; exactly one `h1` per page with logical heading nesting.
- Buttons are `<button>`, links are `<a href>`; icon-only controls carry `aria-label`.
- Route changes move focus to the new page's `h1` and update `document.title` (localized).

### 12.4 Accessible forms

- Every input has a visible `<label>`; hints and errors linked via `aria-describedby`; `aria-invalid` on errors; required fields marked with `*` plus `sr-only "(required)"` (§11.5).
- Validation errors are announced (`role="alert"`) and written in plain, actionable language.

### 12.5 Dynamic content and live regions

- Async results announced through `role="status"` / `aria-live="polite"` regions: assistant responses, diagnosis completion, weather refresh.
- Errors surfaced via `role="alert"`.
- Skeletons are `aria-hidden`; loading never silently blocks.

### 12.6 Screen-reader considerations

- Decorative icons are `aria-hidden`; meaningful images have `alt` text (diagnosis photos: crop + note, else "Leaf photo for analysis").
- The notification badge is announced as part of the bell's accessible name ("Notifications, 3 unread").
- Relative times ("2 hours ago") expose the full timestamp in the accessible name.
- `<html lang>` always matches the active locale; embedded AI content in another language is wrapped with an appropriate `lang` attribute when it differs.

### 12.7 Touch, motion, and zoom

- Touch targets ≥ 44 px with adequate spacing to prevent mis-taps.
- `prefers-reduced-motion: reduce` disables all transitions/animations (global CSS).
- 200 % browser zoom loses no content or functionality (rem-based sizing throughout).

---

## 13. Internationalization

The app ships trilingual for Pakistani users. Internationalization is an architectural MUST from day one — retrofitting is a rewrite.

### 13.1 Locales

| Code | Language | Script / direction | Tier |
| --- | --- | --- | --- |
| `en` | English | Latin, LTR | MUST (default) |
| `ur` | Urdu | Arabic/Nastaliq, **RTL** | MUST |
| `ur-Latn` | Roman Urdu | Latin, LTR | MUST |

### 13.2 Translation architecture

- `src/i18n/` contains an `I18nProvider` (React Context) + `useT()` hook, and `locales/en.js`, `ur.js`, `ur-Latn.js` — flat, namespaced key→string maps (`nav.*`, `assistant.*`, `diagnosis.*`, `weather.*`, `recommendations.*`, `history.*`, `settings.*`, `common.*`).
- **No component hard-codes user-facing strings.** All copy resolves through `t('namespace.key')`. Exceptions: user-generated content and the brand name "Agri Copilot".
- Interpolation is simple `{name}` placeholder replacement implemented in `lib/` — no i18n dependency.
- Keys are stable identifiers authored against the English reference copy; adding a locale never touches components.

### 13.3 Text direction (RTL)

- On language change the provider sets `document.documentElement.lang` and `.dir` (`ur` → `rtl`; `en`/`ur-Latn` → `ltr`); switching applies instantly without a page reload.
- Layouts use logical CSS utilities only — `ms-`/`me-`/`ps-`/`pe-`/`text-start`/`start-`/`end-` — so mirroring is automatic; physical `left`/`right` utilities are reserved for genuinely non-mirroring elements.
- Directional icons (chevrons, send, arrows) flip in RTL; symmetric icons do not.
- No per-locale stylesheets; one layout, two directions.

### 13.4 Language switching

- Switch points: Welcome screen, Settings, assistant header quick-switch, mobile menu.
- Persisted as `agri.lang` via `lib/storage.js`; restored on load before first paint of the app area.
- The active language accompanies every content request (§15.2).
- Switching language preserves in-progress UI state (chat draft, form inputs) — only strings re-resolve.

### 13.5 Dynamic and AI-generated content

- Localized display text (disease names, weather conditions, recommendations) comes from the API per the requested `lang`, with fallback chain: requested locale → English. The frontend does not translate API content client-side.
- AI answers arrive in the selected language (or the language of the user's message) and render verbatim.
- Dates and numbers format through `lib/formatters` ("12 Mar 2026" style; Western digits per Appendix A9).

### 13.6 Fonts for Urdu (decision required)

- Inter/Fraunces do not cover the Urdu script. When `ur` ships, **Noto Nastaliq Urdu** (fallback: Noto Naskh Arabic) MUST be added as a single additional webfont — this is the one documented exception to the one-webfont-pair rule and requires approval (Appendix A4).
- Urdu requires generous line-height; chat bubbles and result cards MUST be verified at 360 px in RTL.
- The system font fallback stack MUST render Urdu legibly before the webfont loads.

### 13.7 Content rules

- Sentence case in every locale; translations use plain farm language and SHOULD be reviewed by a native Urdu speaker before release.
- One language per screen — never mix scripts within UI chrome.

---

## 14. Frontend state management

### 14.1 Approach

No external state library (dependency policy, §4.1). State is managed with React built-ins:

- **React Context** for app-wide cross-cutting state (language/direction, onboarding/district).
- **Local `useState` / `useReducer`** for screen and form state.
- **Custom hooks** (`useApi`, `useConversation`, `useDiagnosis`, `useWeather`, …) encapsulating server data and async status per feature.
- **`lib/` pure reducers/functions** for portable business logic (conversation reducer, validation, formatters) with no React or DOM imports (§19 seam).

### 14.2 State inventory

| State | Scope | Persistence | Owner |
| --- | --- | --- | --- |
| Language + direction | App-wide | `agri.lang` (localStorage) | `I18nProvider` (Context) |
| Onboarded flag, district | App-wide | `agri.onboarded`, `agri.district` | App settings context |
| Server data (dashboard, weather, crops, diseases, recommendations, notifications) | Per screen | Memory only; weather MAY cache 10 min | Feature hooks via `useApi` |
| Conversation (messages, status, `conversationId`) | Assistant + resume | Server via adapter; local fallback (Appendix A5) | `useConversation` (reducer from `lib/`) |
| Diagnosis flow (file, object URL, crop, note, result) | Diagnosis screen | Memory | `useDiagnosis` |
| Uploaded image | Component | Object URL, revoked on unmount/replace | `ImagePreview` |
| Forms (crop recommendation, add field) | Form | Memory | Local `useState` |
| Ephemeral UI (menus, modals, active tab, chat draft) | Local | Memory | Local `useState` |
| Request errors | Per request | Memory | `useApi` / local |
| Toasts (when built) | App-wide | Memory | Toast provider (MAY) |

### 14.3 Conversation state shape

```text
{
  conversationId: string | null,
  messages: [
    { id, role: 'user' | 'assistant', content,
      status: 'sending' | 'sent' | 'failed',
      createdAt, sources?, followUps? }
  ],
  sendStatus: 'idle' | 'pending'
}
```

Actions: `send`, `sent`, `failed`, `load` (resume), `reset` (new chat). The reducer lives in `lib/` as a pure function so it is unit-testable and portable.

### 14.4 Rules

- No prop drilling beyond two levels — lift shared state into context.
- Server data is not duplicated into context; each view fetches what it needs; the only client cache is the 10-minute weather cache (MAY).
- Local storage is only accessed through `lib/storage.js` (single seam, namespaced `agri.*` keys, mobile-swappable).
- All state updates are immutable; all effects clean up (abort requests, revoke object URLs).
- `useApi` exposes `{ data, status: 'loading' | 'success' | 'error', retry }` and takes a stable fetcher reference.

---

## 15. API integration contract

The backend does not exist beyond `GET /api/health`. This section defines the contract the frontend needs — implementation-ready but technology-agnostic in style. The backend team (or a later task) implements against it.

### 15.1 Principles

- All HTTP goes through the existing `request()` wrapper in `src/services/api.js` (base URL from `VITE_API_BASE_URL`, default `/api`). The wrapper MUST evolve to support: `FormData` bodies (no JSON content-type override), `AbortSignal`, request timeouts, and future auth-header injection — one place, all calls.
- The frontend never calls third-party APIs (weather, AI) directly; everything comes from the backend.
- JSON for data; `multipart/form-data` for image upload.
- Timestamps are ISO 8601 UTC; the frontend renders them localized.

### 15.2 Global conventions

- **Language:** every content-bearing endpoint accepts `lang` (`en` | `ur` | `ur-Latn`) as a query parameter (GET) or body field (POST); localized text fields are suffixed `_localized` or provided via a `localized_name` companion.
- **Error envelope (MUST):** every 4xx/5xx returns JSON:

```json
{ "error": { "code": "image_too_large", "message": "Image is larger than 8 MB." } }
```

- **Error codes:** `validation_error`, `image_invalid`, `image_too_large`, `ai_unavailable`, `rate_limited`, `not_found`, `unauthorized` (future), `internal_error`. The frontend maps known codes to localized messages; unknown codes fall back to a generic message.
- **Timeouts:** health 5 s · weather 10 s · conversations 10 s · dashboard 15 s · chat 45 s · diagnosis 90 s · other 15 s.
- **Retries:** idempotent GETs auto-retry once on network error/5xx; POSTs retry only on explicit user action. All requests are cancellable (`AbortController`) and cancelled on unmount/route change.

### 15.3 Dashboard — `GET /api/dashboard?lang=` (MUST)

```json
{
  "district": "Vehari",
  "weather": { "current": { … }, "advisories": [ … ] },
  "alerts": [ { "type": "weather", "tone": "warning", "text_localized": "Heavy rain expected tonight." } ],
  "fields": [ { "id": 1, "name": "North wheat plot", "crop": "Wheat", "area_ha": 4.2 } ],
  "recent_activity": { "last_conversation": { … }, "last_scan": { … } },
  "recommendations": [ … ]
}
```

Sub-objects may be absent; each widget degrades independently (§8.2). Loading: per-widget skeletons. Error: per-widget retry. Empty: per-widget empty states.

### 15.4 Assistant chat — `POST /api/assistant/chat` (MUST)

Request: `{ "conversation_id": "c-123" | null, "message": "string ≤ 2000 chars", "language": "en | ur | ur-Latn" }`

Response:

```json
{
  "conversation_id": "c-123",
  "message_id": "m-456",
  "answer": "Plain-text answer with simple line breaks…",
  "follow_ups": ["How do I treat leaf rust?"],
  "sources": [ { "title": "Punjab Agriculture Department — leaf rust guide", "url": "https://…" } ],
  "created_at": "2026-09-03T10:12:00Z"
}
```

Behavior: optimistic user bubble → pending assistant bubble → content, or `failed` message with retry (§6.10). `rate_limited`/`ai_unavailable` show the backend message inline.

### 15.5 Conversations — `GET /api/assistant/conversations?lang=`, `GET /api/assistant/conversations/{id}?lang=` (MUST)

List: `[{ "id", "title", "updated_at", "preview" }]` · Detail: `{ "id", "title", "created_at", "messages": [ { "id", "role", "content", "created_at" } ] }` · 404 → "conversation no longer available" state.

### 15.6 Diagnosis — `POST /api/diagnosis/analyze` (multipart, MUST)

Form fields: `image` (required), `crop?` (optional), `notes?` (≤ 200 chars), `language`.

Response:

```json
{
  "id": "d-789",
  "status": "diagnosed",
  "disease": { "id": "leaf-rust", "name": "Wheat leaf rust", "localized_name": "…" },
  "confidence": 0.87,
  "severity": "mild | moderate | severe",
  "symptoms": [ "…" ],
  "treatment_steps": [ "…" ],
  "prevention": [ "…" ],
  "image_url": "/media/scans/d-789.jpg",
  "created_at": "2026-09-03T09:40:00Z"
}
```

`status` ∈ `diagnosed` | `healthy` | `uncertain`; `healthy`/`uncertain` omit disease/confidence/treatment. History: `GET /api/diagnosis/scans` (list) and `GET /api/diagnosis/scans/{id}`. Loading: multi-stage progress (§7.3), cancellable, 90 s timeout; errors per §7.6.

### 15.7 Weather — `GET /api/weather?district=&lang=` (MUST)

```json
{
  "district": "Vehari",
  "current": {
    "temperature_c": 31, "feels_like_c": 33, "humidity_pct": 54,
    "wind_kph": 12, "rain_chance_pct": 10,
    "condition": "partly_cloudy", "condition_localized": "…"
  },
  "forecast": [
    { "date": "2026-09-04", "temp_high_c": 33, "temp_low_c": 22,
      "rain_chance_pct": 15, "condition": "sunny" }
  ],
  "advisories": [
    { "type": "spray", "tone": "warning", "text_localized": "Avoid spraying — rain expected within 3 hours." }
  ],
  "updated_at": "2026-09-03T08:00:00Z"
}
```

`condition` enum (frontend maps to icons): `sunny | partly_cloudy | cloudy | rain | thunderstorm | fog | wind`. In-memory 10-minute cache (MAY, stale-while-refresh).

### 15.8 Crop recommendation — `GET /api/crops?district=&season=&soil=&irrigation=&lang=` (MUST)

```json
{ "recommendations": [
  { "crop": "wheat", "localized_name": "…", "fit": "high",
    "reasons": [ "Matches Rabi season", "Suitable for loamy soil" ],
    "sowing_window": "1 Nov – 15 Dec", "water_need": "medium",
    "common_diseases": [ { "id": "leaf-rust", "name": "Wheat leaf rust", "localized_name": "…" } ] }
] }
```

`fit` ∈ `high | medium | low`. Empty result array → the "no matches" empty state (§5.5).

### 15.9 Disease library — `GET /api/diseases?crop=&q=&lang=`, `GET /api/diseases/{id}?lang=` (SHOULD)

Item: `{ "id", "name", "localized_name", "crops": ["wheat"], "severity": "mild | moderate | severe", "symptoms": [], "treatment_steps": [], "prevention": [], "image_url?" }`.

### 15.10 Recommendations — `GET /api/recommendations?lang=` (MUST)

`{ "items": [ { "id", "type": "irrigation | spray | fertilizer | alert | general", "title_localized", "summary_localized", "details_localized", "date", "crop?" } ] }`

### 15.11 Notifications — `GET /api/notifications?lang=` (SHOULD)

`{ "items": [ { "id", "type", "title_localized", "body_localized", "created_at", "read": false, "deep_link": "/weather" } ] }` — fetched when the panel opens; no polling.

### 15.12 Fields — `GET /api/fields`, `POST /api/fields` (SHOULD)

GET: `[{ "id", "name", "crop", "area_ha", "sowing_date?" }]` · POST body `{ "name", "crop", "area_ha", "sowing_date?" }` → `201` with the created object.

### 15.13 Fixture policy while endpoints are missing

- Every feature hook carries a `USE_FIXTURE` flag and clearly labeled fixtures shaped **exactly** like the contract above (real districts, plausible diseases); switching to the real endpoint is a one-line change.
- Fixtures live in hooks, never in presentational components, and are never presented as live data.
- The existing health check (`fetchHealth`) remains the connectivity probe for the dev status indicator only.

---

## 16. Security considerations

### 16.1 Secrets

- No API keys or secrets in frontend code, env files, or the bundle. `VITE_*` variables are public by definition — the only such variable is the API base URL. All AI/weather provider keys stay server-side.

### 16.2 Authentication readiness (future)

- The MVP runs in guest mode (no login UI — Appendix A1). `request()` is the single injection point for an `Authorization` header when auth arrives.
- When authentication is added: prefer httpOnly cookies over tokens in `localStorage`; if tokens are unavoidable, keep them in memory only; never hard-code credentials.

### 16.3 Input validation

- Client-side validation before any request: message ≤ 2000 chars, notes ≤ 200 chars, image type/size per §7.2. Server-side validation remains authoritative — the frontend displays backend `error.message` verbatim after localization mapping.

### 16.4 Safe rendering of AI-generated content

- AI and user text render as React text nodes only — **never** `dangerouslySetInnerHTML`, never markdown-to-HTML conversion. React's escaping is the XSS boundary (§6.2).
- Source URLs render as plain-text links with `rel="noopener noreferrer"` when opened externally.
- URL/query parameters are never rendered as HTML.

### 16.5 File uploads

- Type and size validated client-side before upload (§7.2); object URLs are revoked after use; no photos are persisted locally beyond the session.
- The backend MUST strip EXIF/GPS metadata on receipt (Appendix A10 — frontend displays the object URL only, never re-embeds location).

### 16.6 Sensitive data

- Minimal PII: optional guest name, district preference. Local storage holds preferences and (fallback) history only — never credentials or contact data. Settings offers "Clear local history".

### 16.7 Transport and dependencies

- HTTPS-only in production; CORS restricted server-side (already configured in the backend).
- `package-lock.json` committed; dependency policy §4.1 enforced; no inline scripts in `index.html` beyond the module entry.

---

## 17. Performance

### 17.1 Budgets (MUST, measured on a mid-range Android profile)

| Metric | Target |
| --- | --- |
| Initial route JS (gzipped) | ≤ 250 KB |
| Total app JS (gzipped, all routes) | ≤ 400 KB |
| LCP (dashboard) | < 2.5 s on throttled Fast 3G |
| CLS | < 0.1 (skeletons mirror layout; images reserve aspect-ratio boxes) |
| Interaction feedback (tap → visual state change) | < 100 ms |
| Lighthouse (mobile) | Performance ≥ 85 · Accessibility ≥ 90 |

### 17.2 Techniques

- **Code splitting:** route-level `React.lazy` + `Suspense` (§4.5); dashboard eager.
- **Fonts:** preconnect + `display=swap`; text is never invisible while fonts load.
- **Images:** object URLs for previews; client-side downscale to ≤ 1600 px longest edge before upload (SHOULD — saves rural bandwidth); `revokeObjectURL` on replace/unmount.
- **Rendering:** memoize chat message rows; stable (`useCallback`) fetchers so `useApi` does not re-run; avoid new object/array props in the chat hot path.
- **API efficiency:** single composite dashboard request (§15.3); 10-minute weather cache (MAY); abort in-flight requests on navigation.
- **Skeleton-first loading** for perceived speed; no blocking spinners.
- **No** chart libraries, animation libraries, or heavy utilities — the constraint is also the performance strategy.

---

## 18. Error / empty / loading states

### 18.1 Universal five-state rule

Every data view implements all five states (per the project skill):

| State | Rule |
| --- | --- |
| **Loading** | Skeletons mirroring the final layout for content areas; small spinner only inside buttons; never a blank screen |
| **Empty** | Friendly one-line explanation of why it's empty + one action that fills it |
| **Error** | Human-readable message (never raw codes/stacks) + retry action; tone is never blame ("Couldn't load your weather. Check your connection and try again.") |
| **Success** | Visible confirmation (inline `Banner` or toast), never a silent pass |
| **Disabled** | Buttons/forms visibly inert (`opacity`, `cursor-not-allowed`) while pending — never dead-looking active controls |

### 18.2 Empty-state content rules

Every empty state names the next action and routes there: "No conversations yet — ask your first question" → button to assistant. Dashboard widgets define their own empty states (§8.2); alerts that are empty are omitted entirely.

### 18.3 Retry matrix

| Situation | Behavior |
| --- | --- |
| GET (weather, dashboard, lists) network error / 5xx | One silent auto-retry, then `ErrorState` with manual retry |
| POST (chat, diagnosis, fields) failure | Manual retry only; input/photo state preserved |
| Validation 4xx | Inline message; no retry offered — fix the input |
| Timeout | Same as failure, with "This is taking longer than expected" copy for diagnosis |

### 18.4 Degraded connectivity

- Error copy assumes flaky rural networks and never blames the user.
- A subtle offline notice (MAY, via `navigator.onLine`) may appear in the shell; queued work is not attempted while offline.

### 18.5 Per-feature summary

| Feature | Loading | Empty | Error |
| --- | --- | --- |
| Dashboard | Per-widget skeletons | Per-widget CTA | Per-widget retry |
| Assistant | Typing indicator + disabled send | Suggested questions | Failed message + inline retry |
| Diagnosis | Staged progress + skeleton result | "Your leaf scans will appear here" | Retry keeps photo |
| Weather | Skeleton card + rows | Current-only notice | Retry; stale data MAY stay with banner |
| Crop recommendation | 3 skeleton cards | Pre-search guidance / no-match | Retry; form preserved |
| History | Skeleton rows | Per-tab CTA | Retry |
| Library / fields / notifications | Skeleton cards / rows | Search / add-field / all-caught-up states | Retry |

---

## 19. Mobile app future compatibility

The web frontend MUST be architected so the product can later ship as a mobile app without a major rewrite. Building that app is explicitly **not** in scope now — this section is rules, not features.

### 19.1 Architecture principles

1. **Business logic is portable by construction.** All validation, formatting, state reducers, and domain helpers live in `lib/` as pure modules with no DOM, `window`, or React imports.
2. **UI and data logic are separated.** Presentational components take props and emit events; all HTTP lives in `services/api.js`; hooks are the glue. A React Native screen reuses the same hooks/services unchanged (only `fetch`'s transport differs).
3. **Storage is behind an adapter.** `lib/storage.js` is the only module touching `localStorage` — a native module swap replaces one file.
4. **Validation is shared, not duplicated.** Form rules (message length, image constraints) live in `lib/` and run identically on any platform.
5. **Responsive component design maps to native primitives.** Full-screen stacked layouts, cards, tab bars, sheets — not desktop-only multi-column tricks, hover-dependent menus, or drag-and-drop-only affordances.
6. **Clear API boundaries.** The backend contract (§15) is platform-neutral JSON; no web-specific headers/cookies are required for core flows.
7. **Web APIs are quarantined.** `window`, `document`, `localStorage`, and `navigator` are referenced only in `lib/` adapters, the `main.jsx` entry, and the shell — never inside feature hooks or components.

### 19.2 Web → native mapping (for the future team)

| Web pattern today | React Native equivalent later |
| --- | --- |
| `BottomNav` (5 tabs) + `AppShell` | Tab navigator + screen container |
| `Sidebar` | Drawer navigator |
| Cards / stacked layouts (`flex` column) | `View` stacks — 1:1 mapping |
| `Modal` / `BottomSheet` | Native modals / action sheets |
| `services/api.js` `request()` | Same module, same contract, native transport |
| `i18n` dictionaries + `I18nProvider` | Same dictionaries, same hook signature |
| `lib/` reducers and validators | Imported unchanged |
| Tailwind token classes | Design tokens exported as shared constants (color/spacing/typography values already centralized in the Tailwind theme) |

### 19.3 Anti-patterns that block conversion (MUST NOT)

- CSS-only interactions with no accessible/tappable equivalent (hover menus, drag-only upload).
- Logic embedded in page components instead of hooks/`lib/`.
- Browser API calls scattered through feature code.
- Fixed desktop-width layouts or pixel-positioned chrome.

---

## 20. Frontend user flows

### F1. New user → Dashboard (MUST)

1. App loads with no `agri.onboarded` → redirect to `/welcome`.
2. User selects a language (applies instantly, `dir` updates for Urdu).
3. Value screen shows the three capabilities; user taps Next.
4. User selects a district and taps "Start using Agri Copilot".
5. Dashboard renders; widgets load skeletons → content; `agri.lang`, `agri.district`, `agri.onboarded` persisted.

### F2. Dashboard → Assistant → Ask → Answer (MUST)

1. From Home, tap the Assistant tab or the "Ask the assistant" quick action.
2. Empty state shows greeting, 4 suggested questions, quick actions.
3. User types a question (or taps a suggestion) and taps Send.
4. The user message appears immediately; a typing indicator shows while the answer is generated.
5. The answer renders with follow-up chips; disclaimer is visible; sources (if any) are collapsed below.
6. User taps a follow-up chip — conversation continues.
7. Leaving and returning via History resumes the conversation with full context.

### F3. Dashboard → Disease check → Upload → Result (MUST)

1. From Home, tap "Scan a leaf" → `/diagnosis`.
2. User captures a photo (camera input) or picks a file; invalid files are rejected inline.
3. Preview shows; user optionally selects crop and adds a note; taps "Analyze leaf".
4. Staged progress ("Uploading photo… / Analyzing leaf… / Preparing advice…") with cancel available.
5. Result card renders: disease, confidence badge, severity, symptoms, numbered treatment, prevention, disclaimer.
6. Next actions: "Ask assistant about this" (prefilled question), "Read more" (library, when built), "Scan another leaf".
7. The scan appears in Past scans and History.

### F4. Dashboard → Recommendations → View recommendation (MUST)

1. From Home, scroll to Recommendations; tap a card's details or "View all" → `/recommendations`.
2. Feed lists cards by type and date.
3. User expands a card for details; optionally taps "Ask assistant" with the recommendation as context.

### F5. User → History → Previous interaction (MUST)

1. Open History (assistant header, Home recent activity, or menu).
2. Switch between Conversations and Leaf scans tabs.
3. Tap a conversation → `/assistant/:id` resumes it; tap a scan → `/diagnosis/:id` shows the saved result read-only.
4. Delete (SHOULD) with a confirmation modal.

### F6. User → Settings → Change language/preferences (MUST)

1. Open Settings (nav item).
2. Tap a language card — the entire UI switches instantly, including RTL for Urdu.
3. Change district — weather and recommendations re-target the new district on next load.
4. Optional: clear local history with confirmation; replay onboarding.

### F7. Notification → Deep link (SHOULD)

1. Bell shows an unread badge.
2. User opens the panel (bottom sheet mobile / dropdown desktop).
3. User taps an item → routed to the deep link (`/weather`, `/recommendations`, …).

---

## 21. Frontend non-functional requirements

| Category | Requirement | Measure / target |
| --- | --- | --- |
| Responsiveness | All screens usable 360–1920 px, both orientations | Verified at 360 / 768 / 1280; zero horizontal scroll |
| Accessibility | WCAG 2.1 AA; full keyboard operation; visible focus | Lighthouse a11y ≥ 90; manual keyboard pass; contrast spot-checks (§12) |
| Usability | Core task ≤ 3 taps from Home; one-handed operation; first run ≤ 60 s | Flow walkthroughs (§20) timed on a 360 px device |
| Performance | Budgets per §17.1 | Bundle audit + Lighthouse mobile |
| Maintainability | Folder conventions (§4.2); pure `ui/`; single HTTP boundary; token-only styling; no hard-coded strings; components ≤ ~200 lines | Code review checklist (§22) |
| Scalability | New locale or feature without touching core layout; independent dashboard widgets; `/api` versioned boundary | Adding a test locale requires only a dictionary file |
| Browser compatibility | Last 2 stable Chrome, Edge, Firefox, Safari (desktop); iOS Safari 15+; Android Chrome 100+ / WebView 100+ (future app shell baseline) | Manual matrix pass on Must screens |
| Connectivity tolerance | Usable on 3G-class networks | Compressed uploads; graceful timeouts/retries (§18) |

---

## 22. Acceptance criteria

A frontend implementation is **accepted** when every MUST item below is demonstrably true. Each criterion is verifiable by a reviewer or coding agent without additional context.

### A. Tooling and structure

- [ ] Only `react-router-dom` was added to dependencies; no other new packages.
- [ ] Directory structure matches §4.2; pages compose components; `ui/` components are purely presentational.
- [ ] No `fetch`/XHR outside `src/services/api.js`.
- [ ] All colors/spacing/radius/shadows come from design tokens — no arbitrary values, no inline `style` props.
- [ ] No user-facing string is hard-coded (all via `t()`; spot-check five components).

### B. Shell and navigation

- [ ] `AppShell` renders `Navbar` + `BottomNav` below 1024 px and `Sidebar` at ≥ 1024 px; exactly 5 primary tabs (§4.3).
- [ ] Every route in §4.5 renders, is reachable from the documented entry points, and has one `h1` in a `PageHeader`.
- [ ] Active navigation shows `aria-current="page"` and the active visual treatment.

### C. Screens and states

- [ ] Every MUST-tier screen in §5 exists with its specified purpose, elements, and actions.
- [ ] Every data view implements loading (skeleton), empty (with action), error (human message + retry), success, and disabled states (§18.1).
- [ ] Dashboard widgets load and fail independently.

### D. AI assistant

- [ ] Bubbles, typing indicator, suggested questions, follow-up chips, and the persistent disclaimer render per §6.
- [ ] A failed send shows a retryable failed message; a timeout is handled as failure.
- [ ] Image attach offers the hand-off to Disease check with the photo preloaded.
- [ ] History lists and resumes conversations (`/assistant/:id`), including the 404 state.

### E. Diagnosis

- [ ] Capture (camera/gallery), client-side validation, preview, remove/replace all work per §7.
- [ ] Analysis shows the staged progress state and can be cancelled.
- [ ] Results render confidence tiers, severity, treatment steps, and the disclaimer; `healthy` and `uncertain` states render distinctly.
- [ ] Retry after failure preserves the photo and inputs.

### F. Internationalization

- [ ] Language switches from Welcome, Settings, and the assistant header apply instantly without reload and persist.
- [ ] Urdu flips the entire layout to RTL (chat alignment, nav, chevrons, send icon) with no horizontal scroll at 360 px.
- [ ] Every content request carries the active `language`; AI answers render verbatim.

### G. Accessibility

- [ ] A complete keyboard-only walkthrough of every MUST screen succeeds; focus is always visible.
- [ ] Inputs have labels, linked hints/errors, and `aria-invalid`; async results are announced via live regions.
- [ ] `prefers-reduced-motion` disables skeletons' pulse and all transitions.

### H. Responsive and touch

- [ ] 360 / 768 / 1280 px pass without horizontal scroll; touch targets ≥ 44 px; forms and chat are one-handed usable.

### I. API isolation and fixtures

- [ ] All fixtures live in hooks behind `USE_FIXTURE` flags, shaped exactly like §15 contracts, clearly labeled; swapping one to a real endpoint requires a one-line change.

### J. Performance and security

- [ ] Budgets of §17.1 met (bundle audit + Lighthouse mobile).
- [ ] No `dangerouslySetInnerHTML` anywhere; no secrets in the bundle; uploads validate type/size client-side.

### K. Mobile-app readiness

- [ ] `lib/` contains no React/DOM imports; reducers are pure; storage access is confined to `lib/storage.js`; browser APIs appear only in adapters and the shell (§19.1).

---

## Appendix A — Open questions and decisions

Ambiguities the spec deliberately does not silently resolve. Each has an MVP default an implementer MUST follow until a decision is recorded here.

| # | Topic | Ambiguity | MVP default (binding) | Status |
| --- | --- | --- | --- | --- |
| A1 | Authentication | Backend has no auth; user accounts are unspecified | Guest mode; no login UI; `request()` keeps a single auth-injection seam; no dead "Sign in" buttons | Open — decide post-hackathon |
| A2 | Chat streaming | Streaming vs request/response for AI answers | Request/response (`POST /api/assistant/chat`); upgrade path = server-sent events into the same hook, components unchanged | Open |
| A3 | Voice interaction | In/out scope for voice | Out of MVP; composer slot reserved; no disabled mic UI (§6.6) | Open |
| A4 | Urdu webfont | Adding Noto Nastaliq Urdu relaxes the one-webfont-pair rule in the design skill | Ship with system Urdu fallback; add the webfont only with team approval; verify RTL at 360 px either way | Decision required |
| A5 | History persistence | Server conversations vs device-local | Local-first adapter behind the same hook contract; swap to §15.5 endpoints when live | Open |
| A6 | Location | Geolocation API vs manual district | Manual district selection (privacy, desktop parity, simplicity); geolocation MAY come later behind a permission prompt | Decided for MVP |
| A7 | Weather provenance | Which weather provider | Backend's responsibility entirely; frontend renders only §15.7 payloads | Decided |
| A8 | Notification delivery | Polling / push / on-open | Fetch on panel open; push deferred to the future mobile app | Decided |
| A9 | Urdu numerals | Western vs Eastern Arabic-Indic digits | Western digits (0–9) in all locales for consistency | Decided |
| A10 | Photo privacy | EXIF/GPS on uploads | Backend MUST strip EXIF; frontend uses object URLs only and stores no photos locally beyond the session | Open (backend) |

## Appendix B — Glossary

| Term | Meaning |
| --- | --- |
| Rabi / Kharif | Pakistan's two cropping seasons (winter-sown ~Nov–Apr, e.g., wheat; summer-sown ~Apr–Oct, e.g., cotton, maize) |
| Nastaliq | The calligraphic style used for Urdu text; requires a dedicated font and generous line height |
| RTL / LTR | Right-to-left / left-to-right text direction |
| Object URL | Browser-generated local URL (`blob:`) for a file — used for image previews without upload |
| Fixture | Labeled stand-in data shaped like a real API response, used while an endpoint is unbuilt |
| Safe-area inset | Screen-edge padding (notches, home indicators) respected by the bottom tab bar |
| LCP / CLS | Largest Contentful Paint / Cumulative Layout Shift — Core Web Vitals |
| Confidence | Model's stated probability (0–1) for a diagnosis, tiered High/Medium/Low in the UI |
| Composite endpoint | One request returning several dashboard widgets' data (§15.3) |
| Guest mode | MVP operating mode without accounts; all data local or anonymous |

---

**End of specification.** Implement against this document; report deviations and unresolved Appendix A items in the implementation notes.
