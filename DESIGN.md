# UI Design System & Penpot Layout Specification

> **System**: Student Course Registration Portal  
> **Institution**: KMITL • Faculty of Engineering (13016228 Software Design & Architecture)  
> **Role Context**: Lead UI/UX Systems Designer  
> **Target Tooling**: Penpot / Figma Auto-Layout Engines  
> **Version**: 2.0.0-penpot-spec  

---

## 1. Executive UI Principles & Ergonomics

The registration portal operates in high-stress, time-sensitive academic windows. Visual hierarchy must prioritize immediate readability, zero ambiguity, and error-tolerant interaction.

```
+---------------------------------------------------------------------------------------------------+
|                                      CORE DESIGN PILLARS                                          |
+---------------------------------+---------------------------------+-------------------------------+
|      1. DETERMINISTIC STATUS    |      2. PRE-FLIGHT FEEDBACK     |     3. DEFENSIVE ERGONOMICS   |
| Statuses are visually binary.   | Validate before execution. Show | Prevent misclicks, accidental |
| Seats, prerequisites, and queue | credits, prereqs, and clashes   | drops, and ambiguous pending  |
| states have explicit badges.    | directly within the cart dock.  | states with lockouts & modals.|
+---------------------------------+---------------------------------+-------------------------------+
```

* **Deterministic Status Telemetry**: Seats, prerequisites, and registration statuses must be scannable within 500 milliseconds. Never hide status behind hover-only disclosures.
* **Pre-Flight Validation**: Provide immediate visual validation (credit capacity meter, prerequisite tags, schedule clash warnings) prior to final submission.
* **Defensive Ergonomics**: Destructive actions (e.g., dropping an enrolled course) require two-step modal confirmations. Committing actions display clear loading lockouts.
* **WCAG 2.1 AA Compliance**:
  * Body copy contrast $\ge 4.5:1$ against surface backgrounds.
  * Badges, icons, and interactive controls contrast $\ge 3.0:1$.
  * Visible focus rings on all interactive elements.

---

## 2. Viewport Targets & Spatial Layout Proportions

```
+---------------------------------------------------------------------------------------------------+
| DESKTOP CANVAS (Target: 1440px Canvas, 1280px Min Container)                                      |
|                                                                                                   |
| +-----------------------------------------------------------------------------------------------+ |
| | GLOBAL HEADER (Height: 72px, Fixed Full Width)                                                | |
| +-----------------------------------------------------------------------------------------------+ |
| | LEFT PANE (60% Width, Flex Column)            | RIGHT PANE (40% Width, Flex Column)           | |
| | - Filter & Search Toolbar                     | - Interactive 5-Day Timetable Grid            | |
| | - Course Catalog Cards / Table Results        | - Staging Cart & Pre-Flight Validation Dock   | |
| |                                               |                                               | |
| +-----------------------------------------------+-----------------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
```

| Breakpoint Tier | Width Target | Layout Behavior | Layout Split |
|---|---|---|---|
| **Desktop (Primary Canvas)** | `1440px` (min `1280px`) | Dual-column split layout with sticky right rail | 60% Catalog / 40% Timetable & Cart |
| **Laptop / Compact** | `1024px – 1279px` | Stacked 2-column or tabbed views | 55% Catalog / 45% Timetable |
| **Tablet** | `768px – 1023px` | Single column; sticky bottom validation sheet | Full width, collapsible timetable accordion |
| **Mobile** | `375px – 430px` | Single column stacked feed; bottom navigation dock | Full width, chronological linear agenda |

---

## 3. Penpot Auto-Layout & Structural Rules

When constructing boards and components in Penpot:

1. **Strict Flex Container Hierarchy**:
   * Every card, row, column, and sheet **must be a Flex container** (Auto-Layout).
   * **Do not use absolute positioning coordinates** for standard content. Absolute positioning is reserved strictly for modal scrim overlays and floating notification toasts.
2. **Sizing Behaviors**:
   * **Horizontal Card Lists / Tables**: Set parent width to `Fill container (100%)`.
   * **Text Elements**: Titles and paragraphs set to `Fill container` with text wrapping enabled. Metadata tags and badges set to `Hug contents`.
   * **Fixed Elements**: Button heights, icon boxes, and calendar hour gutter widths have fixed pixel values.
3. **Paddings and Gaps**:
   * Align all paddings and spacing gaps to token values: `gap: 8px`, `gap: 12px`, `gap: 16px`, `gap: 24px`.
   * Never use arbitrary pixel nudges (e.g., `13px`, `27px`).
