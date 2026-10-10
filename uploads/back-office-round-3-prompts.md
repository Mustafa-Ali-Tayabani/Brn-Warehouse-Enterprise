# Retail ERP — Round 3 prompts (fixes, brn dynamics logo, finishing features)

Before pasting: upload the real brn dynamics logo file (SVG preferred, otherwise a
transparent PNG at least 600 px wide) into the Claude Design project, and attach it
to the prompt as well.

Paste Prompt A into "Retail ERP - Back office v2" and Prompt B into "Retail ERP - Handheld".

---

## Prompt A: Back office v2

```text
Update "Retail ERP - Back office v2". Keep every existing screen, report,
filter, the scanner behaviour and the seed data. Make these changes.

1. BUG FIXES
- Reports > Trial balance and profit and loss: the Closing debit and
  Closing credit columns print "[object Object]" under or instead of the
  number on every row (the cell for these two columns, around line 1836,
  returns an object where text is expected). Show only the number, blank
  when zero, exactly like the Period debit and Period credit columns.
- Dashboard: the fifth tile (Payables outstanding) sits alone on a second
  row. Fit all five KPI tiles on one row, or make the second row a full
  set with another useful tile (for example Online orders to pick).
- Item list: the search placeholder is cut off ("Search SKU, name,
  barcode, venc"). Shorten it to "Search items" or widen the box.
- Item list: one item shows vendor "—". Give every item a default vendor.
- Purchase orders CSV: the "Total" column holds KWD without saying so,
  and the vendor-currency amount is missing. Export "Currency",
  "Total (vendor currency)" and "Total KWD" as separate columns.
  Check every other CSV the same way: every money column names its
  currency in the header.

2. BRN DYNAMICS LOGO
Use the attached brn dynamics logo file, not typed text:
- Sidebar footer: "Powered by" + the logo, about 18 px tall, greyscale
  at rest and full colour on hover, linking to brndynamics.com.
- A new sign-in screen (see 3): the logo centred above the form.
- Print layouts and PDF/print versions of reports, POs, labels and
  invoices: "Powered by brn dynamics" logo in the footer.
- Browser tab icon: the blue dot from the logo.
Keep the store's own mark (NV, Najma Value Store) at the top of the
sidebar; brn dynamics stays a "Powered by" mark and never replaces the
client brand.

3. FEATURES TO ADD
- Sign-in screen: email and password, "Remember me", brn dynamics logo,
  then a location pick. Add "Sign out" to the user menu. Users and
  roles drive what each person sees: a Store cashier role should not see
  Finance; a Viewer role has no edit buttons. Add a "View as role"
  switch in the user menu so the demo can show this.
- New item and Edit item: form with category, vendor, cost, price,
  English name, Arabic description, and a variant matrix (sizes x
  colours) that creates one SKU and EAN-13 barcode per variant. Show
  the generated barcodes before saving.
- Purchase order approval: POs above KWD 250 need approval by the
  Owner or Finance role before they can be sent. Add Pending approval
  to the PO statuses, an Approve / Reject action with a comment, and an
  approvals badge in the sidebar.
- Reorder report: "Create purchase orders" button that groups the
  suggested lines by vendor and opens one draft PO per vendor.
- Notifications: a bell in the top bar listing overdue invoices, items
  out of stock, transfers waiting more than 2 days, POs awaiting
  approval, and devices with low battery. Each one links to the record.
- Global search: Ctrl+K opens a search across items, POs, invoices,
  vendors, transfers and reports. A scanned barcode does the same.
- Vendor detail: contact, currency, payment terms, open POs, invoices,
  payables ageing for that vendor, and average lead time.
- Report scheduling: on each report a "Schedule" action to email it
  daily, weekly or monthly as PDF or CSV to chosen users (simulated,
  shows the schedule in a list).
- Empty, loading and error states for every list and report.
- Activity history panel on every document (PO, GRN, transfer, count,
  invoice): who created, edited, approved and posted it, and when.

Done when the trial balance shows clean numbers, the logo appears in
the sidebar, sign-in and print footers, and a PO above KWD 250 cannot
be sent until it is approved.
```

---

## Prompt B: Handheld

```text
Update "Retail ERP - Handheld". Keep all screens and the scan behaviour.

1. FIXES
- Plurals: "1 open POs" should read "1 open PO", "1 events" should
  read "1 event". Fix every count label the same way.
- The header pill says "Online", which reads like network status.
  Show the stock pool as "Online Warehouse" (violet tag) and show
  network status separately as a small Wi-Fi / Offline indicator.
- Replace the two-letter tile icons (RC, TR, CT, WO, IL, PK) with
  simple line icons that match the back office style.

2. BRN DYNAMICS LOGO
- Use the attached brn dynamics logo file on the sign-in screen
  footer ("Powered by" + logo), not typed text. Use the white version
  on the dark sign-in background.
- Show it on the Settings > About screen with the app version.

3. ADDITIONS
- Item lookup: add "Print shelf label" that sends to the Zebra ZD421
  shown in the back office Devices list (simulated, with a preview).
- Receive: allow a photo of a damaged carton, and a "Short / over
  delivery" note that appears on the PO in the back office.
- Count: a "blind count" option that hides system quantity, and a
  recount prompt when the variance is more than 10 percent.
- Settings: a "Scanner test" showing the last raw scan, symbology and
  length, matching the back office Devices test.
- A session timeout that returns to the PIN screen after 5 minutes of
  no activity.
```

---

## Before the client demo

- Run Flows 1 to 7 from the build plan once more after these changes.
- Have an Arabic speaker check the item descriptions and the receipt.
- Use invented staff names only (current ones are fine as long as they
  are not real employees of the client).
