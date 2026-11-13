# Animation Patterns and Coverage

Companion to [AGENTS.md](AGENTS.md). Use its libraries, easing curves, general durations, and guardrails. This file defines what to animate and when.

## 1. Coverage rule

| Trigger | Applies to | Default |
| --- | --- | --- |
| Load / enter | Text, sections, cards, images, media | Entrance preset |
| Click / tap / press | Buttons, links, cards, toggles, icons | Press feedback |
| Focus | Inputs, selects, focusable controls | Focus state transition |
| State change | Loading, success, error, toggle on/off | State preset |
| Navigation | Route, page, modal, view changes | Navigation preset |

- Reuse the presets below for every applicable trigger.
- Keep decorative motion only when it communicates a state, a direction, or brand identity. If removing it would have no impact on usability or comprehension, apply this test before keeping it.
- Animate each element once on entry. Replay on subsequent scroll passes only when requested.
- Animate above-the-fold elements on page load. Trigger below-the-fold entrances on viewport entry.
- Keep essential content readable and interactions available throughout.

## 2. Pointer vs touch

- Provide press feedback on touch and pointer devices.
- Gate hover effects behind `@media (hover: hover)` or equivalent.

## 3. Entrance presets

| Preset | Use | Motion | Duration | Stagger |
| --- | --- | --- | --- | --- |
| `text-reveal` | Headings, paragraphs | Opacity 0→1 and translateY 24px→0. Split by line, or by word for short headings. | 600 ms | 60 ms per line, 40 ms per word |
| `section-enter` | Page sections | Opacity 0→1 and translateY 32px→0 | 700 ms | 80 ms between children |
| `element-enter` | Cards, images, list items | Opacity 0→1 and translateY 16px→0, optionally scale .96→1 | 500 ms | 60–80 ms |
| `hero-enter` | Hero or key visual | Same as `section-enter` with dramatic easing | 800–1000 ms | 100 ms |

Use the standard reveal curve by default. Reserve dramatic easing for `hero-enter`.

## 4. Interaction and state presets

| Preset | Use | Motion | Duration |
| --- | --- | --- | --- |
| `press` | Buttons, cards, tappable items | Scale .97 on press and return to 1 on release | 120 ms down, 200 ms up |
| `hover` | Buttons, links, cards on pointer devices | Lift 2 px or shift color | 200 ms |
| `toggle` | Switches, checkboxes | Ease between states | 200 ms |
| `focus` | Inputs and controls | Ease border or outline color, optionally shift the label | 150–200 ms |
| `icon-state` | Icons that change meaning | Rotate, morph, or crossfade | 200–300 ms |
| `loading` | Noticeable waits | Immediately show a spinner, skeleton, or progress. Keep the brand visible on branded loaders. | Until done |
| `success` | Completed actions | Subtle for saves, more expressive for major submissions or payments | 300–1000 ms |
| `error` | Failures, 404s, validation | Small shake or fade with a clear message and next step | At most 600 ms |

## 5. Navigation presets

- Forward in a flow uses a horizontal push. Back reverses the push.
- Modals, overlays, and sheets slide up and reverse on close.
- Tabs and unrelated views fade in place.
- List item to detail uses a shared-element transition when feasible, with a push as the fallback.

## 6. Launch, onboarding, and login

- Keep launch and splash motion under two seconds and visually consistent with the app.
- Use onboarding motion to show value and guide attention through steps.
- Keep login motion subtle and on-brand, with immediate access to credential fields.
- Animate the logo or brand assets lightly at recurring touchpoints such as launch, loading, and success.

## 7. Implementation

- Prevent flashes while keeping content visible if JavaScript or animation fails.
- Animate transform and opacity for movement. Use the color transitions specified by the hover and focus presets for visual state feedback. Prefer SVG or CSS to video for icons and small effects.
- Define presets once in shared code or tokens. Extend the shared set if a new case needs a different preset.
- Kill timelines and ScrollTriggers on unmount or route change.
