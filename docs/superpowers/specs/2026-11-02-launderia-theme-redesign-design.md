# Launderia theme, layout, and modal redesign

Status: approved by the user and implemented. Branch: `David`.

## Intent

Redesign the full Launderia interface around the supplied visual reference: cheerful blue, warm ivory, tea green, vanilla, and rounded typography. Replace every browser alert and confirmation with a consistent in-app popup modal. Keep the Launderia identity and existing customer and administrator workflows.

## Approach

Use the existing Angular/Ionic application and its built-in modal support. Rebuild the screen templates and styling together, with shared theme tokens and one reusable modal presentation. This keeps the redesign coherent across all screens while preserving the current services, prices, accounts, order records, and storage keys.

A palette-only change would leave the requested layout redesign incomplete. A framework replacement would add migration work with no benefit to this request. The recommended approach is a full layout redesign within the current stack.

## Visual direction

| Role | Reference value | Application |
| --- | --- | --- |
| Tea green | `#c8d69b` | Secondary panels, gentle highlights, positive states |
| Vanilla | `#f6e6a5` | Price summaries, useful reminders, accent illustrations |
| Celtic blue | `#3971b8` | Main actions, navigation, prominent brand sections |
| Ivory | `#fbfcee` | Main background and modal surfaces |
| Dark brown/olive | `#343b1b` | Main text and high-contrast labels |

Use Poppins for substantial headings and readable controls; use Comfortaa for the softer supporting copy and brand details. Load the fonts once, with system fallbacks. Use generous spacing, softly rounded panels, strong typographic hierarchy, and simple laundry-themed line illustrations. Retain the Launderia name; adapt the reference's visual language to laundry.

Check text and button contrast in the implemented combinations; use dark text on green and vanilla. Allow a darker blue shade where needed for readable small text or button contrast. Keep focus indicators visible.

## Layout by screen

- **Welcome:** a two-column composition with a large blue laundry illustration/brand panel beside the account choices. Make Customer the main action and Administrator a quieter secondary path. Add a compact service-price strip using the real service data.
- **Login and signup:** carry the blue brand panel alongside an ivory form panel. Use clear labels, comfortable input spacing, and obvious back navigation. Stack panels on phones.
- **Signed-in shell:** use a persistent desktop navigation rail, a compact top bar for page title and account identity, and a wider main work area. On phones, use a compact header and accessible, clearly labeled navigation that fits the viewport.
- **Customer dashboard:** lead with a greeting and Place an order action, followed by useful order totals, a clear order-status list, and transaction history. Make empty states actionable. Preserve loyalty points.
- **Administrator dashboard:** lead with business totals, then monthly revenue, pending payments, and customer records. Keep the sales chart's underlying real data and readable labels.
- **Services:** use a spacious service list with clear names, descriptions, units, prices, and selection actions. Include all five existing services.
- **Estimator:** use a service and quantity area beside a clearly separated vanilla order summary. On phones, show the summary below the controls. Keep calculations and service selection unchanged.
- **Order management:** use a clear order-creation panel and a larger searchable order workspace. Make status, payment method, paid state, and deletion controls easy to distinguish. Stack the areas on small screens.
- **Home:** use the reference palette for an expressive laundry introduction and a real service-price section; retain the existing navigation actions.

## Popup behavior

Replace all 15 `alert()` calls and both `confirm()` calls in `home.page.ts`.

- Use one themed Ionic modal presentation for validation errors, success messages, and confirmations. Give it a clear title, message, and appropriately named actions.
- Customer order confirmation shows service, quantity, unit, and estimated total. The order is saved only after an explicit confirm action. Cancel, Escape, and dismiss leave orders unchanged.
- Order deletion requires explicit confirmation; cancelling or dismissing preserves the order.
- Confirmed actions run once. Repeated clicks cannot create duplicate orders or repeat a pending action.
- Success messages appear after the operation succeeds. Error messages leave entered form values available to correct.
- Use accessible dialog naming, visible keyboard focus, focus containment, Escape dismissal, and sensible focus restoration. Make the dialog scroll on short screens and give buttons comfortable touch targets.
- Preserve localStorage data and existing authentication behavior; “local alerts” means browser popup APIs, not removal of local storage.

## Files and scope

- Redesign `launderia/src/app/home/home.page.html` and `home.page.scss`.
- Update `home.page.ts` for shared modal state, dismissal, and confirmation actions.
- Update `launderia/src/theme/variables.scss` and `src/global.scss` for theme tokens, shared styling, and consistent light appearance.
- Update `launderia/src/index.html` for the font loading, page identity, and usable viewport behavior.
- Add meaningful modal regression tests in `home.page.spec.ts`; extract a modal component only if the implementation needs that boundary.
- Keep changes on the existing `David` branch. Preserve the pre-existing untracked `AGENTS.md`. Do not commit or push as part of this request.
- Keep existing dependencies and production build budgets. This work does not add a backend or change the account/storage model.

## Verification

1. Establish the current lint, unit-test, and production-build results.
2. Write failing tests for confirmation versus cancellation, deletion safety, validation feedback, and one-time confirmed actions before implementing the modal behavior.
3. Run `npm.cmd run lint`, `npm.cmd test -- --watch=false`, and `npm.cmd run build` from `launderia/`. Report actual failures, including existing ones.
4. Inspect the redesigned welcome, login, signup, customer, admin, services, estimator, and order screens in a browser at desktop and phone widths.
5. Exercise valid and invalid forms, order confirmation/cancellation, deletion confirmation/cancellation, modal keyboard dismissal, and narrow-screen navigation.
6. Confirm no browser alert/confirm calls remain and review the final diff for unrelated changes.

### Baseline observed before implementation

- `npm.cmd test -- --watch=false`: passed, 2 tests in 2 files.
- `npm.cmd run lint`: failed with 30 existing template control-flow errors in `home.page.html`. Use Angular's current `@if` and `@for` syntax in the redesigned template to address these touched-file errors.
- `npm.cmd run build`: failed because the existing component-level Google Fonts import expands to 15.53 kB, exceeding the 4 kB component style error budget. Move the replacement font loading out of component styles; retain the current build limits.
- Test and build commands also report the existing Browserslist configuration includes unsupported old browser versions. Record this warning; a browser support policy change is outside this redesign.

## Decisions delegated to implementation

Exact spacing, illustration details, navigation icons, modal component boundaries, and breakpoint values can be selected to fit the existing app. The reference palette, font families, full-screen scope, modal safety behavior, and `David` branch are fixed requirements.
