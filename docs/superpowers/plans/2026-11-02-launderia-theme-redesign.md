# Launderia redesign implementation plan

> **For agentic workers:** Use `executing-plans` to implement this plan in the current session. The user approved implementation of the design on `David`; continue without another approval round.

**Goal:** Apply the supplied palette and typography across a redesigned Launderia interface, replacing browser dialogs with accessible themed modals.
**Architecture:** Keep existing Angular/Ionic modules and business data. Share theme tokens and a small feedback modal component; parent-owned pending actions enforce confirmation safety. Separate the substantial home-screen styles from small component host styles to respect existing component budgets.
**Tech stack:** Angular 22, Ionic 9, TypeScript, SCSS, Vitest/jsdom.
**Spec:** `docs/superpowers/specs/2026-11-02-launderia-theme-redesign-design.md` (approved by user).

## Global constraints

- Work on existing `David`; preserve untracked `AGENTS.md`; do not commit or push.
- Palette: tea green `#c8d69b`, vanilla `#f6e6a5`, blue `#3971b8`, ivory `#fbfcee`, dark olive `#343b1b`.
- Use Poppins and Comfortaa. Keep current dependencies, services/prices, storage keys, authentication, and build budgets.
- No browser `alert()` or `confirm()` calls remain.

## Review focus

- Dismissal and repeated confirmation cannot mutate orders unexpectedly.
- Confirmation summaries match the order actually saved.
- Success and error content stays readable in short or narrow viewports.
- Keyboard focus remains inside the modal and returns sensibly after dismissal.
- Every customer/admin page remains reachable and usable on phones.

### Task 1: Replace browser dialogs

**Files:** `home.page.ts`, `home.page.spec.ts`, `home.module.ts`; add `feedback-modal.component.{ts,html,scss}` beside the home page.
**Interfaces:** Parent exposes `feedback: FeedbackMessage | null`, `confirmFeedback(): void`, and `dismissFeedback(): void`. Modal consumes feedback and emits confirmed/closed events. Feedback has kind, title, message, optional details and confirm label. Pending callbacks remain private to HomePage.

- [x] Write tests for validation feedback, successful signup/admin orders, order summary, cancellation, one-time confirmation, saved confirmation snapshots, and confirmed/cancelled deletion.
- [x] Run `npm.cmd test -- --watch=false`; observe failures for missing modal state/behavior.
- [x] Implement feedback modal and replace every native popup. Preserve existing validation and storage behavior.
- [x] Run the whole suite; expect all tests green.

### Task 2: Redesign all screens and shared theme

**Files:** `home.page.html`, `home.page.scss`, `src/theme/variables.scss`, `src/global.scss`, `src/index.html`; add `src/theme/launderia.scss` and a local laundry illustration if useful.
**Interfaces:** Keep HomePage's existing form bindings/navigation; use feedback component from Task 1. Use current `@if`/`@for` syntax throughout the rewritten template.

- [x] Apply global palette and fonts, light theme, usable zoom, safe-area spacing, visible focus and touch feedback.
- [x] Build welcome/auth split layouts, desktop navigation rail/mobile navigation, customer/admin dashboards, home, services, estimator, and order management.
- [x] Use real service/order data; responsive empty states and accessible chart labels.
- [x] Run lint, full tests, and production build; expect zero errors without increasing budgets.

### Task 3: Browser verification and final review

**Files:** Review all changed files; record results in the execution ledger.
**Interfaces:** Existing customer/admin demos and real UI interactions.

- [x] Start the local app and inspect desktop and phone layouts.
- [x] Exercise login/signup validation, customer ordering/cancellation, admin order creation/status/payment/deletion, navigation, and modal keyboard dismissal.
- [x] Run final checks and inspect the diff; get one fresh review of the completed changes and fix material findings.
- [x] Leave changes uncommitted on `David`; report checks and any real-device limitation.
