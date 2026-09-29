# Historical Import

- Only Super Admin can use Import Leads.
- Every CSV row creates a new lead; existing leads are never updated.
- Rows without `lead_id` get a generated CRM Lead ID; rows with a new `lead_id` keep it.
- Duplicate rows are skipped and reported with row number and reason:
  - `lead_id` already in the CRM, or repeated earlier in the CSV.
  - Mobile / Alternate Mobile / NMI matching an existing lead of the same
    campaign, or an earlier row of the CSV (normalized the same way as the
    global Energy duplicate search — see `lib/leadDuplicates.ts`).
- `assigned_agent` / `assigned_closer` accept a profile UUID or employee ID;
  anything else is left unassigned with a warning.
- Existing Agent/Closer workflow remains unchanged.