4. **Z-Index Layering (Board Ordering)**:
   * Base Canvas (`Z: 0`) $\rightarrow$ Sticky Bars (`Z: 10`) $\rightarrow$ Modal Scrim Overlay (`Z: 40`) $\rightarrow$ Modal Dialog (`Z: 50`) $\rightarrow$ Toast Notifications (`Z: 100`).
5. **Semantic Layer Naming**: 
   - Every top-level frame and child container must use semantic naming (e.g., `Header`, `CatalogCard`, `TimetableGrid`, `ValidationDock`, `ModalOverlay`). Avoid raw default layer names (`rect-1`, `frame-2`).

---

## 4. Design Tokens & Foundations

### 4.1 Color Tokens

```css
:root {
  /* Brand Primary (KMITL Academic Orange) */
  --color-brand-primary:      #FF5722;
  --color-brand-primary-hover:#E64A19;
  --color-brand-primary-light:#FFF3E0;
  --color-brand-primary-dark: #D84315;

  /* Neutrals & Surfaces (Slate) */
  --color-surface-canvas:     #F8FAFC; /* Board background */
  --color-surface-card:       #FFFFFF; /* Frame / Card background */
  --color-surface-subtle:     #F1F5F9; /* Input backgrounds, inactive tabs */
  --color-surface-hover:      #E2E8F0; /* Row hover highlight */
  --color-border-subtle:      #E2E8F0; /* Card borders, dividers */
  --color-border-strong:      #CBD5E1; /* Input borders */

  /* Text & Typography */
  --color-text-primary:       #0F172A; /* High-contrast body & titles */
  --color-text-secondary:     #475569; /* Sub-headers, descriptors */
  --color-text-muted:         #94A3B8; /* Captions, disabled text */
  --color-text-inverse:       #FFFFFF; /* White text on dark/colored buttons */

  /* Semantic Status: Seats & Quotas */
  --color-status-open-bg:     #ECFDF5;
  --color-status-open-text:   #065F46;
  --color-status-open-dot:    #10B981; /* Green: Available seats */

  --color-status-full-bg:     #FEF2F2;
  --color-status-full-text:   #991B1B;
  --color-status-full-dot:    #EF4444; /* Red: Section Full */

  --color-status-wait-bg:     #FFFBEB;
  --color-status-wait-text:   #92400E;
  --color-status-wait-dot:    #F59E0B; /* Amber: Waitlist open */

  /* Semantic Status: Timetable Blocks */
  --color-timetable-enrolled-bg:     #EFF6FF;
  --color-timetable-enrolled-border: #3B82F6;
  --color-timetable-enrolled-text:   #1D4ED8;

  --color-timetable-staged-bg:       #F5F3FF;
  --color-timetable-staged-border:   #8B5CF6;
  --color-timetable-staged-text:     #6D28D9;

  --color-timetable-clash-bg:        #FEF2F2;
  --color-timetable-clash-border:    #DC2626;
  --color-timetable-clash-text:      #991B1B;
}
```

### 4.2 Typography Tokens

* **Primary Font**: `Inter` (Fallback: system sans-serif).
* **Thai Localization Fallback**: `Prompt` or `Sarabun`.
* **Monospace Font**: `JetBrains Mono` or `Courier New` (for Course Codes, Section IDs, Time stamps).

```css
:root {
  /* Type Sizes */
  --type-display:   1.75rem; /* 28px - Weight: 700 - Line Height: 1.25 */
  --type-heading-1: 1.5rem;  /* 24px - Weight: 700 - Line Height: 1.3  */
  --type-heading-2: 1.25rem; /* 20px - Weight: 600 - Line Height: 1.35 */
  --type-heading-3: 1.0rem;  /* 16px - Weight: 600 - Line Height: 1.4  */
  --type-body:      0.875rem;/* 14px - Weight: 400 - Line Height: 1.5  */
  --type-body-bold: 0.875rem;/* 14px - Weight: 600 - Line Height: 1.5  */
  --type-caption:   0.75rem; /* 12px - Weight: 500 - Line Height: 1.4  */
  --type-code:      0.8125rem;/* 13px - Weight: 600 (Mono)             */
}
```

### 4.3 Spacing & Radius Tokens

```css
:root {
  /* 4px / 8px Spacing Scale */
  --space-1:  4px;
  --space-2:  8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Corner Radii */
  --radius-xs:   4px;  /* Code chips, small badges */
  --radius-sm:   6px;  /* Action buttons, input fields */
  --radius-md:  10px;  /* Cards, table containers */
  --radius-lg:  16px;  /* Modals, drawer sheets */
  --radius-full: 9999px; /* Status pills, avatars */

  /* Elevation & Shadows */
  --elevation-low:  0px 1px 3px rgba(15, 23, 42, 0.08);
  --elevation-mid:  0px 4px 12px rgba(15, 23, 42, 0.12);
  --elevation-high: 0px 12px 32px rgba(15, 23, 42, 0.16);
  --elevation-scrim: rgba(15, 23, 42, 0.55);
}
```

