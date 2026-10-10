# Retail ERP & Marketplace — Prototype Build Plan (Claude Design)

Oct 7, 2026 · Mustafa

## Approach

Build one brn dynamics design system first, then five Design artifacts that all read the same mock data, so the client can click through a full retail day from purchase order to delivered online order.

The prototype is front-end only: screens are live artboards with in-memory state, no backend. "Functional" here means that actions on one screen visibly change another (a POS sale lowers store stock, a goods receipt raises warehouse stock, a leave approval changes a balance). Integrations named in the brief (barcode scanners, exchange-rate feed, 3PL couriers, receipt printers) are simulated.

| # | Artifact | Type | Covers | Depends on |
| --- | --- | --- | --- | --- |
| 0 | brn dynamics Retail DS | Design System | Tokens, components, bilingual text rules | Nothing |
| 1 | Back office: Inventory and Procurement | Design | Items, POs, receiving, transfers, counts, write-offs, landed cost, ledger | 0 |
| 2 | POS terminal | Design | Checkout, payment, Arabic receipt, returns, shift close | 0, mock data |
| 3 | HRM | Design | Employees, payroll run, leave requests and approvals | 0 |
| 4 | Customer storefront | Design | Catalog, bundle and BOGO, cart, coupon, points, checkout, order tracking | 0, mock data |
| 5 | Operations hub and Promotions | Design | Order pipeline, 3PL handoff, promotion setup, loyalty | 0, mock data |

Splitting by user role keeps each artifact small enough to iterate on quickly, and maps to how the client will review it: store manager, cashier, HR, shopper, operations. Artifacts 1, 2 and 3 are Phase 1; 4 and 5 are Phase 2.

Three requirements from the brief must be visible on screen, not just stated:

- **Stock isolation.** Every stock figure is labelled Store or Online warehouse. The storefront can only sell from the online pool; the POS only from the store pool.
- **Arabic where required.** The interface stays English. Item descriptions and the customer receipt render in Arabic, right to left.
- **KWD costing.** Vendor prices in USD, CNY and AED convert to KWD at a dated rate, shown to three decimals.

## Design system

Create the design system once and reference it by name in every later prompt, so the five artifacts look like one product. Your account has no saved design system yet, so this is step one.

Only two brand facts are fixed: the brn. wordmark (bold "brn." with a blue dot over thin "dynamics") and brand blue #010ECF. Everything else below is a proposal to accept or change.

| Token group | Proposed value | Note |
| --- | --- | --- |
| Primary | #010ECF | Buttons, links, active nav, focus ring |
| Primary tint | #010ECF at 8% and 16% | Selected rows, info banners |
| Neutrals | Near-black text, five greys, white surface | Dense tables need quiet chrome |
| Status | Green success, amber warning, red critical, grey draft | Used only for state, never decoration |
| Stock pool | Store = teal tag, Online = violet tag | The isolation rule made visible everywhere |
| Type, Latin | Inter, 13 px table text, 14 px body, 20 and 28 px headings | Tabular figures on for all numbers |
| Type, Arabic | IBM Plex Sans Arabic or Noto Sans Arabic | Set `dir="rtl"` on Arabic fields only |
| Spacing | 4 px base: 4, 8, 12, 16, 24, 32 |  |
| Radius | 6 px controls, 10 px cards |  |
| Touch target | 48 px minimum on POS | Back office can stay at 32 px rows |

Components to define, each with its states:

- App shell: left navigation, top bar with location switcher and user menu
- Data table: sortable header, row select, inline status chip, empty and loading states
- Form controls: text, number, select, date, barcode input with scan icon
- Status chip and stock-pool tag
- Money cell: currency code, amount, and the KWD equivalent beneath
- Bilingual field: English name above, Arabic description below, right-aligned
- Document header: number, status, dates, action buttons (for PO, transfer, invoice, payslip)
- Stepper and timeline (PO lifecycle, order tracking)
- POS tiles, numeric keypad, cart line, payment sheet
- Receipt: 80 mm thermal layout, Arabic first
- Storefront: product card, promo badge, cart drawer, points pill
- Modal, toast, confirmation dialog

Formatting rules to write into the system README so every artifact follows them:

