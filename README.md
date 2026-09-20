# 🏋️‍♂️ Spotter — Frontend

> **Your intelligent AI fitness, nutrition, and training companion.**  
> Spotter combines personalized workout scheduling, macro-targeted meal planning, biometrics progress tracking, and an interactive mascot companion (**Bit**) into a fast, fluid web application.

---

## ✨ Features at a Glance

### 🧠 Intelligent AI Plan Generation
- **Readiness-First Architecture**: Inspects health clearance, equipment access, dietary preferences, and target calibrations before generating plans.
- **Inline Question Drawers**: Answer missing prerequisites (injuries, training style, calories) directly inside modal drawers without losing flow.
- **Full Schedule Delivery**: Produces synchronized 7-day workout prescriptions and meal suggestions adaptable over any date range.

### 🏋️ Workouts & Training Management
- **Prescription Logging**: Seamlessly launch live workout sessions directly from your active plan.
- **Active Workout Mode**: Track sets, weights, reps, and completion statuses in real-time.
- **Workout Library & History**: Revisit previous training sessions, review volumes, and track personal records.

### 🥗 Nutrition & Macro Engine
- **Target Tracking**: Daily calorie, protein, carbohydrate, and fat targets dynamically aligned with your fitness goals.
- **Plan-Driven Meals**: Log suggested breakfasts, lunches, dinners, and snacks directly to your daily ledger with one click.
- **Recipe Catalog**: Explore macro-balanced recipes with ingredient lists and step-by-step cooking instructions.

### 📊 Daily Summary & Check-Ins
- **Unified Daily Dashboard**: Real-time snapshot of training completions, caloric intake, and hydration.
- **Progress Tracking**: Periodic check-in dialogs for body weight, measurements, progress photos, and subjective fatigue.
- **Goal Milestones**: Set active goals (hypertrophy, fat loss, maintenance, strength) and visualize progression.

### 👾 Bit — The Spotter Companion
- **Expressive Character States**: Responsive visual mascot reflecting your current state (`idle`, `thinking`, `aiCoach`, `celebrating`, `letsGo`, `victory`).
- **Engaging Micro-Animations**: Smooth transitions powered by GSAP.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework & Build** | [React 18](https://react.dev/), [Vite](https://vitejs.dev/) |
| **Data Fetching & Caching** | [TanStack React Query v5](https://tanstack.com/query/latest) |
| **Client State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Styling** | Vanilla CSS + CSS Modules *(Zero runtime CSS bloat, custom design tokens)* |
| **Animation** | [GSAP](https://greensock.com/gsap/) + `@gsap/react` |
| **Testing** | [Vitest](https://vitest.dev/), Testing Library, [MSW (Mock Service Worker)](https://mswjs.io/) |

---

## 📁 Project Structure

```text
src/
├── api/                # Axios instance, interceptors, and error normalizer
├── assets/             # Brand graphics, mascot webp assets, and icons
├── components/         # Shared UI components (Toast, BitCharacter, Dialogs, Inputs)
├── features/           # Domain-driven modular features
│   ├── auth/           # Login, registration, token refresh, and guest guard
│   ├── daily-summary/  # Aggregated daily metrics and query invalidation helpers
│   ├── goals/          # Fitness objective forms, targets, and active goal cards
│   ├── nutrition/      # Meal logging, food search, macro calculators
│   ├── onboarding/     # First-time user setup questionnaires
│   ├── plans/          # AI plan generation, readiness checks, calendar schedules
│   ├── profile/        # Health, training, nutrition, and body profile editors
│   ├── progress/       # Check-in modals, weight charts, milestone graphs
│   └── training/       # Workout player, exercise picker, volume history
├── hooks/              # Reusable React hooks (debounce, media queries, local storage)
├── layouts/            # App shell, navigation sidebar, landing layout
├── pages/              # Top-level view routes (Dashboard, Training, Meals, Plans)
├── stores/             # Global stores (authStore, uiStore)
└── styles/             # Global tokens, resets, and typography
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `18.x` or higher
- **npm** or **pnpm**
- Running instance of the **Spotter Backend** (default: `http://localhost:3000`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nooribrahim06/Spotter-front-end.git
   cd Spotter-front-end
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory (or edit the existing one):
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Bundles and minifies production assets into `dist/` |
| `npm run preview` | Serves the production build locally for verification |
| `npm run test` | Runs the Vitest test suite once |
| `npm run test:watch` | Starts Vitest in interactive watch mode |

---

## 🎨 Design System & Aesthetics

Spotter adheres to a tailored aesthetic defined by:
- **Palette**: Deep Ink (`#193b3d`), Soft Sage (`#afc69a`), Vibrant Coral (`#f0785e`), Warm Mist (`#e6f0f3`), and Clean Canvas (`#f7f6f2`).
- **Typography**: Crisp typographic hierarchy with tabular numerals for macro/rep clarity.
- **Micro-interactions**: Subtle elevation changes, spring transitions on CTAs, and contextual mascot feedback.
- **Accessibility**: High-contrast states, full keyboard navigation with visible focus rings, and screen-reader announcements on dynamic mutations.

---

## 📄 License

This project is private and developed as part of the Spotter platform. All rights reserved.