---

## 5. Screen Specifications & ASCII Wireframes

### 5.1 Global Persistent Header

A fixed-height (72px) header framing student credentials and aggregate credit telemetry.

```text
+----------------------------------------------------------------------------------------------------+
| [KMITL LOGO] COURSE REGISTRATION PORTAL   Term: 2026/1 | [🟢 Window Open]                          |
|                                                                                                    |
| Total Credits: [■■■■■■■■■■■□□□□□] 15/22 Cr        Student: 65010042 (Somchai P.) | [⚙ Profile]    |
+----------------------------------------------------------------------------------------------------+
```

* **Penpot Flex Layout**:
  * Frame: Direction = `Row`, Justify = `Space Between`, Align = `Center`, Padding = `16px 32px`, Height = `72px`, Fill = `--color-surface-card`, Border-bottom = `1px solid --color-border-subtle`.
* **Telemetry Gauge**:
  * Track width = `160px`, Height = `8px`, Radius = `--radius-full`, Fill = `--color-surface-subtle`.
  * Active fill bar = `15/22 (68%)` width in `--color-brand-primary`. Turn `--color-timetable-clash-border` if `> 22`.

---

### 5.2 Screen 1: Course Catalog & Section Search

Search and filter controls with course cards displaying live seat counters and prerequisite tags.

```text
+----------------------------------------------------------------------------------------------------+
| CATALOG SEARCH & FILTER                                                                            |
| [ 🔍 Search Course Code or Title... ] [ Department: Computer Eng v ] [ Day: All Days v ] [x Open ] |
+----------------------------------------------------------------------------------------------------+
| COURSE LISTING                                                                                     |
|                                                                                                    |
| [ CS301 ] Software Design and Architecture (3 Credits)                                             |
| Prerequisites: CS102, CS202 [ MET 🟢 ]                                                             |
| +-----+----------------+----------------------+--------+------------+----------+-----------------+ |
| | Sec | Instructor     | Day & Time           | Room   | Seats      | Status   | Action          | |
| +-----+----------------+----------------------+--------+------------+----------+-----------------+ |
| | 01  | Dr. Veera B.   | Mon, Wed 09:00-10:30 | HM402  | 48/50 Open | OPEN 🟢  | [ + Add Cart ]  | |
| | 02  | Dr. Veera B.   | Mon, Wed 13:00-14:30 | HM402  | 50/50 Full | FULL 🔴  | [ Waitlist 🕒 ] | |
| +-----+----------------+----------------------+--------+------------+----------+-----------------+ |
|                                                                                                    |
| [ CS305 ] Distributed Systems (3 Credits)                                                          |
| Prerequisites: CS205 [ MISSING 🔴 CS205 required ]                                                 |
| +-----+----------------+----------------------+--------+------------+----------+-----------------+ |
| | 01  | Dr. Kittipong  | Tue, Thu 10:30-12:00 | ECC801 | 25/40 Open | OPEN 🟢  | [ Blocked ⚠️ ]  | |
| +-----+----------------+----------------------+--------+------------+----------+-----------------+ |
+----------------------------------------------------------------------------------------------------+
```

* **Penpot Layout Spec**:
  * Filter Bar: Direction = `Row`, Gap = `12px`, Wrap = `Wrap`, Padding = `16px`, Fill = `--color-surface-card`, Radius = `--radius-md`.
  * Course Group Card: Direction = `Column`, Gap = `12px`, Padding = `16px`, Fill = `--color-surface-card`, Border = `1px solid --color-border-subtle`, Radius = `--radius-md`.
  * Table Rows: Direction = `Row`, Align = `Center`, Padding = `12px 16px`, Border-bottom = `1px solid --color-border-subtle`.

---

### 5.3 Screen 2: Interactive Weekly Timetable Grid

5-day matrix (Monday–Friday) spanning 08:00 to 18:00 in 30-minute intervals.

```text
+----------------------------------------------------------------------------------------------------+
| WEEKLY TIMETABLE                                      Legend: [■ Enrolled] [■ Staged] [■ Conflict] |
+-------+------------------+------------------+------------------+------------------+----------------+
| Time  | Monday           | Tuesday          | Wednesday        | Thursday         | Friday         |
+-------+------------------+------------------+------------------+------------------+----------------+
| 08:00 |                  |                  |                  |                  |                |
| 09:00 | [ CS301 Sec 01 ] |                  | [ CS301 Sec 01 ] |                  |                |
|       | HM402 (Staged 🟣)|                  | HM402 (Staged 🟣)|                  |                |
| 10:30 |                  | [ CS203 Sec 02 ] |                  | [ CS203 Sec 02 ] |                |
|       |                  | ECC701 (Enrolled)|                  | ECC701 (Enrolled)|                |
| 13:00 |                  |                  |                  |                  |                |
| 14:30 | [ ⚠️ CLASH! ]     |                  |                  |                  |                |
|       | CS302 vs CS304 🔴|                  |                  |                  |                |
+-------+------------------+------------------+------------------+------------------+----------------+
```

