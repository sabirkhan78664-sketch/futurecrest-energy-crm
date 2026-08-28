"use client";

interface PHISectionProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  mobile: string;
  setMobile: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  dncr: string;
  setDncr: (value: string) => void;
  currentFund: string;
  setCurrentFund: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  ltBooking: string;
  setLtBooking: (value: string) => void;
  bookedBy: string;
  setBookedBy: (value: string) => void;
  bookedDate: string;
  setBookedDate: (value: string) => void;
  bookedTime: string;
  setBookedTime: (value: string) => void;
  agentNote: string;
  setAgentNote: (value: string) => void;
  advisorFeedback: string;
  setAdvisorFeedback: (value: string) => void;
  outcome: string;
  setOutcome: (value: string) => void;
  agentName?: string;
  setAgentName?: (value: string) => void;
}

export default function PHISection({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  mobile,
  setMobile,
  email,
  setEmail,
  state,
  setState,
  dncr,
  setDncr,
  currentFund,
  setCurrentFund,
  status,
  setStatus,
  ltBooking,
  setLtBooking,
  bookedBy,
  setBookedBy,
  bookedDate,
  setBookedDate,
  bookedTime,
  setBookedTime,
  agentNote,
  setAgentNote,
  advisorFeedback,
  setAdvisorFeedback,
  outcome,
  setOutcome,
  agentName,
  setAgentName,
}: PHISectionProps) {
  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold text-slate-800">
        PHI Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Field label="First Name" value={firstName} setValue={setFirstName} />
        <Field label="Last Name" value={lastName} setValue={setLastName} />
        <Field label="Mobile" value={mobile} setValue={setMobile} />
        <Field label="Email" value={email} setValue={setEmail} type="email" />
        <Field label="State" value={state} setValue={setState} />
        <Field label="Current Fund" value={currentFund} setValue={setCurrentFund} />

        <div>
          <label className="mb-2 block text-sm font-medium">PHI Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4"
          >
            <option value="">Select Status</option>
            <option value="Family">Family</option>
            <option value="Single">Single</option>
            <option value="Couple">Couple</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">DNCR Number <span className="text-red-500">*</span></label>
          <input
            value={dncr}
            onChange={(e) => setDncr(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
            placeholder="Enter DNCR number"
          />
        </div>

        {setAgentName && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <input
              value={agentName || ""}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Name of person submitting this lead"
              className="h-11 w-full rounded-xl border border-slate-300 px-4"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">LT / Booking</label>
          <input
            value={ltBooking}
            onChange={(e) => setLtBooking(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        <Field label="Booked By" value={bookedBy} setValue={setBookedBy} />

        <div>
          <label className="mb-2 block text-sm font-medium">Booked Date</label>
          <input
            type="date"
            value={bookedDate || ""}
            onChange={(e) => setBookedDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Booked Time</label>
          <input
            type="time"
            value={bookedTime || ""}
            onChange={(e) => setBookedTime(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-medium">Agent Note</label>
          <textarea
            rows={3}
            value={agentNote}
            onChange={(e) => setAgentNote(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-4"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Advisor Feedback
          </label>
          <textarea
            rows={3}
            value={advisorFeedback}
            onChange={(e) => setAdvisorFeedback(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-4"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Outcome</label>
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="Enter outcome"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  setValue,
  type = "text",
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-300 px-4"
      />
    </div>
  );
}
