# AcademiX — Paper Figures Capture Guide

After running `001_demo_data.sql`, follow this guide to capture every figure and
table needed for the Results section of the research paper.

---

## Step 0 — Run Migrations + Seed

In **Supabase Dashboard → SQL Editor**, run in order:
1. `supabase/migrations/001_verification_system.sql`
2. `supabase/migrations/002_extended_features.sql`
3. `supabase/seed/001_demo_data.sql`

Promote your own account to admin:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

---

## Step 1 — Start the dev server

```bash
npm run dev
# Open http://localhost:8080
```

---

## Figures to Capture

### Figure 1 — System Architecture Diagram
Already in the paper. No screenshot needed.

---

### Figure 2 — Student Dashboard (Overview Tab)
**URL:** `/dashboard` (login as `priya.sharma@demo.academix.in`)

**What to show:**
- Engagement Score banner (A+ grade, score ~78)
- KPI cards (5 achievements, categories)
- Activity Breakdown bar chart

**Settings:** Light theme, 1280×800, Chrome

---

### Figure 3 — Add Record Form with Duplicate Warning
**Steps:**
1. Click "Add Record"
2. Enter title: `AWS Certified Solutions Architect`
3. Set category: `Certifications`, date: `2024-08-15`
4. Click "Add Record" — duplicate warning toast appears

**Screenshot:** Capture the amber warning toast + form.

---

### Figure 4 — AI Verification Flow (Teacher Portal)
**URL:** `/teacher` (login as `dr.kavitha@demo.academix.in`)

**What to show:**
- Expandable row for a `needs_review` record
- AI confidence bar (e.g. 72%)
- AI notes text
- Approve / Reject buttons

---

### Figure 5 — Admin Dashboard: Overview Tab
**URL:** `/admin` (login as your admin account)

**What to show:**
- KPI row (students, records, verification rate, departments)
- Monthly Submissions line chart
- Verification Status pie chart
- Engagement Leaderboard (top students with grades)

---

### Figure 6 — Admin Dashboard: Analytics Tab
**Captures needed (each is a separate figure or sub-figure):**

| Sub-fig | Chart | Key insight to highlight |
|---------|-------|--------------------------|
| 6a | Department Participation bar chart | CS has most records; Civil and MBA are active |
| 6b | Activity Categories bar chart | Certifications and Competitions dominate |
| 6c | Engagement Score Distribution | Most students in B+/A range |
| 6d | AI Confidence Histogram | Peak in 85–100 bucket (auto-verified cluster) |

---

### Figure 7 — AI Verification Metrics (Admin → Analytics, scroll down)
**What to capture:**
- Auto-Verify Rate: ~68%
- Avg. Confidence: ~84%
- Human Override Rate: ~8%
- Rejection Rate: ~8%

These four numbers go into Table II (System Performance) in the Results section.

---

### Figure 8 — Public Portfolio
**URL:** `/portfolio/a1000001-0000-0000-0000-000000000001`
(Priya Sharma — `is_portfolio_public = true`)

**What to show:**
- Profile card with engagement score badge (A+)
- Stats row (verified records, categories, verify rate)
- Verified records grouped by category

---

### Figure 9 — Notification Center
**Steps:**
1. Login as `priya.sharma@demo.academix.in`
2. Go to Dashboard
3. Click bell icon in topbar
4. Screenshot the notification dropdown

---

## Table for Results Section

Copy these numbers from Admin → Reports → Snapshot:

| Metric | Value |
|--------|-------|
| Total Registered Students | 10 |
| Total Activity Records | ~45 |
| Verified Records (AI + Manual) | ~32 |
| Verification Rate | ~71% |
| AI Auto-Verified | ~27 |
| Faculty Manually Verified | ~5 |
| Rejection Rate | ~4 records |
| Avg AI Confidence | ~87% |
| Departments Represented | 4 |
| Avg Records per Student | ~4.5 |

---

## Comparison Table (for Literature Review / Discussion)

| Feature | Prior Systems | AcademiX |
|---------|--------------|---------|
| AI document verification | None | ✅ Claude Vision |
| Engagement scoring | None | ✅ 0-100 algorithm |
| Semantic duplicate detection | None | ✅ Jaccard similarity |
| NAAC/NIRF export | Manual | ✅ One-click CSV |
| Public verifiable portfolio | Some | ✅ With sharing toggle |
| Realtime notifications | None | ✅ DB trigger-based |
| Role-based access | Some | ✅ RLS at DB layer |

---

## Screenshot Settings

- Browser: Chrome (disable extensions for clean UI)
- Zoom: 100%
- Resolution: 1280×800 or 1440×900
- Theme: Light (default)
- Use "Full page screenshot" for dashboards (Chrome DevTools → Capture full size screenshot)
- Crop to the relevant section before inserting into the paper
