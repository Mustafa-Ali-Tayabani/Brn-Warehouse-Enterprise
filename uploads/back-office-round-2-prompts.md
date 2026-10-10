# Retail ERP — Round 2 prompts (filters, reporting, Zebra scanning)

Paste Prompt A into the existing "Retail ERP - Back office" project in Claude Design.
Paste Prompt B as a new design in the same project, so it reuses erp-core.js and the seed data.
Attach the build plan to both.

---

## Prompt A: Back office upgrade

```text
Upgrade "Retail ERP - Back office". Keep every existing screen, the
seed data, the visual style and Flows 1 to 3 working. Add the following.

1. FIXES
- Dashboard: the payables chip reads "1overdue"; add the space.
  "KWD 601.379" wraps onto two lines in its tile; keep it on one line.
- PO-2026-0129 shows KWD 163.484 on the PO list but its invoice shows
  KWD 163.836. Show a small "rate locked at receipt, <date>" note on
  received POs and their invoices so the two figures are explained,
  or make them match.
- Vendor names are cut off in the PO and invoice tables; let the
  column grow or wrap to two lines.

2. ONE SHARED TABLE TOOLBAR ON EVERY LIST
Apply the same toolbar to: Items, Purchase orders, Goods receipts,
Vendors, Transfers, Stock counts, Write-offs, Supplier invoices,
Ledger journal, Users.
- Search box (matches number, name, SKU, barcode, vendor).
- Filter chips with a "Filters" popover. Per screen:
  Items: category, stock pool, stock state (in stock / low / out),
    vendor, active, price range.
  Purchase orders: status, vendor, currency, destination pool,
    ordered date range, ETA overdue.
  Goods receipts: PO, pool, date range, received by.
  Transfers: status, from, to, date range.
  Stock counts: location, status, has variance.
  Write-offs: reason, pool, date range, entered by.
  Supplier invoices: status, vendor, currency, due date range,
    overdue only.
  Ledger: account, account type, reference type, date range.
- Date range control with presets: Today, Last 7 days, Last 30 days,
  Month to date, Custom.
- Click a column header to sort; second click reverses; show an arrow.
- Active filters shown as removable chips, with "Clear all".
- Result count and a totals row for money and quantity columns.
- Pagination at 25 rows with a rows-per-page selector.
- "Export CSV" (downloads the filtered rows) and "Print" (clean
  print layout with the store name, report title, filters and date).
- Saved views: "Save view" stores the current filters under a name
  in the toolbar for the session.
- The top-bar location switcher keeps filtering every screen.

3. REPORTS SECTION
Add a "Reports" group to the sidebar with a Reports home page that
lists every report as a card. Each report has the shared toolbar
(date range, pool, category, vendor), a summary strip, one chart,
a table, Export CSV and Print. Reports:
- Stock on hand and valuation: by pool, category and item, at
  average cost.
- Stock movement: opening, received, transferred in, transferred
  out, sold, written off, closing, per item for the period.
- Low stock and reorder: items below the reorder point per pool,
  suggested order quantity, last vendor and last cost.
- Stock ageing and slow movers: days since last sale or receipt,
  in buckets 0-30, 31-60, 61-90, 90+.
- Purchasing: spend by vendor and by currency, in KWD.
- Landed cost: per PO, goods, freight, duty, landed cost per unit,
  and landed cost against selling price margin.
- Vendor performance: on-time receipt, short receipts, average lead
  time in days.
- Payables ageing: Current, 1-30, 31-60, 61-90, 90+ by vendor.
- Exchange rate impact: KWD value of open POs at order rate against
  today's rate.
- Count variance: by count, location and item, in units and KWD.
- Shrinkage (existing): add a trend by week and a top-10 items table.
- Sales summary (read-only, from seed POS sales): by day, category
  and payment method, for the Main Store.
- Trial balance and a simple profit and loss for the period.
- Audit log: who did what and when, filter by user, action, date.
Extend the seed data just enough for these to look real: about 60
days of movements and sales.

4. DASHBOARD
- Add a date range and make the tiles respond to it.
- Add a 30-day stock value trend, purchases against sales by week,
  and top 5 sellers and top 5 slow movers.
- Every tile and chart links to its report with the same filters.

5. ZEBRA SCANNER SUPPORT (WEB)
Real Zebra scanners and Zebra handhelds send a barcode as fast
keystrokes followed by Enter. Support that properly:
- Add a global scan listener: characters arriving faster than 30 ms
  apart and ending in Enter are treated as a scan from anywhere in
  the app, with no need to click into a field first. Normal typing
  is not affected.
- Show a "Scanner ready" indicator in the top bar. It flashes green
  with the scanned code on a good scan and red with a short beep on
  an unknown barcode.
- A scan is routed by the current screen:
  Goods receipt: adds 1 to that line (existing behaviour).
  Transfer receive: adds 1 to that line.
  Stock count: adds 1 to counted quantity for that item.
  Write-offs: selects the item.
  Barcode labels: adds the item to the label sheet.
  Item list or anywhere else: opens that item's detail.
- Scanning a document barcode (PO-, TRF-, CNT-, GRN-, INV- in
  Code 128) opens that document.
- Add Admin > Devices: a list of scanners and handhelds (name,
  model, assigned location, assigned user, last seen, battery,
  status), a "Test scan" box that shows the raw data and symbology
  it received, and settings for scan suffix (Enter or Tab), beep
  on or off, and continuous count mode.
- Keep the on-screen Scan button so it can be demoed with no
  hardware.
- Barcode labels: add a label size selector (50 x 25 mm,
  40 x 30 mm, A4 sheet) and a "Send to Zebra label printer" action
  that previews the label; printing itself is simulated.

Done when Flows 1 to 3 still run end to end, every list filters,
sorts and exports, every report opens with data, and plugging in a
USB or Bluetooth scanner in keyboard mode works on Goods receipt,
Transfer receive and Stock count without clicking a field.
```

