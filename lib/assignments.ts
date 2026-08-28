/**
 * Agent-to-Agent assignment is disabled by CRM design.
 * Agents create and own their own leads. Admin/Super Admin assign Closers only.
 *
 * The legacy AssignLeadModal still imports this helper, so the optional
 * parameters are retained for TypeScript compatibility. The operation itself
 * remains disabled.
 */
export async function assignLead(_leadId?: number, _agentId?: string): Promise<never> {
  throw new Error(
    "Agent-to-Agent lead assignment is disabled. Assign a Closer instead."
  );
}

export async function unassignLead(_leadId?: number): Promise<never> {
  throw new Error("Agent-to-Agent lead assignment is disabled.");
}
