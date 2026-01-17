# Habit Tracker App — Claude Code Kickoff Prompt

## Overview

Build a 10x habit tracking web app that goes beyond streak counting. The core insight: habits fail because of systems, not willpower. This app helps users understand their patterns, build habit stacks, and leverage real accountability—not passive social voyeurism.

**Name:** TBD (placeholder: "Groove")

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui as base, heavily customized |
| Database | Supabase (Postgres + Auth + Realtime) |
| ORM | Drizzle ORM |
| AI | Claude API (claude-sonnet-4-20250514) |
| Deployment | Vercel |
| State | Zustand (client), React Query (server) |
| Validation | Zod |
| Email | Resend |

---

## Design System — IMPORTANT

**Do NOT use generic "AI-generated app" aesthetics.** Avoid:
- Purple/blue gradients everywhere
- Default shadcn styling with no customization
- Excessive rounded corners (rounded-2xl on everything)
- Soft drop shadows on every card
- Generic hero sections with abstract blobs
- Lazy use of emojis as visual elements

**Instead, build with these principles:**

### Visual Identity
- **Color palette:** Warm, grounded tones. Primary: deep forest green (#1B4332). Accent: warm coral (#E07A5F). Neutrals: warm grays, not blue-grays. Background: off-white (#FAFAF8), not pure white.
- **Typography:** Use a distinctive sans-serif. Recommend Inter for body, but pair with something with personality for headings (e.g., Instrument Sans, General Sans, or Satoshi).
- **Spacing:** Generous whitespace. Don't cram UI. Let elements breathe.
- **Borders over shadows:** Use subtle 1px borders (#E5E5E3) instead of drop shadows for cards. Shadows only for elevation (modals, dropdowns).
- **Radius:** Subtle. Use rounded-lg (8px) max for cards. Buttons: rounded-md. Avoid pill shapes except for tags/badges.

### Interaction Design
- **Micro-interactions:** Habit check-ins should feel satisfying. Use subtle scale (scale-95 → scale-100), color transitions, and optional haptic feedback (for PWA).
- **One-tap experience:** The daily view should let users check off habits without extra clicks. No modals for simple check-ins.
- **Progressive disclosure:** Don't overwhelm. Show streaks and stats on demand, not all at once.
- **Skeleton loaders:** Use skeleton states, not spinners. Match the shape of content being loaded.

### Component Patterns
- **Cards:** Flat with subtle border. On hover: slight background tint, not shadow.
- **Buttons:** Primary = solid fill. Secondary = ghost/outline. Avoid gradients.
- **Icons:** Use Lucide icons consistently. 20px default size. 1.5px stroke weight.
- **Forms:** Labels above inputs (not floating). Clear error states with red-500 left border + message below.
- **Empty states:** Illustrated (simple line art, not 3D renders), with clear CTA.

---

## Database Schema

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  timezone text default 'America/Los_Angeles',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habits
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text,
  icon text, -- emoji or lucide icon name
  color text, -- hex color for visual grouping
  
  -- Tracking configuration
  tracking_type text not null default 'boolean', -- 'boolean', 'quantity', 'duration', 'scale'
  target_value numeric, -- e.g., 8 glasses, 30 minutes, rating 1-10
  target_unit text, -- e.g., 'glasses', 'minutes', 'pages'
  
  -- Frequency
  frequency text not null default 'daily', -- 'daily', 'weekly', 'specific_days'
  frequency_days integer[], -- for specific_days: [1,3,5] = Mon, Wed, Fri
  
  -- Verification settings
  verification_type text not null default 'self', -- 'self', 'photo', 'partner', 'data_linked'
  
  -- Habit stacking
  cue_habit_id uuid references habits(id), -- "After I [cue_habit], I will [this habit]"
  cue_type text, -- 'after', 'before', 'with'
  
  -- Metadata
  is_archived boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habit entries (check-ins)
create table habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  
  entry_date date not null,
  
  -- Flexible value storage
  completed boolean default false,
  value numeric, -- for quantity/duration/scale types
  
  -- Verification
  photo_url text,
  partner_verified boolean,
  partner_verified_at timestamptz,
  partner_verified_by uuid references profiles(id),
  
  -- Context (for AI insights)
  note text,
  mood integer, -- 1-5 scale, optional
  energy integer, -- 1-5 scale, optional
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(habit_id, entry_date)
);

-- Accountability partnerships
create table partnerships (
  id uuid primary key default gen_random_uuid(),
  
  requester_id uuid references profiles(id) on delete cascade not null,
  partner_id uuid references profiles(id) on delete cascade not null,
  
  status text not null default 'pending', -- 'pending', 'active', 'declined', 'ended'
  
  -- What they can see
  can_view_habits boolean default true,
  can_verify_entries boolean default true,
  can_send_nudges boolean default true,
  
  created_at timestamptz default now(),
  accepted_at timestamptz,
  ended_at timestamptz,
  
  unique(requester_id, partner_id)
);

-- Shared habits (which habits are visible to which partners)
create table habit_shares (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  partnership_id uuid references partnerships(id) on delete cascade not null,
  
  -- Granular permissions
  can_view boolean default true,
  can_verify boolean default false, -- partner attestation
  
  created_at timestamptz default now(),
  
  unique(habit_id, partnership_id)
);

-- Nudges/encouragements
create table nudges (
  id uuid primary key default gen_random_uuid(),
  
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id uuid references profiles(id) on delete cascade not null,
  habit_id uuid references habits(id) on delete set null,
  
  message text,
  type text default 'encouragement', -- 'encouragement', 'reminder', 'celebration'
  
  read_at timestamptz,
  created_at timestamptz default now()
);

-- AI insights (cached)
create table insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  
  insight_type text not null, -- 'weekly_summary', 'pattern', 'suggestion', 'streak_risk'
  content jsonb not null, -- structured insight data
  
  generated_at timestamptz default now(),
  dismissed_at timestamptz,
  acted_on boolean default false
);

