"use client";

interface NBNSectionProps {
  name: string;
  setName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  avcNo: string;
  setAvcNo: (value: string) => void;
  nbnProvider: string;
  setNbnProvider: (value: string) => void;
  paying: string;
  setPaying: (value: string) => void;
  homeOwner: string;
  setHomeOwner: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  dob: string;
  setDob: (value: string) => void;
  offeredRetailer: string;
  setOfferedRetailer: (value: string) => void;
  dncr: string;
  setDncr: (value: string) => void;
  agentName?: string;
  setAgentName?: (value: string) => void;
}

export default function NBNSection({
  name,
  setName,
  phone,
  setPhone,
  address,
  setAddress,
  avcNo,
  setAvcNo,
  nbnProvider,
  setNbnProvider,
  paying,
  setPaying,
  homeOwner,
  setHomeOwner,
  email,
  setEmail,
  dob,
  setDob,
  offeredRetailer,
  setOfferedRetailer,
  dncr,
  setDncr,
  agentName,
  setAgentName,
}: NBNSectionProps) {
  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold text-slate-800">
        NBN Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Full Name" value={name} setValue={setName} />
        <Field label="Mobile" value={phone} setValue={setPhone} />
        <Field label="Email" value={email} setValue={setEmail} type="email" />

        <div>
          <label className="mb-2 block text-sm font-medium">Date of Birth</label>
          <input
            type="date"
            value={dob || ""}
            onChange={(e) => setDob(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        <Field label="NBN Provider" value={nbnProvider} setValue={setNbnProvider} />
        <Field
          label="Offered NBN Retailer"
          value={offeredRetailer}
          setValue={setOfferedRetailer}
        />
        <Field label="AVC No" value={avcNo} setValue={setAvcNo} />
        <div>
          <label className="mb-2 block text-sm font-medium">
            DNCR Number <span className="text-red-500">*</span>
          </label>
          <input
            value={dncr}
            onChange={(e) => setDncr(e.target.value.replace(/\D/g, ""))}
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
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
          <label className="mb-2 block text-sm font-medium">Paying</label>
          <select
            value={paying}
            onChange={(e) => setPaying(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Home Owner</label>
          <select
            value={homeOwner}
            onChange={(e) => setHomeOwner(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="xl:col-span-4">
          <label className="mb-2 block text-sm font-medium">Address</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-4"
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