* **Penpot Layout Spec**:
  * Grid Container: Direction = `Row`, Gap = `1px` (using border color for divider lines).
  * Time Column (Hour Gutter): Fixed Width = `72px`, Direction = `Column`.
  * Day Columns: 5 flex items with `Fill container (equal width)`.
  * Class Block Component: Direction = `Column`, Padding = `8px`, Radius = `--radius-sm`, Justify = `Space Between`.
    * Height calculated proportionally: 60-minute class = `64px` height; 90-minute class = `96px` height.

---

### 5.4 Screen 3: Cart / Staging Drawer & Pre-Flight Validation Dock

Staged course inspector paired with a high-visibility validation dock.

```text
+----------------------------------------------------------------------------------------------------+
| STAGED COURSES IN CART (2 Items Selected)                                                          |
|                                                                                                    |
| 1. CS301 - Software Design & Architecture | Sec 01 | Mon, Wed 09:00-10:30 | 3 Cr | [ 🗑️ Remove ]    |
| 2. CS310 - Cloud Computing Infrastructure | Sec 02 | Fri 13:00-16:00      | 3 Cr | [ 🗑️ Remove ]    |
+----------------------------------------------------------------------------------------------------+
| PRE-FLIGHT VALIDATION DOCK (Persistent Bottom Rail)                                                |
|                                                                                                    |
| Credit Limit: 18 / 22 Cr [ PASS 🟢 ]    Prerequisites: Satisfied [ PASS 🟢 ]    Clashes: None [ 🟢 ]|
|                                                                                                    |
| [ Clear Cart ]                                              [ ⚡ CONFIRM ENROLLMENT (18 Credits) ]  |
+----------------------------------------------------------------------------------------------------+
```

* **Penpot Layout Spec**:
  * Dock Frame: Direction = `Row`, Justify = `Space Between`, Align = `Center`, Padding = `16px 24px`, Fill = `--color-surface-card`, Shadow = `--elevation-mid`, Radius = `--radius-lg`.
  * Checklist Cluster: Direction = `Row`, Gap = `16px`, Align = `Center`.
  * CTA Button: Fixed Height = `48px`, Padding = `0px 28px`, Fill = `--color-brand-primary`, Radius = `--radius-sm`.

---

### 5.5 Screen 4: Registered Courses & Waitlist Dashboard

Post-enrollment review tracking confirmed courses and waitlist queue ranks.

```text
+----------------------------------------------------------------------------------------------------+
| CONFIRMED ENROLLED COURSES (15 Credits Active)                                                     |
| +--------+-----------------------------+-----+---------+----------------------+---------+----------+ |
| | Code   | Title                       | Sec | Credits | Schedule             | Room    | Action   | |
| +--------+-----------------------------+-----+---------+----------------------+---------+----------+ |
| | CS201  | Data Structures & Algorithms| 01  | 3       | Mon 10:30-12:00      | HM401   | [ Drop ] | |
| | CS203  | Computer Networks           | 02  | 3       | Tue, Thu 10:30-12:00 | ECC701  | [ Drop ] | |
| +--------+-----------------------------+-----+---------+----------------------+---------+----------+ |
|                                                                                                    |
| WAITLIST QUEUE MONITOR (1 Active Queue)                                                            |
| +--------+-----------------------------+-----+---------+------------+-------------------+----------+ |
| | Code   | Title                       | Sec | Credits | Position   | Offer Status      | Action   | |
| +--------+-----------------------------+-----+---------+------------+-------------------+----------+ |
| | CS301  | Software Design & Arch      | 02  | 3       | #1 in Line | OFFER PENDING ⏱️  | [ Claim ]| |
| +--------+-----------------------------+-----+---------+------------+-------------------+----------+ |
+----------------------------------------------------------------------------------------------------+
```

* **Waitlist Offer Alert Banner**:
  * Frame: Direction = `Row`, Align = `Center`, Justify = `Space Between`, Padding = `12px 20px`, Fill = `--color-brand-primary-light`, Border = `1px solid --color-brand-primary`, Radius = `--radius-md`.
  * Label: *"Seat offer ready for CS301 Sec 02! Expires in 23h 45m"*. Action: `[ Claim Seat Now ]`.