-- Indexes
create index idx_habits_user_id on habits(user_id);
create index idx_habit_entries_habit_id on habit_entries(habit_id);
create index idx_habit_entries_user_date on habit_entries(user_id, entry_date);
create index idx_partnerships_users on partnerships(requester_id, partner_id);
create index idx_nudges_to_user on nudges(to_user_id, read_at);
```

---

## Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                    # Daily view (main screen)
│   │   ├── habits/
│   │   │   ├── page.tsx                # All habits list
│   │   │   ├── new/page.tsx            # Create habit
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Habit detail + history
│   │   │       └── edit/page.tsx       # Edit habit
│   │   ├── insights/page.tsx           # AI insights dashboard
│   │   ├── partners/
│   │   │   ├── page.tsx                # Partnerships list
│   │   │   └── [id]/page.tsx           # Partner detail view
│   │   ├── settings/page.tsx
│   │   └── layout.tsx                  # Dashboard shell
│   ├── invite/[code]/page.tsx          # Partnership invite handler
│   ├── api/
│   │   ├── habits/route.ts
│   │   ├── entries/route.ts
│   │   ├── partnerships/route.ts
│   │   ├── insights/generate/route.ts  # AI insight generation
│   │   └── webhooks/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui customized
│   ├── habits/
│   │   ├── habit-card.tsx
│   │   ├── habit-check-in.tsx          # The core interaction
│   │   ├── habit-form.tsx
│   │   ├── habit-calendar.tsx
│   │   ├── habit-streak.tsx
│   │   └── habit-stack-builder.tsx
│   ├── entries/
│   │   ├── entry-form.tsx
│   │   ├── photo-upload.tsx
│   │   └── verification-badge.tsx
│   ├── partners/
│   │   ├── partner-card.tsx
│   │   ├── invite-modal.tsx
│   │   ├── verification-request.tsx
│   │   └── nudge-composer.tsx
│   ├── insights/
│   │   ├── insight-card.tsx
│   │   ├── pattern-chart.tsx
│   │   └── weekly-summary.tsx
│   └── layout/
│       ├── header.tsx
│       ├── nav.tsx
│       ├── mobile-nav.tsx
│       └── page-header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── db/
│   │   ├── schema.ts                   # Drizzle schema
│   │   └── queries/                    # Typed query functions
│   ├── ai/
│   │   ├── client.ts                   # Claude API setup
│   │   ├── prompts.ts                  # Insight generation prompts
│   │   └── analyze-patterns.ts
│   ├── utils/
│   │   ├── dates.ts
│   │   ├── streaks.ts
│   │   └── validations.ts
│   └── constants.ts
├── hooks/
│   ├── use-habits.ts
│   ├── use-entries.ts
│   ├── use-partnerships.ts
│   └── use-realtime.ts
├── stores/
│   └── app-store.ts                    # Zustand store
├── types/
│   └── index.ts
└── public/
    └── illustrations/                  # Custom empty states, etc.
```

