# FutureCrest CRM — Post-Sale QA Workflow

- QA can view every lead.
- QA audit is available only when `status = "Sold"`.
- A Sold lead starts with `qa_status = "Not Audited"`.
- QA may audit a Sold lead when needed.
- QA result is `Approved` or `Rejected`.
- Non-Sold leads show QA as `Not Required`.
- QA changes are performed through `/api/leads/[id]/qa`; the browser does not directly update `leads`.
- Admin and Super Admin can also perform the controlled post-sale QA action.

- Reports are role-checked. QA reports use all-lead visibility and include Sold/Audit Available/Approved/Rejected metrics.