---

### 5.6 Empty & First-Run System States (Zero States)

During first login, prior to course staging, or when search queries yield zero results, the interface maintains deterministic layout structures while displaying informative zero-state guidance.

---

#### 5.6.1 Empty Cart & Pre-Flight Dock State (Screen 3 Zero State)
When a student has staged zero courses (`cart.length === 0`), the cart dock preserves its dimensions to prevent layout shifts while disabling checkout execution.

```text
+----------------------------------------------------------------------------------------------------+
| STAGED COURSES IN CART (0 Items Selected)                                                          |
|                                                                                                    |
| + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |
| |                                     🛒                                                          | |
| |                            Your Cart is Empty                                                   | |
| |        Browse or search courses on the left to stage sections onto your schedule.              | |
| + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |
+----------------------------------------------------------------------------------------------------+
| PRE-FLIGHT VALIDATION DOCK (Persistent Bottom Rail)                                                |
|                                                                                                    |
| Credit Limit: 0 / 22 Cr [ PASS 🟢 ]    Prerequisites: N/A [ — ]             Clashes: None [ 🟢 ]    |
|                                                                                                    |
| [ Clear Cart (Disabled) ]                                   [ 🔒 Cart is Empty (0 Credits) ]       |
+----------------------------------------------------------------------------------------------------+
```

* **Defensive Ergonomics**:
  * **Disabled Submit CTA**: The checkout button transitions to `Disabled` state (`Fill: #F1F5F9`, `Text: #94A3B8`, `cursor: not-allowed`), preventing empty checkout requests.
  * **Neutral Prereq Badge**: Displays `N/A [ — ]` in neutral slate (`#F1F5F9` background, `#64748B` text) rather than false positive `PASS 🟢`.
* **Penpot Layout Spec**:
  * **Empty Cart Box**: Width = `Fill container`, Height = `110px`, Border = `1px dashed #CBD5E1`, Fill = `#F8FAFC`, Radius = `--radius-sm` (6px), Flex = `Column`, Align = `Center`, Justify = `Center`, Gap = `6px`.
  * **Icon**: `🛒` (`20px`). Heading: Bold 13px `#475569`. Description: Regular 12px `#94A3B8`.

---

#### 5.6.2 Zero Timetable Schedule State (Screen 2 Zero State)
When a student has zero enrolled courses and zero staged cart items, the calendar grid renders its full 5-day matrix with subtle empty slot outlines and centered onboarding guidance.

```text
+----------------------------------------------------------------------------------------------------+
| WEEKLY TIMETABLE                                      Legend: [■ Enrolled] [■ Staged] [■ Conflict] |
+-------+------------------+------------------+------------------+------------------+----------------+
| Time  | Monday           | Tuesday          | Wednesday        | Thursday         | Friday         |
+-------+------------------+------------------+------------------+------------------+----------------+
| 08:00 | [  Empty Slot  ] | [  Empty Slot  ] | [  Empty Slot  ] | [  Empty Slot  ] | [  Empty Slot  ] |
| 09:00 |                  |                  |                  |                  |                |
| 10:30 |                  |     📅 No Classes Scheduled Yet     |                  |                |
| 13:00 |                  |   Staged courses from the catalog    |                  |                |
| 14:30 |                  |   will appear here in purple dashed. |                  |                |
| 16:00 |                  |                  |                  |                  |                |
+-------+------------------+------------------+------------------+------------------+----------------+
```

* **Defensive Ergonomics**:
  * **Layout Continuity**: Grid structure, hour intervals, and legend pills remain identical to active states; empty slot cells use `--color-border-subtle` (`#E2E8F0`) with faint fill (`#FAFAFA`).
  * **Onboarding Guidance**: Reassures the student that the calendar is functioning and explains the color-coding behavior before classes are added.

---

#### 5.6.3 Catalog Zero Search Results State (Screen 1 Zero State)
When keyword queries, department filters, or day selectors return zero matching course sections.

