# FutureCrest CRM fixes in this ZIP

## Fixed 1 — Agent All Leads vs My Leads
`lib/leads.ts` now uses the same ownership rule as `lib/myLeads.ts` for Agent:
- assigned_agent = logged-in user
- OR created_by = logged-in user

The Agent query uses the service-role client so RLS cannot cause the two pages to disagree.

## Fixed 2 — Messages New Chat shows no users
`app/api/messages/direct/route.ts` no longer uses a case-sensitive `status = 'Active'` query.
It loads profiles, excludes the logged-in user, and normalizes status to lowercase before keeping Active users.

This fixes the `New Chat -> No users available` issue when existing profile rows contain `active`/`Active` formatting differences.

## Not changed
Existing message send, group permissions, admin edit/delete, search/filter UI, and 90-day cron configuration were left intact.
