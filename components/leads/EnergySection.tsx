"use client";

interface EnergySectionProps {
  nmi: string;
  setNmi: (value: string) => void;

  mirn: string;
  setMirn: (value: string) => void;

  currentRetailer: string;
  setCurrentRetailer: (value: string) => void;

  offeredRetailer: string;
  setOfferedRetailer: (value: string) => void;
}

export default function EnergySection({
  nmi,
  setNmi,
  mirn,
  setMirn,
  currentRetailer,
  setCurrentRetailer,
  offeredRetailer,
  setOfferedRetailer,
}: EnergySectionProps) {
  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold text-slate-800">
        Energy Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* NMI */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            NMI <span className="text-red-500">*</span>
          </label>

          <input
            required
            inputMode="numeric"
            maxLength={10}
            value={nmi}
            onChange={(e) => setNmi(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit NMI"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* MIRN */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            MIRN <span className="text-slate-400">(optional)</span>
          </label>

          <input
            inputMode="numeric"
            maxLength={10}
            value={mirn}
            onChange={(e) => setMirn(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit MIRN (optional)"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* CURRENT RETAILER */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Current Retailer <span className="text-red-500">*</span>
          </label>

          <input
            value={currentRetailer}
            onChange={(e) =>
              setCurrentRetailer(e.target.value)
            }
            required
            placeholder="Current retailer"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        {/* OFFERED RETAILER */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Offered Retailer <span className="text-red-500">*</span>
          </label>

          <input
            value={offeredRetailer}
            onChange={(e) =>
              setOfferedRetailer(e.target.value)
            }
            required
            placeholder="Offered retailer"
            className="h-11 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

      </div>
    </section>
  );
}