```text
+----------------------------------------------------------------------------------------------------+
| CATALOG SEARCH & FILTER                                                                            |
| [ 🔍 "Quantum Computing"............. ] [ Dept: Computer Eng v ] [ Day: Friday v ] [x Open Seats ] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
| +------------------------------------------------------------------------------------------------+ |
| |                                              🔍                                                | |
| |                                       No Courses Found                                         | |
| |       No sections matched "Quantum Computing" with current department and day filters.        | |
| |                                                                                                | |
| |                                      [ ↺ Reset All Filters ]                                   | |
| +------------------------------------------------------------------------------------------------+ |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

* **Defensive Ergonomics**:
  * **One-Click Recovery**: Provides a prominent `[ ↺ Reset All Filters ]` button that immediately clears the search string and restores default dropdown values.
* **Penpot Layout Spec**:
  * **Container Card**: Width = `Fill container`, Height = `240px`, Fill = `#FFFFFF`, Border = `1px solid #E2E8F0`, Radius = `--radius-md` (10px), Flex = `Column`, Align = `Center`, Justify = `Center`, Gap = `12px`.
  * **Search Badge Circle**: Width = `48px`, Height = `48px`, Radius = `24px`, Fill = `#F1F5F9`, Center icon `🔍` (`20px`).
  * **Action Button**: Height = `38px`, Padding = `0 18px`, Background = `#FFFFFF`, Border = `1px solid #CBD5E1`, Text = `#0F172A`, Radius = `6px`.

---

#### 5.6.4 Pre-Registration Countdown & Lockout State (Window Preview)
In the minutes leading up to the registration opening (e.g., 08:45:00 AM to 08:59:59 AM), students can search, stage carts, and validate prereqs, but the commit action is strictly locked.

* **Global Header Window Badge**: Transitions from `🟢 Window Open` to `🟡 Window Opens in 00:14:32` (`Fill: #FEF3C7`, `Border: 1px solid #FDE68A`, `Text: #92400E`).
* **Cart Dock Submit CTA**: Replaced with a locked countdown button:
  * Label: `[ 🔒 Enrollment Locked (Opens at 09:00:00 AM) ]`
  * Styling: Height = `48px`, Fill = `#FFFBEB`, Border = `1px solid #FDE68A`, Text = `#92400E`, Cursor = `not-allowed`.

---

## 6. Component Visual States & Token Mappings

### 6.1 Buttons

```text
+------------------+------------------+------------------+------------------+------------------+
| DEFAULT          | HOVER            | PRESSED / ACTIVE | DISABLED         | LOADING          |
| [ Confirm (18) ] | [ Confirm (18) ] | [ Confirm (18) ] | [ Confirm (18) ] | [ ⏳ Enrolling ] |
| Fill: BrandOrange| Fill: BrandDark  | Fill: Brand700   | Fill: Gray 200   | Fill: BrandOrange|
| Text: White      | Text: White      | Text: White      | Text: Gray 400   | Spinner + Text   |
+------------------+------------------+------------------+------------------+------------------+
```

| Component | State | Fill | Border | Text Color | Extra Styling |
|---|---|---|---|---|---|
| **Primary Button** | Default | `--color-brand-primary` | None | `--color-text-inverse` | Height: 44px, Radius: 6px |
| | Hover | `--color-brand-primary-hover` | None | `--color-text-inverse` | Cursor: Pointer |
| | Pressed | `--color-brand-primary-dark` | None | `--color-text-inverse` | Scale: 0.98 |
| | Disabled | `--color-surface-subtle` | None | `--color-text-muted` | Cursor: Not-allowed |
| | Loading | `--color-brand-primary` | None | `--color-text-inverse` | Spinner icon visible, opacity 0.8 |
| **Secondary Button** | Default | `--color-surface-card` | `1px solid --color-border-strong` | `--color-text-primary` | Height: 44px |
| | Hover | `--color-surface-subtle` | `1px solid --color-border-strong` | `--color-text-primary` | Background shift |
| | Disabled | `--color-surface-canvas` | `1px solid --color-border-subtle` | `--color-text-muted` | Muted border |
| **Destructive Button** | Default | `--color-status-full-bg`| `1px solid --color-status-full-dot`| `--color-status-full-text` | Red tone |
| | Hover | `--color-status-full-dot`| None | `--color-text-inverse` | Solid red fill |

### 6.2 Status Badges & Pills

All badges use: Height = `24px`, Padding = `2px 8px`, Radius = `--radius-full`, Font = `--type-caption`.

| Status Pill | Background Fill | Border | Text Color | Dot Icon |
|---|---|---|---|---|
| **Seats OPEN** | `--color-status-open-bg` | `1px solid #A7F3D0` | `--color-status-open-text` | 6px dot: `--color-status-open-dot` |
| **Seats FULL** | `--color-status-full-bg` | `1px solid #FECACA` | `--color-status-full-text` | 6px dot: `--color-status-full-dot` |
| **Waitlist Active** | `--color-status-wait-bg` | `1px solid #FDE68A` | `--color-status-wait-text` | 6px dot: `--color-status-wait-dot` |
| **Prereq MET** | `--color-status-open-bg` | None | `--color-status-open-text` | Checkmark icon |
| **Prereq MISSING**| `--color-status-full-bg` | None | `--color-status-full-text` | Alert triangle icon |

