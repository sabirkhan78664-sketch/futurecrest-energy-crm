"use client";

import { useState } from "react";

interface AssignmentSectionProps {
  agents: any[];
  closers: any[];

  assignedAgent: string;
  setAssignedAgent: (value: string) => void;

  assignedCloser: string;
  setAssignedCloser: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  isAgent: boolean;
  canReassign: boolean;

  // The lead's original creator (created_by, enriched by getLead()) —
  // shown read-only so the owner stays identifiable even after either
  // assignment is changed.
  creator?: any;
}

// Displayed person text (dropdown options and "Created by"): full name
// only — no employee ID or UUID. Employee ID is still searchable via
// filterPeople below.
function optionLabel(person: any) {
  return person?.full_name || person?.username || "Unnamed user";
}

// Filters by name / employee ID / username, always keeping the currently
// selected person so the select never loses its displayed value.
function filterPeople(
  people: any[],
  query: string,
  selectedId: string
) {
  const q = query.trim().toLowerCase();

  if (!q) return people;

  return people.filter(
    (person) =>
      person.id === selectedId ||
      [person.full_name, person.employee_id, person.username].some(
        (value) => String(value || "").toLowerCase().includes(q)
      )
  );
}

export default function AssignmentSection({
  agents,
  closers,
  assignedAgent,
  setAssignedAgent,
  assignedCloser,
  setAssignedCloser,
  status,
  setStatus,
  isAgent,
  canReassign,
  creator,
}: AssignmentSectionProps) {
  const assignmentLocked = isAgent || !canReassign;

  const [agentSearch, setAgentSearch] = useState("");
  const [closerSearch, setCloserSearch] = useState("");

  // Anyone who can be the working agent: Agents / Channel Partners plus
  // Closers — a Closer can be both Assigned Agent and Assigned Closer.
  const agentPeople = [
    ...agents,
    ...closers.filter(
      (closer) => !agents.some((agent) => agent.id === closer.id)
    ),
  ].sort((a, b) => optionLabel(a).localeCompare(optionLabel(b)));

  const visibleAgents = filterPeople(
    agentPeople,
    agentSearch,
    assignedAgent
  );

  const visibleClosers = filterPeople(
    closers,
    closerSearch,
    assignedCloser
  );

  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold">
        Assignment & Status
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* Assigned Agent */}

        <div>
          <label className="mb-2 block">
            Assigned Agent
          </label>

          {!assignmentLocked && (
            <input
              type="search"
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              placeholder="Search name or employee ID"
              className="mb-2 h-9 w-full rounded-lg border px-3 text-sm"
            />
          )}

          <select
            value={assignedAgent}
            onChange={(e) => setAssignedAgent(e.target.value)}
            disabled={assignmentLocked}
            className="h-11 w-full rounded-xl border px-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Select Agent</option>

            {visibleAgents.map((agent) => (
              <option
                key={agent.id}
                value={agent.id}
              >
                {optionLabel(agent)}
              </option>
            ))}
          </select>

          {isAgent && (
            <p className="mt-1 text-xs text-slate-500">
              Agent assignment is automatic.
            </p>
          )}

          {!isAgent && !canReassign && (
            <p className="mt-1 text-xs text-slate-500">
              Only Admin or Super Admin can reassign this lead.
            </p>
          )}
        </div>

        {/* Assigned Closer */}

        <div>
          <label className="mb-2 block">
            Assigned Closer
          </label>

          {!assignmentLocked && (
            <input
              type="search"
              value={closerSearch}
              onChange={(e) => setCloserSearch(e.target.value)}
              placeholder="Search name or employee ID"
              className="mb-2 h-9 w-full rounded-lg border px-3 text-sm"
            />
          )}

          <select
            value={assignedCloser}
            onChange={(e) => setAssignedCloser(e.target.value)}
            disabled={assignmentLocked}
            className="h-11 w-full rounded-xl border px-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">
              Select Closer
            </option>

            {visibleClosers.map((closer) => (
              <option
                key={closer.id}
                value={closer.id}
              >
                {optionLabel(closer)}
              </option>
            ))}
          </select>

          {isAgent && (
            <p className="mt-1 text-xs text-slate-500">
              A closer can claim this lead via Take Lead once submitted.
            </p>
          )}

          {!isAgent && !canReassign && (
            <p className="mt-1 text-xs text-slate-500">
              Only Admin or Super Admin can reassign this lead.
            </p>
          )}
        </div>

        {/* Lead Status */}

        <div>
          <label className="mb-2 block">
            Lead Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isAgent}
            className="h-11 w-full rounded-xl border px-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {isAgent ? (
              <option>New</option>
            ) : (
              <>
                <option>New</option>
                <option>Follow-up</option>
                <option value="Interested">Not Interested</option>
                <option>Processing</option>
                <option>Sold</option>
                <option>Lost</option>
                <option>No Answer</option>
                <option>Internal DNC</option>
                <option>NGTG</option>
                <option>Rejected</option>
              </>
            )}
          </select>

          {isAgent && (
            <p className="mt-1 text-xs text-slate-500">
              Status will change once a closer claims and processes this lead.
            </p>
          )}
        </div>

      </div>

      {creator && (
        <p className="mt-4 text-xs text-slate-500">
          Created by{" "}
          <span className="font-semibold text-slate-700">
            {optionLabel(creator)}
          </span>
          {creator.role ? ` · ${creator.role}` : ""}
        </p>
      )}
    </section>
  );
}