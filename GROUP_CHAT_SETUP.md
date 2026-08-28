# FutureCrest CRM Group Chat Setup

1. Open Supabase Dashboard -> SQL Editor.
2. Run `sql/GROUP_CHAT_MIGRATION.sql` once.
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` exists in `.env.local` because the Admin-only message/group APIs use the server service role after checking the logged-in user's role.
4. Restart the Next.js dev server.

Permissions implemented:
- Admin and Super Admin: create groups, delete groups, edit any message, delete any message in any direct or group chat.
- Other users: can use direct chat and can participate only in groups where they are members.
- Sent = ✓, Seen = ✓✓ Seen for direct chats.