---

## Core Features Specification

### 1. Daily View (Home)

The most important screen. Users open the app, see today's habits, check them off.

**Layout:**
- Date selector at top (swipe or tap to change days)
- Greeting with streak summary ("5 habits on track. 2 need attention.")
- Habit list grouped by time of day (morning, afternoon, evening) or custom groups
- Each habit card shows: icon, name, streak count, check-in control

**Check-in interaction by tracking type:**
- **Boolean:** Single tap toggles. Satisfying animation on complete.
- **Quantity:** Tap opens inline stepper or numpad. Show progress toward target.
- **Duration:** Tap starts timer OR manual entry. Show time logged vs. target.
- **Scale:** Tap reveals 1-5 or 1-10 rating selector.

**If verification required:**
- **Photo:** After marking complete, prompt for photo. Show camera inline, not separate screen.
- **Partner:** After marking complete, entry shows "Pending verification" badge.

### 2. Habit Creation/Editing

**Form fields:**
- Name (required)
- Description (optional)
- Icon picker (emoji or Lucide icon)
- Color (limited palette from design system)
- Tracking type (boolean, quantity, duration, scale)
- Target value and unit (if applicable)
- Frequency (daily, specific days, weekly)
- Verification type (self, photo, partner attestation)
- Habit stacking (optional: link to another habit as cue)

**Habit stacking UI:**
- "Stack this habit" toggle
- If enabled: "After I complete [dropdown of existing habits], I will do this"
- Visual connection shown in daily view

### 3. Habit Detail View

**Shows:**
- Calendar heatmap (GitHub-style) of completions
- Current streak and best streak
- Completion rate (last 7 days, 30 days, all time)
- Recent entries with notes/photos
- AI insight specific to this habit (if available)
- Edit and archive actions

### 4. Verification System

**Self-reported (default):**
- User marks complete. No additional steps.
- Trust is implicit.

**Photo proof:**
- After marking complete, camera UI appears.
- User takes or uploads photo.
- Photo stored and visible to user (and partners if shared).
- Entry shows photo thumbnail.

**Partner attestation:**
- After user marks complete, entry is "pending."
- Partner receives notification (or sees in their partner view).
- Partner confirms or flags the entry.
- If confirmed: entry shows "Verified by [Partner Name]" badge.
- If flagged: entry shows "Flagged" and user is notified to discuss.

**Data-linked (future):**
- Placeholder for integrations (Apple Health, etc.)
- Show as "coming soon" option in habit creation.

### 5. Accountability Partners

**Invite flow:**
1. User clicks "Add Partner" → enters partner's email.
2. System sends invite email with unique link.
3. Partner clicks link → creates account (or logs in if existing).
4. Partner sees pending invite → accepts or declines.
5. On accept: both users are now partners.

**Partner permissions:**
- View shared habits (which ones are configurable)
- Verify entries (if habit uses partner attestation)
- Send nudges/encouragements

**Partner view:**
- See partner's shared habits and today's status
- See streaks and recent activity
- Verify pending entries
- Send nudge (predefined messages + custom)

**Privacy controls:**
- Per-habit sharing: choose which habits each partner can see
- Can revoke partnership at any time
- Can hide specific habits from specific partners

### 6. Nudges

**Types:**
- **Encouragement:** "Keep it up! 🎉" (predefined positive messages)
- **Reminder:** "Hey, did you forget to log [habit]?" (for missed check-ins)
- **Celebration:** "Amazing! 30-day streak!" (auto-triggered milestones)

**Partner-sent nudges:**
- Partner can send one nudge per habit per day (prevent spam)
- User sees nudges in a notification center or inline on habit card
- Optional: push notification if enabled