### 6.3 Timetable Course Blocks (Dual Form Factors)

Timetable course items are implemented in two distinct form factors depending on viewport and display context:

#### Variant A: In-Grid Calendar Cells (Desktop 5-Day Matrix — Primary Source of Truth)
Used inside the hourly day columns of Screen 2 (`Weekly Timetable Grid`). Full enclosing border defines time slot boundaries.
* **Dimensions**: Width = `88px`–`100px`, Height = `96px` (proportional to class duration), Radius = `--radius-sm` (6px), Padding = `8px`.
* **Layout**: Vertical Flex Column with `justifyContent: space-between` across 3 lines:
  * Line 1: Course Code & Section (Bold 11px)
  * Line 2: Room & State Label (Medium 10px)
  * Line 3: Time Interval (Regular 9.5px)

| State | Background Fill | Enclosing Border | Primary Text | Secondary Text |
|---|---|---|---|---|
| **Enrolled** | `--color-timetable-enrolled-bg` (`#EFF6FF`) | `1px solid #3B82F6` | `--color-timetable-enrolled-text` (`#1D4ED8`) | `#2563EB` |
| **Staged in Cart** | `--color-timetable-staged-bg` (`#F5F3FF`) | `1px dashed #8B5CF6` | `--color-timetable-staged-text` (`#6D28D9`) | `#7C3AED` |
| **Conflict / Clash** | `--color-timetable-clash-bg` (`#FEF2F2`) | `1px solid #DC2626` | `--color-timetable-clash-text` (`#991B1B`) | `#991B1B` + ⚠️ |

#### Variant B: Agenda List Cards (Mobile & Expanded Views)
Used for single-column mobile chronological agendas and modal schedule summaries.
* **Dimensions**: Width = `Fill container` (`280px`–`360px`), Height = `96px`–`100px`, Radius = `--radius-md` (8px).
* **Layout**: Horizontal Flex Row with a 4–5px solid left accent bar + internal column body (Tag Badge, Bold Title, Room/Time Subtitle).

| State | Background Fill | Left Accent Bar | Border | Tag Pill |
|---|---|---|---|---|
| **Enrolled** | `#EFF6FF` | `4px solid #3B82F6` | `1px solid #BFDBFE` | `CONFIRMED ENROLLED` (`#DBEAFE`) |
| **Staged in Cart** | `#F5F3FF` | `4px dashed #8B5CF6` | `1px dashed #DDD6FE` | `STAGED IN CART` (`#EDE9FE`) |
| **Conflict / Clash** | `#FEF2F2` | `4px solid #DC2626` | `1px solid #FECACA` | `⚠️ CLASH COLLISION` (`#FEE2E2`) |

---

## 7. Overlays, Modals & Notification Ergonomics

### 7.1 Destructive Action Safeguard (Drop Course Modal)

Dropping an enrolled seat is a critical irreversible action requiring an explicit two-button confirmation dialog.

```text
+--------------------------------------------------------------------+
| MODAL SCRIM OVERLAY (Full Canvas, Fill: rgba(15, 23, 42, 0.55))     |
|                                                                    |
|    +----------------------------------------------------------+    |
|    | CONFIRM COURSE DROP                              [ ✕ ]   |    |
|    +----------------------------------------------------------+    |
|    | Are you sure you want to drop:                           |    |
|    |                                                          |    |
|    | CS201 • Data Structures and Algorithms (Section 01)      |    |
|    |                                                          |    |
|    | ⚠️ Warning: Your seat will immediately be released to   |    |
|    | students waiting in the queue. You cannot undo this.     |    |
|    +----------------------------------------------------------+    |
|    | Actions: [ Keep My Seat ]        [ 🗑️ Yes, Drop Course ] |    |
|    +----------------------------------------------------------+    |
|                                                                    |
+--------------------------------------------------------------------+
```

* **Penpot Layout Spec**:
  * Scrim Frame: Width = `100%`, Height = `100%`, Position = `Absolute`, Fill = `--elevation-scrim`, Align = `Center`, Justify = `Center`.
  * Dialog Card: Width = `480px`, Direction = `Column`, Gap = `16px`, Padding = `24px`, Fill = `--color-surface-card`, Radius = `--radius-lg`, Shadow = `--elevation-high`.
  * Button Group: Direction = `Row`, Justify = `Flex End`, Gap = `12px`.
    * Secondary: `[ Keep My Seat ]` (Neutral gray outline).
    * Destructive Primary: `[ Yes, Drop Course ]` (Solid red fill).

---

### 7.2 Toast Notification Matrix