1. KWD always shows three decimals (KWD 12.500). USD, CNY and AED show two.
2. Dates are DD MMM YYYY. Numerals stay Western (0 to 9) in both languages unless the client asks otherwise.
3. Barcodes are EAN-13 for retail items and Code 128 for internal documents.
4. Document numbers are prefixed: PO-, GRN-, TRF-, CNT-, WO-, INV-, SO-.
5. The "Powered by brn dynamics" mark sits in the sidebar footer and on the receipt footer, not in page headers.

### Kuwait defaults

The client is a store in Kuwait, so the seed data, forms and labels follow these local conventions. Items marked "confirm" are my understanding and should be checked with the client.

| Area | Default | Where it shows |
| --- | --- | --- |
| Currency | KWD, 1 dinar = 1,000 fils, three decimals | Every price, cost, total and payslip |
| Sales tax | No tax line; a hidden, configurable tax field at 0% (confirm current VAT position) | POS totals, receipt, storefront cart, supplier invoices |
| Phone | +965 and 8 digits | Customer, vendor and employee records, checkout |
| Address | Governorate, Area, Block, Street, Avenue (optional), Building, Floor and Flat | Storefront checkout, order detail, packing slip |
| Delivery | Fee and slot chosen by Area | Checkout, order pipeline filters |
| Payments | Cash and K-Net first, then card; cash on delivery offered online | POS payment sheet, storefront checkout |
| Working week | Sunday to Thursday, Friday and Saturday off (confirm for store staff rotas) | Leave calendar, payroll days, shift reports |
| Annual leave | 30 days as the seed balance (confirm against the client's contracts) | Employee profile, My leave |
| Time zone | Kuwait time, UTC+3 | Timestamps on receipts, orders and logs |
| Arabic | Modern Standard Arabic for item descriptions and receipts | Items, POS receipt |

## Shared mock data

One seed data set, pasted into every artifact's prompt, is what makes the five artifacts feel like one system. Each artifact holds its own copy in memory; they do not sync with each other live, so the demo script in the Demo flows section is ordered to hide that.

The client is a store in Kuwait, a value retailer in the Temu and Shein mould: a wide, fast-changing range of low-priced fashion, home, beauty and gadget items. The seed below uses those four categories, with size and colour variants on fashion items (one SKU and barcode per variant) and invented product names; swap in the client's real categories before the walkthrough.

| Entity | Key fields | Seed size |
| --- | --- | --- |
| Location | id, name, pool (store or online) | 2: Main Store, Online Warehouse |
| Item (SKU) | sku, parent product, size, colour, barcode, name_en, description_ar, category, cost_kwd, price_kwd, active | 24 |
| Stock level | sku, location, on_hand, reserved | 48 (24 per location) |
| Vendor | id, name, country, currency | 4: one each USD, CNY, AED, KWD |
| Exchange rate | date, currency, rate_to_kwd | 3 currencies, 7 days |
| Purchase order | number, vendor, currency, lines, freight, duty, status | 5, one per status |
| Goods receipt | number, po, location, lines received | 3 |
| Stock transfer | number, from, to, lines, status | 3 |
| Stock count | number, location, lines (system, counted, variance) | 2 |
| Write-off | number, location, sku, qty, reason (damaged, opened pack, theft), note | 6 |
| Supplier invoice | number, vendor, po, amount, due date, status | 5 |
| Ledger entry | date, account, debit, credit, reference | 30 |
| Employee | id, name, role, base salary, allowances, deductions, leave balances | 10 |
| Leave request | employee, type (annual, sick, unpaid), dates, status | 6 |
| Payroll run | month, lines per employee, status, disbursement log | 2 |
| Sale (POS) | receipt no, cashier, lines, payment method, total | 12 |
| Customer | id, name, phone, points balance | 8 |
| Online order | number, customer, lines, promo applied, status, courier, tracking no | 10, spread across statuses |
| Promotion | type (bundle, BOGO, coupon), rule, dates, active | 5 |
| Courier (3PL) | id, name, service level | 2, placeholder names |

Status sets, so every screen uses the same words:

- Purchase order: Draft, Sent, Partially received, Received, Closed
- Transfer: Draft, In transit, Received
- Supplier invoice: Unpaid, Partially paid, Paid, Overdue
- Leave request: Pending, Approved, Rejected
- Payroll run: Draft, Approved, Disbursed
- Online order: New, Picking, Packed, Handed to courier, Out for delivery, Delivered, Returned

Use generic role labels and invented names for the ten employees and eight customers. Exchange rates in the seed are illustrative; label them "sample rate" on screen so nobody reads them as live.

## Phase 1 screens

Phase 1 needs 33 screens across three artifacts. Each row names what must actually work when clicked.

### Artifact 1: Back office (Inventory, Procurement, Financials)

Desktop, 1440 px wide.

| Screen | Purpose | Working interaction |
| --- | --- | --- |
| Dashboard | Stock value by pool, low stock, open POs, payables due | Location switcher refilters every tile |
| Item list | All SKUs with Store and Online columns side by side | Search, filter by category, active toggle |
| Item detail | English name, Arabic description, barcode, cost and price, stock by location, movement history | Edit Arabic description; history grows as other actions run |
| Barcode labels | Generate and preview a label sheet for selected SKUs | Pick SKUs, choose quantity, preview |
| PO list | POs by status and vendor | Filter by status |
| PO create | Vendor, currency, lines, freight and duty | Totals in vendor currency and KWD update as lines change |
| PO detail | Lifecycle stepper, landed cost breakdown | Send, then Receive |
| Goods receipt | Scan or type barcodes against a PO into a chosen location | Simulated scan increments received qty; posting raises stock and recalculates average cost |
| Transfer list and create | Move stock between Store and Online Warehouse | Confirmation dialog states that the pools are isolated and this is the only way stock crosses |
| Transfer receive | Scan in at destination | Status moves to Received; both stock levels change |
| Stock count | Count sheet per location | Enter counted qty, see variance, post adjustment |
| Write-offs | Log damaged, opened pack, theft | New entry lowers stock and appears in the shrinkage report |
| Shrinkage report | Loss by reason and location, in KWD | Date range filter |
| Exchange rates | Daily rate table for USD, CNY, AED to KWD | "Simulate daily update" button adds today's row and revalues open POs |
| Vendors | Vendor list with currency and balance | Open vendor to see POs and invoices |
| Supplier invoices | List, detail, match to PO and receipt | Record payment; status changes; ledger entry posts |
| General ledger | Journal list, chart of accounts, trial balance | Filter by account; entries from receipts, payments and write-offs appear |
| Users and roles | 10 staff accounts, role per user, tier indicator | Shows 10 of 10 seats used with an upgrade prompt |

### Artifact 2: POS terminal

Touch layout, 1280 by 800, large targets.

| Screen | Purpose | Working interaction |
| --- | --- | --- |
| Cashier sign-in | PIN pad, shift open with float | Enter PIN, open shift |
| Sale | Item tiles, barcode field, cart, totals | Scan or tap adds a line; quantity and line discount editable; shows Store stock only |
| Item lookup | Search with Arabic description shown | Out-of-stock items disabled, with a note that online stock is not sellable here |
| Payment | Cash, K-Net, card; split payment; change due | Keypad entry; completes the sale |
| Receipt preview | 80 mm receipt, Arabic item descriptions, right to left, English totals labels beneath | Toggle between Arabic and bilingual layouts |
| Returns | Find receipt, select lines, refund | Stock returns to Store pool |
| Hold and recall | Park a cart | Recall restores it |
| Shift close | Expected against counted cash, variance | Produces a Z-report summary |

### Artifact 3: HRM

Desktop, same shell as the back office.

| Screen | Purpose | Working interaction |
| --- | --- | --- |
| Employee directory | 10 staff with role and status | Open a profile |
| Employee profile | Salary structure, allowances, deductions, leave balances | Edit an allowance |
| Payroll run | Month selector, one line per employee: base, allowances, deductions, net | Recalculates when an allowance changes or unpaid leave is approved |
| Payslip | Printable single-employee view | Open from a payroll line |
| Disbursement log | Payment date, method, reference per employee | Approve, then Mark as disbursed writes the log |
| My leave | Employee view: balances and request form | Submit a request for annual, sick or unpaid leave |
| Leave approvals | Manager queue | Approve or reject; the balance and team calendar update |

## Phase 2 screens

Phase 2 adds 19 screens across two artifacts: what the shopper sees, and what operations and marketing see.

### Artifact 4: Customer storefront

Mobile first at 390 px, with a 1280 px desktop variant of Home, Product and Checkout only.

| Screen | Purpose | Working interaction |
| --- | --- | --- |
| Home | Deal-led feed: featured bundles, BOGO strip, category chips, long product grid with strike-through prices | Promo badges link to qualifying items |
| Category listing | Product grid with filters | Availability reflects the Online Warehouse pool only |
| Product detail | Images, English name, Arabic description, price, promo badge | Pick size and colour, add to cart; quantity capped at online stock for that variant |
| Bundle detail | Standalone SKUs sold as one package, with the saving shown | Add bundle as a single cart line |
| Cart | Lines, automatic discounts, coupon field, points to redeem | Adding a second BOGO item zeroes its price automatically; a valid code applies; an invalid one explains why |
| Checkout | Address, delivery slot, payment method, summary | Place order creates the order and reserves online stock |
| Order confirmation | Order number, points earned | Link to tracking |
| Order tracking | Timeline from New to Delivered with courier name and tracking number | A demo control steps the status forward, using the same status names as the hub |
| Account | Points balance and history, saved coupons, past orders | Reorder from a past order |

### Artifact 5: Operations hub and Promotions

Desktop, same shell as the back office.

| Screen | Purpose | Working interaction |
| --- | --- | --- |
| Order pipeline | Board with one column per status, counts and age per card | Drag or button moves an order forward |
| Order detail | Lines, customer, promo applied, full status timeline | Assign courier; print packing slip |
| Pick list | Items to pick from the Online Warehouse | Simulated scan confirms each line; a short pick flags the order |
| Pack and handoff | Confirm parcel, book courier, generate tracking number | "Book courier" simulates the 3PL response and moves status to Handed to courier |
| Delivery exceptions | Late, failed and returned deliveries by courier | Mark returned; stock goes back to the online pool |
| Promotions list | All promotions with type, dates and active toggle | Toggle changes what the shopper preview shows |
| Bundle builder | Pick standalone SKUs, set bundle price, see margin | Warns if any component is out of online stock |
| BOGO rule | Buy item or category, get item, limits, dates | Live preview against a sample cart |
| Coupons | Create code: percent or fixed, minimum spend, usage limit, expiry | Shows redemptions so far |
| Loyalty | Earn rate, redeem rate, customer balances | Manual adjustment with a reason, logged |

Because artifacts do not share state, Artifact 5 includes a compact "shopper preview" panel on the BOGO and coupon screens, so a promotion can be created and seen applied without leaving the artifact.

## Demo flows

Seven click-through flows cover every line of the brief. Give each one to Claude Design as an acceptance test: the artifact is done when the flow runs start to finish without a dead end.

### Flow 1: Buy in CNY, cost in KWD (Artifact 1)

1. Open Exchange rates and press Simulate daily update.
2. Create a PO for the CNY vendor with three lines, freight and duty.
3. Check that the PO shows totals in CNY and KWD, and a landed cost per unit.
4. Send the PO, then open Goods receipt and scan two of the three lines into the Online Warehouse.
5. Confirm the PO reads Partially received, online stock rose, store stock did not, and the item's average cost changed.
6. Open the supplier invoice, record a part payment, and find the entries in the ledger.

### Flow 2: Move stock between pools (Artifact 1)

1. On an item with zero store stock, start a transfer from Online Warehouse to Main Store.
2. Read the isolation confirmation, then confirm.
3. Receive the transfer by scanning at the store.
4. Confirm both pools changed and the movement history shows the transfer.

### Flow 3: Count and write off (Artifact 1)

1. Start a stock count for Main Store and enter one short quantity.
2. Post the variance.
3. Log a write-off with reason Opened pack and another with reason Theft.
4. Open the shrinkage report and see both, valued in KWD.

### Flow 4: Sell at the counter (Artifact 2)

1. Sign in with a PIN and open the shift.
2. Scan three items; change one quantity.
3. Try to add an item with zero store stock and see it blocked.
4. Pay part cash, part K-Net.
5. View the receipt with Arabic descriptions, right to left.
6. Process a return of one line, then close the shift and read the Z-report.

### Flow 5: Leave and payroll (Artifact 3)

1. As an employee, request two days of unpaid leave.
2. As the manager, approve it; see the balance and calendar change.
3. Open this month's payroll run and see that employee's deduction.
4. Approve the run, mark it disbursed, and open the disbursement log and a payslip.

### Flow 6: Shop online with promotions (Artifact 4)

1. From Home, open a BOGO item and add two; the second becomes free in the cart.
2. Add a bundle as one line.
3. Apply a coupon code, then redeem some points.
4. Check out, see the order number and points earned.
5. Open tracking and step through to Delivered.

### Flow 7: Fulfil through a 3PL (Artifact 5)

1. Open the order pipeline and pick a New order.
2. Run the pick list by scanning each line.
3. Pack, book the courier, and see the tracking number appear.
4. Advance to Out for delivery, then Delivered.
5. Mark a different order Returned and confirm online stock went back up.
6. Create a new BOGO rule and see it apply in the shopper preview.

For the client walkthrough, run them in the order 1, 2, 3, 4, 5, 7, 6. That tells the story from supplier to shelf to shopper, and finishing on the storefront leaves the most visual screens on show.

## Build sequence

Nine steps, each one a prompt to paste into a new Claude conversation. Attach the requirements PDF, the brn dynamics logo file and this plan to every prompt, so the screen tables and seed data come along.

Work one artifact at a time: get the static screens right first, then ask for the interactions, then run the flow as a test. Asking for everything at once produces shallow screens.

### Step 1: Design system

```text
Create a Design System called "brn dynamics Retail DS".
Brand: the attached brn. wordmark and brand blue #010ECF.
Use the tokens, component list and formatting rules from the
"Design system" section of the attached build plan.
It is for a dense retail ERP (desktop), a touch POS, and a mobile storefront.
Include a bilingual field component: English name, Arabic description
below it set right-to-left in an Arabic typeface.
Include a Store / Online stock-pool tag and a money cell that shows
vendor currency above its KWD equivalent (KWD to three decimals).
Light theme only for now.
```

Review the tokens and the table, chip and bilingual components before going further. Changes here are cheap; later they touch five artifacts.

### Step 2: Seed data

```text
Using the "Shared mock data" section of the build plan, write one
JSON seed data set with exactly those entities, fields and seed sizes.
Low-priced fashion, home, beauty and gadget items for a Kuwait value
retailer, with English names and Arabic descriptions. Fashion items
have size and colour variants, one SKU and barcode per variant.
Prices and costs in KWD. Invented names only. The store is in Kuwait:
follow the "Kuwait defaults" table in the plan for phones, addresses,
payments and leave balances. Keep stock for the
Main Store and the Online Warehouse as separate records, and make
four items zero in one pool but not the other.
Give it to me as a file I can attach to later prompts.
```

Have an Arabic speaker read the 24 descriptions before the client sees them.

### Step 3: Back office, static

```text
Using Claude Design and the "brn dynamics Retail DS" design system,
create a design called "Retail ERP - Back office".
Build the 18 screens listed under "Artifact 1" in the build plan as
desktop artboards at 1440 px, grouped on the canvas in this order:
Dashboard, Items, Purchasing, Warehouse, Finance, Admin.
Populate every table from the attached seed JSON.
English interface. Arabic only in item descriptions.
Every stock number carries a Store or Online tag.
Static layouts first; no interactions yet.
```

### Step 4: Back office, interactive

```text
Make "Retail ERP - Back office" functional with in-memory state.
Wire the navigation between all screens, then implement the
"Working interaction" column for each screen in the build plan.
Barcode scanning is simulated: a Scan button or typing a barcode
and pressing Enter. The exchange rate update is a button.
It is done when Flows 1, 2 and 3 from the build plan run end to end
with no dead ends. Add a small "Reset demo data" control in the user menu.
```

### Step 5: POS

```text
Using Claude Design and "brn dynamics Retail DS", create
"Retail ERP - POS": the 8 screens under "Artifact 2" in the build plan,
as a touch layout at 1280 x 800 with 48 px minimum targets.
Use the seed JSON; sell from Main Store stock only.
The receipt is an 80 mm layout with Arabic item descriptions,
right-to-left, and a toggle for a bilingual version.
Make it functional in memory. Done when Flow 4 runs end to end.
```

### Step 6: HRM

```text
Using Claude Design and "brn dynamics Retail DS", create
"Retail ERP - HRM": the 7 screens under "Artifact 3" in the build plan,
same app shell as the back office. Ten employees from the seed JSON.
Add a role switch (Employee / Manager) in the top bar so one person
can demo both sides of a leave request.
Approved unpaid leave must reduce net pay in the payroll run.
Done when Flow 5 runs end to end.
```

### Step 7: Storefront

```text
Using Claude Design and "brn dynamics Retail DS", create
"Marketplace - Storefront": the 9 screens under "Artifact 4" in the
build plan, mobile at 390 px, plus desktop variants of Home,
Product and Checkout. Availability comes from the Online Warehouse
pool only. Implement BOGO, bundle, coupon and points logic in the cart
from the promotions in the seed JSON. The feel is a deal-led value
marketplace: dense product grid, price first, promo badges, size and
colour pickers. Original layout and artwork, no other retailer's
branding. Order tracking has a demo control to step the status
forward. Done when Flow 6 runs end to end.
```

### Step 8: Operations hub and Promotions

```text
Using Claude Design and "brn dynamics Retail DS", create
"Marketplace - Operations hub": the 10 screens under "Artifact 5"
in the build plan, same shell as the back office.
Courier booking is simulated and returns a tracking number.
Include a shopper preview panel on the BOGO and coupon screens.
Done when Flow 7 runs end to end.
```

### Step 9: Consistency pass

```text
Review these five designs against "brn dynamics Retail DS" and the
build plan: [paste the five links].
List every place where status names, number formats, KWD decimals,
document prefixes, stock-pool tags or navigation labels differ
between them, then fix each one.
```

If a prompt says "Claude Design" and the result arrives as a plain page instead of a design canvas, say "make this with the Design artifact type" and it will be rebuilt in the right place.

## Assumptions and open questions

The brief leaves ten points open; the plan picks a default for each so the build is not blocked. Confirm them with the client before or at the walkthrough.

| Topic | Default in this plan | Question for the client |
| --- | --- | --- |
| Product range | Value fashion, home, beauty and gadgets, with size and colour variants | Confirm the category list, rough SKU count, and how often the range turns over |
| Locations | One store, one online warehouse | More than one store planned? |
| Storage layout | Flat, no aisle or shelf fields, as the brief says | None; noted as excluded for now |
| POS hardware | Generic touch terminal with scanner and 80 mm printer | Result of the physical check on existing terminals |
| Arabic scope | Item descriptions and customer receipts only | Should the storefront be bilingual too? The brief only names back office and POS |
| Payment methods | Cash, K-Net, card at POS; K-Net and card online | Which methods and gateway? |
| Accounting depth | Ledger, chart of accounts, trial balance, supplier invoices | Which Ibis, Tally or Oracle screens do staff rely on most? |
| Payroll rules | Base, allowances, deductions, net; no statutory calculations | Should payroll model social security contributions for Kuwaiti staff and end-of-service indemnity? |
| 3PL couriers | Two placeholder couriers, simulated booking | Which couriers, and do they offer an API? |
| Loyalty rates | Illustrative earn and redeem rates | Actual earn rate, redeem rate and expiry |

Two limits of the prototype itself to state up front in the walkthrough:

- The five artifacts do not share live data. A sale in the POS artifact will not appear in the back office artifact.
- State resets when an artifact is reloaded. That is why each one has a Reset demo data control and a scripted flow.

## Review checklist

Run this list against each artifact before the client sees it.

- [ ] Every flow for the artifact runs start to finish with no dead-end button
- [ ] Every stock figure carries a Store or Online tag
- [ ] POS cannot sell online stock; storefront cannot sell store stock
- [ ] A transfer is the only action that moves stock between pools
- [ ] KWD shows three decimals everywhere; vendor currencies show two
- [ ] Exchange rates are labelled as sample rates with a date
- [ ] Arabic text is right to left, in an Arabic typeface, and has been read by an Arabic speaker
- [ ] Interface labels are English on back office and POS
- [ ] Receipt fits 80 mm and shows Arabic item descriptions
- [ ] Status names match the lists in Shared mock data
- [ ] Write-off reasons are exactly Damaged, Opened pack, Theft
- [ ] Leave types are exactly Annual, Sick, Unpaid
- [ ] Users screen shows 10 seats and the tier upgrade path
- [ ] BOGO applies automatically; bundle is one cart line; coupon and points both reduce the total
- [ ] Order statuses run from New through Handed to courier to Delivered
- [ ] No real person or real courier names in the data
- [ ] brn dynamics mark appears in the sidebar footer and receipt footer only
- [ ] Reset demo data works
- [ ] Phones, addresses, payment methods and working week follow the Kuwait defaults