### 7. AI Insights

**Weekly summary (generated every Monday):**
- Completion rate for the week
- Best performing habits
- Habits that need attention
- Pattern observations
- One specific, actionable suggestion

**Pattern detection (ongoing):**
- Analyze entries for correlations:
  - Day of week patterns
  - Time of day patterns
  - Mood/energy correlations (if logged)
  - Habit stacking success rates
  - Skip triggers ("You tend to skip [habit] on days after [event]")

**Suggestions:**
- Habit stacking recommendations
- Optimal timing suggestions
- Streak risk warnings ("Your [habit] streak is at risk—you've skipped similar situations before")

**AI implementation:**
- Use Claude claude-sonnet-4-20250514 for analysis
- Batch process nightly, not real-time (cost efficiency)
- Store insights in DB, display on insights page + relevant habit cards
- Keep prompts focused and structured (see lib/ai/prompts.ts)

---

## Key User Flows

### Flow 1: First-time user
1. Sign up → onboarding asks about goals (optional)
2. Create first habit (guided)
3. Land on daily view with one habit
4. Prompt to add more habits or invite partner

### Flow 2: Daily check-in
1. Open app → see today's habits
2. Tap to check off each habit
3. If photo required → take photo inline
4. See satisfying completion animation
5. Optional: add note or mood

### Flow 3: Add accountability partner
1. Go to Partners → Add Partner
2. Enter email → send invite
3. Partner receives email, clicks link
4. Partner accepts → connection established
5. Configure which habits to share

### Flow 4: Verify partner's entry
1. Receive notification (or see in partner view)
2. Open pending verification
3. See habit, date, and any photo proof
4. Tap "Verify" or "Flag"
5. If flagged, add optional note

---

## API Routes

### `/api/habits`
- GET: List user's habits
- POST: Create new habit

### `/api/habits/[id]`
- GET: Single habit with stats
- PATCH: Update habit
- DELETE: Archive habit

### `/api/entries`
- GET: List entries (filterable by date range, habit)
- POST: Create entry (check-in)

### `/api/entries/[id]`
- PATCH: Update entry (add photo, note, etc.)
- DELETE: Remove entry

### `/api/entries/[id]/verify`
- POST: Partner verifies or flags entry

### `/api/partnerships`
- GET: List partnerships
- POST: Create invite

### `/api/partnerships/[id]`
- PATCH: Accept, decline, or end partnership
- DELETE: Remove partnership

### `/api/partnerships/[id]/nudge`
- POST: Send nudge to partner

### `/api/insights/generate`
- POST: Trigger insight generation for user (called by cron)

### `/api/insights`
- GET: List user's insights
- PATCH: Mark insight as dismissed or acted on

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude AI
ANTHROPIC_API_KEY=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Implementation Order

1. **Project setup:** Next.js, Tailwind, shadcn/ui, Supabase connection
2. **Auth:** Sign up, login, logout with Supabase Auth
3. **Database:** Run migrations, set up Drizzle
4. **Habits CRUD:** Create, list, edit, archive habits
5. **Daily view:** Display today's habits, basic check-in
6. **Check-in variations:** Quantity, duration, scale tracking types
7. **Habit detail:** Calendar view, stats, history
8. **Photo verification:** Upload and display proof photos
9. **Partnerships:** Invite flow, accept/decline, partner view
10. **Partner attestation:** Verification requests and confirmations
11. **Nudges:** Send and receive encouragements
12. **AI insights:** Pattern analysis and weekly summaries
13. **Polish:** Animations, empty states, error handling, PWA setup

---

## Notes for Claude Code

- **Test as you build.** After each major feature, verify it works before moving on.
- **Mobile-first CSS.** Use Tailwind responsive prefixes (`sm:`, `md:`) to scale up, not down.
- **Type everything.** No `any` types. Use Zod for runtime validation at API boundaries.
- **Error boundaries.** Add error handling UI, not just console logs.
- **Loading states.** Every async operation needs a loading state. Use skeletons.
- **Accessibility.** Proper labels, ARIA attributes, keyboard navigation.
- **Edge cases:** Empty states, error states, offline handling (basic).

Start with project setup and auth. Confirm everything works before proceeding.