Toasts float in the top-right corner of the canvas: Position = `Absolute (top: 24px, right: 24px)`, Gap = `8px`.  
Each toast card: Width = `360px`, Padding = `12px 16px`, Radius = `--radius-md`, Shadow = `--elevation-mid`.

```text
+------------------------------------------------------------------+
| [✓] ENROLLMENT SUCCESSFUL                                  [✕]   |
| Successfully registered for CS301 Section 01 (3 Credits).        |
+------------------------------------------------------------------+
| [⚠️] TIMETABLE CONFLICT DETECTED                           [✕]   |
| CS302 overlaps with CS304 on Monday 14:30. Resolve in cart.      |
+------------------------------------------------------------------+
| [⏱️] WAITLIST OFFER AVAILABLE                              [✕]   |
| A seat opened for CS301 Sec 02! Claim within 24 hours.           |
+------------------------------------------------------------------+
```

| Type | Left Border | Icon | Background | Title Text |
|---|---|---|---|---|
| **Success** | `4px solid #10B981` | Green Check | `#FFFFFF` | `--color-text-primary` |
| **Warning** | `4px solid #F59E0B` | Amber Alert | `#FFFFFF` | `--color-text-primary` |
| **Danger / Clash** | `4px solid #EF4444` | Red Exclamation | `#FFFFFF` | `--color-text-primary` |
| **Info / Waitlist** | `4px solid #FF5722` | Orange Clock | `#FFFFFF` | `--color-text-primary` |

---

### 7.3 Mid-Flight Seat Depletion Safeguard (Checkout Conflict Dialog)

When a staged section reaches capacity while a checkout transaction is in flight, the UI triggers an immediate recovery dialog to prevent silent failure, cart discard, or transaction ambiguity.

```text
+--------------------------------------------------------------------+
| MODAL SCRIM OVERLAY (Full Canvas, Fill: rgba(15, 23, 42, 0.55))    |
|                                                                    |
|    +----------------------------------------------------------+    |
|    | 🔴 REGISTRATION FAILED: SEAT DEPLETED            [ ✕ ]   |    |
|    +----------------------------------------------------------+    |
|    | ⚠️ While submitting, the final seat in CS301 Sec 01 was  |    |
|    |    claimed. Other courses in your cart were rolled back. |    |
|    |                                                          |    |
|    | Depleted Section:                                        |    |
|    | [ CS301 • Software Design & Architecture (Sec 01)        |    |
|    |   Dr. Veera B. | Mon, Wed 09:00-10:30        [FULL 🔴] ] |    |
|    |                                                          |    |
|    | Resolution Options:                                      |    |
|    | [ 🕒 Join Waitlist (Queue Position #1) ]  (Primary CTA)  |    |
|    | [ 🔁 Switch to Sec 02 & Re-submit ]       (If Available) |    |
|    | [ ⏩ Drop CS301 & Enroll Remaining (15 Cr) ]             |    |
|    +----------------------------------------------------------+    |
|    | [ Return to Cart to Review ] (Ghost / Cancel)            |    |
|    +----------------------------------------------------------+    |
|                                                                    |
+--------------------------------------------------------------------+
```

* **Defensive Ergonomics**:
  * **Dismiss Guarantee**: Clicking `[ ✕ ]` or `[ Return to Cart to Review ]` preserves the full cart, marking the depleted section as `FULL 🔴` for manual resolution.
  * **Conditional Alternative**: The `[ Switch to Sec 02 ]` option only appears if an alternate section is open and timetable-compatible with the rest of the cart.
* **Penpot Layout Spec**:
  * **Scrim Frame**: Width = `100%`, Height = `100%`, Fill = `--elevation-scrim`, Align = `Center`, Justify = `Center`.
  * **Dialog Card**: Width = `520px`, Direction = `Column`, Gap = `16px`, Padding = `24px`, Fill = `--color-surface-card`, Radius = `--radius-lg`, Shadow = `--elevation-high`.
  * **Alert Box**: Background = `#FEF2F2`, Border = `1px solid #FCA5A5`, Border-Left = `4px solid #EF4444`, Padding = `12px 14px`, Radius = `6px`.
  * **Action Stack**: Direction = `Column`, Gap = `10px`, Width = `Fill container`.
    * Primary CTA: Solid `#FF5722` fill, White text, Height = `42px`, Radius = `--radius-sm`.
    * Secondary Action: White fill, `1px solid #CBD5E1`, Text = `#0F172A`, Height = `40px`, Radius = `--radius-sm`.
    * Tertiary Action: `#F8FAFC` fill, `1px solid #E2E8F0`, Text = `#0F172A`, Height = `40px`, Radius = `--radius-sm`.
    * Ghost Action: Transparent, Text = `#64748B`, Align = `Center`, Height = `32px`.

