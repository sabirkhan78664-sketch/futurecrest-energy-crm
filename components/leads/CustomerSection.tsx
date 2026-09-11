"use client";

interface CustomerSectionProps {
  customerName: string;
  setCustomerName: (value: string) => void;

  mobile: string;
  setMobile: (value: string) => void;

  alternateMobile: string;
  setAlternateMobile: (value: string) => void;

  email: string;
  setEmail: (value: string) => void;

  dob: string;
  setDob: (value: string) => void;

  address: string;
  setAddress: (value: string) => void;

  suburb: string;
  setSuburb: (value: string) => void;

  state: string;
  setState: (value: string) => void;

  postcode: string;
  setPostcode: (value: string) => void;

  fuelType: string;
  setFuelType: (value: string) => void;

  dncrNumber: string;
  setDncrNumber: (value: string) => void;

  agentName?: string;
  setAgentName?: (value: string) => void;
}

export default function CustomerSection({
  customerName,
  setCustomerName,
  mobile,
  setMobile,
  alternateMobile,
  setAlternateMobile,
  email,
  setEmail,
  dob,
  setDob,
  address,
  setAddress,
  suburb,
  setSuburb,
  state,
  setState,
  postcode,
  setPostcode,
  fuelType,
  setFuelType,
  dncrNumber,
  setDncrNumber,
  agentName,
  setAgentName,
}: CustomerSectionProps) {
  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold text-slate-800">
        Customer Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* CUSTOMER NAME */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Customer Name <span className="text-red-500">*</span>
          </label>

          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Enter customer name"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* MOBILE */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Mobile Number <span className="text-red-500">*</span>
          </label>

          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            required
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 0412525859"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* ALTERNATE MOBILE */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Alternate Mobile
          </label>

          <input
            value={alternateMobile}
            onChange={(e) =>
              setAlternateMobile(e.target.value)
            }
            placeholder="Enter alternate mobile"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* DOB */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Date of Birth
          </label>

          <input
            type="date"
            value={dob || ""}
            onChange={(e) => setDob(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* STATE */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            State <span className="text-red-500">*</span>
          </label>

          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            placeholder="Enter state"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* POSTCODE */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Postcode <span className="text-red-500">*</span>
          </label>

          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            required
            placeholder="Enter postcode"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* FUEL TYPE */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Fuel Type <span className="text-red-500">*</span>
          </label>

          <select
            required
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4"
          >
            <option value="">Select Fuel</option>
            <option value="Single">
              Single
            </option>
            <option value="Gas">
              Gas
            </option>
            <option value="Dual">
              Dual
            </option>
          </select>
        </div>

        {/* SUBURB */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Suburb <span className="text-red-500">*</span>
          </label>

          <input
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            required
            placeholder="Enter suburb"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* DNCR */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            DNCR Number{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            value={dncrNumber}
            onChange={(e) =>
              setDncrNumber(
                e.target.value.replace(/\D/g, "")
              )
            }
            inputMode="numeric"
            required
            placeholder="Enter DNCR number"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* AGENT NAME */}
        {setAgentName && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Agent Name <span className="text-red-500">*</span>
            </label>

            <input
              value={agentName || ""}
              onChange={(e) => setAgentName(e.target.value)}
              required
              placeholder="Name of person submitting this lead"
              className="h-11 w-full rounded-xl border border-slate-300 px-4"
            />
          </div>
        )}

        {/* ADDRESS */}
        <div className="xl:col-span-4">
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Address <span className="text-red-500">*</span>
          </label>

          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="Enter address"
            className="w-full rounded-xl border border-slate-300 p-4"
          />
        </div>

      </div>
    </section>
  );
}