---

## Prompt B: Warehouse handheld app (Zebra mobile computer)

```text
Using Claude Design and the same brn dynamics style, tokens and
erp-core.js seed data as "Retail ERP - Back office", create a new
design called "Retail ERP - Handheld".

It is the staff app for a Zebra Android mobile computer with a
built-in scanner and hardware scan trigger. Portrait, 360 x 720,
56 px minimum touch targets, high contrast, large numbers, usable
with one thumb and with gloves. English interface, Arabic item
descriptions shown under the English name.

Scanning: the device sends each barcode as keystrokes plus Enter.
Use the same global scan listener as the back office, so a scan is
accepted on any screen without tapping a field. Also show a large
on-screen "Scan" button that simulates a scan for demos, and an
optional camera-scan button as a fallback for ordinary phones.
Every scan gives a clear result: green flash and item name on
success, red flash, beep and "Unknown barcode" on failure.

Screens:
1. Sign in: PIN pad, pick location (Main Store or Online
   Warehouse). The chosen pool tag stays in the header on every
   screen.
2. Home: big tiles for Receive, Transfer, Count, Write-off, Item
   lookup, Pick orders, with a badge for open work on each.
3. Receive: list of open POs for this location; open one, scan
   items, received quantity counts up against ordered, over-scan
   warning, manual quantity keypad, post receipt.
4. Transfer out: choose destination, scan items, confirm the
   isolation warning, send.
5. Transfer in: list of transfers in transit, scan to receive,
   flag short quantities.
6. Stock count: start or continue a count, scan repeatedly to
   count up, edit quantity, see variance only after submit.
7. Write-off: scan item, quantity, reason (Damaged, Opened pack,
   Theft), note, optional photo, submit.
8. Item lookup: scan any item to see name, Arabic description,
   price, stock in both pools with tags, last movements, and a
   "Print label" action.
9. Pick orders (Phase 2): list of online orders to pick, scan each
   line, short-pick flag, mark packed.
10. Activity: today's scans and documents by this user.
11. Settings: device name and model, scanner status, test scan,
    beep and vibrate, sync status.

Offline: show a "Working offline, 3 scans queued" banner state and
a sync action, because warehouses have weak signal. Simulated only.

Use the same statuses, document prefixes, KWD three-decimal format
and stock-pool tags as the back office. In-memory state, plus a
Reset demo data control in Settings.

Done when a user can sign in, receive two lines of a PO, receive a
transfer, count three items, log one write-off and look up an item,
using only scans and large buttons.
```

---

## Notes on real Zebra hardware (for the build after the prototype)

- Zebra Android mobile computers ship with DataWedge, which sends
  scans to any app either as keystrokes or as Android intents. The
  prototype uses the keystroke method, so it can be opened in Chrome
  on a real Zebra device and scanned into today. The production
  mobile app should switch to the intent method, which is faster and
  also reports the barcode type.
- Zebra handheld USB and Bluetooth scanners behave as a keyboard on
  a PC, so the web back office needs no driver.
- Zebra label printers use the ZPL language; real label printing is
  a production task, simulated here.
- Confirm with the client: exact device models, whether the handheld
  is a Zebra mobile computer or a phone with a paired scanner, and
  whether label printers are in scope.
