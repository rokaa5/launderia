# Launderia — connected student prototype

Ionic + Angular frontend with the approved pastel palette, original garment illustrations, customer bookings and a separate branch administration workspace.

## Run

    npm install
    npm start

Open http://127.0.0.1:4200. The retained static preview may also run at http://127.0.0.1:4202.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@launderia.demo | Admin123! |
| Customer | customer@launderia.demo | Customer123! |

The login page also has demo buttons.

## Customer

- Browse currently available services and prices.
- Select multiple services in one order, with separate weights/piece/load quantities.
- Review line subtotals, combined estimate, drop-off date and notes before placing a demo order.
- View active orders, progress, detailed line items and history.
- Cancel an order while its status is Received.
- Edit the name on the account for this visit.

## Admin

- Dedicated workspace without customer marketing navigation or footer.
- Completed revenue, non-cancelled order value, average order value, customer counts and workload.
- All-data, last-7-day and last-30-day filters; daily chart and service breakdown.
- Add/edit service names, descriptions, rates, units, illustration, color and availability.
- Pause services without destroying order history.
- Search/filter orders, inspect details and advance washing/drying/pickup status.

## Data and limits

Services and orders save in this browser's localStorage under `launderia-demo-v1`. Existing single-service records migrate to one-line orders. Booking stores rates and subtotals so subsequent price changes never alter old order totals. Refreshing signs the user out; use a demo account to return.

Signup credentials stay in memory only and are cleared on refresh. Use made-up details. This is frontend-only authentication, not a security boundary. No real payments, appointments, messages or notifications occur. All seed prices and branch details are illustrative and must be verified before actual use.

Model code: `src/app/laundry.ts`. Account demo: `src/app/demo.ts`. Screen behavior: `src/app/app.component.ts`. Screen markup: `src/app/app.component.html`. Shared styling: `src/styles.css`.

## Verify

    npm test
    npm run build

Motion: buttons have press feedback, service checkboxes acknowledge selection, dialogs animate in/out, tabs fade gently, and successful orders show an animated confirmation. Reduced-motion preferences and keyboard interactions skip movement. No extra animation package is installed.

## Empty-start update
All pre-existing demo orders are removed once when old browser data (version 1) loads. Service definitions and prices are preserved. New version 2 orders persist normally and appear in admin analysis. Demo customer/admin credentials are unchanged. Open tabs in the same browser synchronize service/order updates through storage events. There is no cross-device server synchronization.

Navigation motion uses a shared Angular directive and the browser animation API: 240ms page fade/upward entrance and 160ms dashboard-tab fade. It cancels pending/active animations during rapid navigation and skips motion for keyboard input or reduced-motion preferences. Section links wait for the destination to render before smooth scrolling; no fixed navigation timeout remains.
