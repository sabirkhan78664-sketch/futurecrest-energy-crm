"use client";

import DuplicateLeadModal from "./DuplicateLeadModal";
import AssignmentSection from "./AssignmentSection";
import CallbackSection from "./CallbackSection";
import FormActions from "./FormActions";
import CustomerSection from "./CustomerSection";
import EnergySection from "./EnergySection";
import PHISection from "./PHISection";
import NBNSection from "./NBNSection";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LeadFormProps {
  initialData?: any;
  isEdit?: boolean;
  submitOverride?: (payload: Record<string, any>) => Promise<void>;
  hideAssignment?: boolean;
  agentName?: string;
  setAgentName?: (value: string) => void;
}

type Campaign = "Energy" | "PHI" | "NBN";

export default function LeadForm({
  initialData,
  isEdit = false,
  submitOverride,
  hideAssignment = false,
  agentName,
  setAgentName,
}: LeadFormProps) {
  const router = useRouter();

  /* ============================================================
     CAMPAIGN
  ============================================================ */

  const [campaign, setCampaign] = useState<Campaign>(
    initialData?.campaign === "PHI"
      ? "PHI"
      : initialData?.campaign === "NBN"
        ? "NBN"
        : "Energy"
  );

  /* ============================================================
     COMMON CUSTOMER DATA - ENERGY
  ============================================================ */

  const [title, setTitle] = useState(
    initialData?.title != null ? String(initialData.title) : ""
  );

  const [customerType, setCustomerType] = useState(
    initialData?.customer_type != null ? String(initialData.customer_type) : ""
  );

  const [customerName, setCustomerName] = useState(
    initialData?.customer_name || ""
  );

  const [mobile, setMobile] = useState(
    initialData?.mobile || ""
  );

  const [alternateMobile, setAlternateMobile] = useState(
    initialData?.alternate_mobile || ""
  );

  const [email, setEmail] = useState(
    initialData?.email || ""
  );

  const [dob, setDob] = useState(
    initialData?.dob || ""
  );

  const [address, setAddress] = useState(
    initialData?.address || ""
  );

  const [suburb, setSuburb] = useState(
    initialData?.suburb != null ? String(initialData.suburb) : ""
  );

  const [state, setState] = useState(
    initialData?.state || ""
  );

  const [postcode, setPostcode] = useState(
    initialData?.postcode || ""
  );

  const [fuelType, setFuelType] = useState(
    initialData?.fuel_type || ""
  );

  /* ============================================================
     ENERGY
  ============================================================ */

  const [nmi, setNmi] = useState(
    initialData?.nmi || ""
  );

  const [mirn, setMirn] = useState(
    initialData?.mirn || ""
  );

  const [currentRetailer, setCurrentRetailer] = useState(
    initialData?.current_retailer || ""
  );

  const [offeredRetailer, setOfferedRetailer] = useState(
    initialData?.offered_retailer || ""
  );

  const [solar, setSolar] = useState(
    initialData?.solar ?? false
  );

  const [concession, setConcession] = useState(
    initialData?.concession ?? false
  );

  const [lifeSupport, setLifeSupport] = useState(
    initialData?.life_support ?? false
  );

  /* ============================================================
     DNCR NUMBER
     Stored in dncr_number and mirrored to legacy dncr flag.
  ============================================================ */

  const [dncrNumber, setDncrNumber] = useState(
    initialData?.dncr_number != null
      ? String(initialData.dncr_number)
      : ""
  );

  /* ============================================================
     COMMENTS
  ============================================================ */

  const [comments, setComments] = useState(
    initialData?.comments || ""
  );

  /* ============================================================
     NBN
     IMPORTANT:
     LT / BOOKING HAS BEEN REMOVED FROM NBN
  ============================================================ */

  const [nbnName, setNbnName] = useState(
    initialData?.campaign === "NBN"
      ? initialData?.customer_name || ""
      : ""
  );

  const [nbnPhone, setNbnPhone] = useState(
    initialData?.campaign === "NBN"
      ? initialData?.mobile || ""
      : ""
  );

  const [nbnAddress, setNbnAddress] = useState(
    initialData?.campaign === "NBN"
      ? initialData?.address || ""
      : ""
  );

  const [avcNo, setAvcNo] = useState(
    initialData?.avc_no || ""
  );

  const [nbnProvider, setNbnProvider] = useState(
    initialData?.nbn_provider || ""
  );

  const [paying, setPaying] = useState(
    initialData?.paying || ""
  );

  const [homeOwner, setHomeOwner] = useState(
    initialData?.home_owner || ""
  );

  const [nbnEmail, setNbnEmail] = useState(
    initialData?.campaign === "NBN"
      ? initialData?.email || ""
      : ""
  );

  const [nbnDob, setNbnDob] = useState(
    initialData?.campaign === "NBN"
      ? initialData?.dob || ""
      : ""
  );

  const [offeredNbnRetailer, setOfferedNbnRetailer] =
    useState(
      initialData?.offered_nbn_retailer || ""
    );

  /* ============================================================
     PHI
  ============================================================ */

  const [phiFirstName, setPhiFirstName] = useState(
    initialData?.phi_first_name || ""
  );

  const [phiLastName, setPhiLastName] = useState(
    initialData?.phi_last_name || ""
  );

  const [phiMobile, setPhiMobile] = useState(
    initialData?.campaign === "PHI"
      ? initialData?.mobile || ""
      : ""
  );

  const [phiEmail, setPhiEmail] = useState(
    initialData?.campaign === "PHI"
      ? initialData?.email || ""
      : ""
  );

  const [phiState, setPhiState] = useState(
    initialData?.campaign === "PHI"
      ? initialData?.state || ""
      : ""
  );

  const [phiCurrentFund, setPhiCurrentFund] =
    useState(
      initialData?.phi_current_fund || ""
    );

  const [phiStatus, setPhiStatus] =
    useState(
      initialData?.phi_status || ""
    );

  /* ============================================================
     PHI LT / BOOKING
     MOVED FROM NBN TO PHI
  ============================================================ */

  const [phiLtBooking, setPhiLtBooking] =
    useState(
      initialData?.phi_lt_booking || ""
    );

  const [phiBookedBy, setPhiBookedBy] =
    useState(
      initialData?.phi_booked_by || ""
    );

  const [phiBookedDate, setPhiBookedDate] =
    useState(
      initialData?.phi_booked_date || ""
    );

  const [phiBookedTime, setPhiBookedTime] =
    useState(
      initialData?.phi_booked_time || ""
    );

  const [phiAgentNote, setPhiAgentNote] =
    useState(
      initialData?.phi_agent_note || ""
    );

  const [phiAdvisorFeedback, setPhiAdvisorFeedback] =
    useState(
      initialData?.phi_advisor_feedback || ""
    );

  const [phiOutcome, setPhiOutcome] =
    useState(
      initialData?.phi_outcome || ""
    );

  /* ============================================================
     ASSIGNMENT
  ============================================================ */

  const [assignedAgent, setAssignedAgent] =
    useState(
      initialData?.assigned_agent || ""
    );

  const [assignedCloser, setAssignedCloser] =
    useState(
      initialData?.assigned_closer || ""
    );

  const [status, setStatus] =
    useState(
      initialData?.status || "New"
    );

  /* ============================================================
     CALLBACK
  ============================================================ */

  const [callbackDate, setCallbackDate] =
    useState(
      initialData?.callback_date || ""
    );

  const [callbackTime, setCallbackTime] =
    useState(
      initialData?.callback_time || ""
    );

  /* ============================================================
     USERS
  ============================================================ */

  const [agents, setAgents] =
    useState<any[]>([]);

  const [closers, setClosers] =
    useState<any[]>([]);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [currentRole, setCurrentRole] =
    useState("");

  /* ============================================================
     DUPLICATE
  ============================================================ */

  const [showDuplicateModal, setShowDuplicateModal] =
    useState(false);

  const [duplicateLead, setDuplicateLead] =
    useState<any>(null);

  const [duplicateReason, setDuplicateReason] =
    useState("");

  /* ============================================================
     LOADING
  ============================================================ */

  const [loading, setLoading] =
    useState(false);

  const isAdmin =
    currentRole === "Admin" ||
    currentRole === "Super Admin";

  // Mirrors the Agent override rules enforced server-side in
  // app/api/leads/route.ts — this only decides whether to show the
  // Override button; the API re-checks regardless.
  const AGENT_RESUBMITTABLE_STATUSES = [
    "Not Interested",
    "Lost",
  ];

  const AGENT_BLOCKED_STATUSES = [
    "Internal DNC",
    "Callback",
    "No Answer",
  ];

  const canAgentOverrideDuplicate = (() => {
    if (
      currentRole !== "Agent" ||
      !duplicateLead
    ) {
      return false;
    }

    const existingStatus = String(
      duplicateLead.status || ""
    );

    if (
      AGENT_BLOCKED_STATUSES.includes(
        existingStatus
      )
    ) {
      return false;
    }

    if (existingStatus === "Sold") {
      const existingCampaign = String(
        duplicateLead.campaign || ""
      );

      return (
        ["PHI", "NBN"].includes(campaign) &&
        campaign !== existingCampaign
      );
    }

    return AGENT_RESUBMITTABLE_STATUSES.includes(
      existingStatus
    );
  })();

  const canOverrideDuplicate =
    isAdmin || canAgentOverrideDuplicate;

  /* ============================================================
     LOAD USERS
  ============================================================ */

  useEffect(() => {
    // A public submission (submitOverride present) has no CRM session and
    // must not fetch the internal Agent/Closer roster — profiles has no
    // RLS restriction on anonymous SELECT, so this would otherwise leak
    // staff names/employee IDs to anyone with the public form URL.
    if (!submitOverride) {
      loadUsers();
    }

    loadCurrentUser();
  }, []);

  async function loadUsers() {
    const {
      data: agentData,
      error: agentError,
    } = await supabase
      .from("profiles")
      .select("id, full_name, employee_id")
      .eq("role", "Agent")
      .eq("status", "Active")
      .order("full_name", {
        ascending: true,
      });

    if (agentError) {
      console.error(
        "Agent loading error:",
        agentError
      );
    }

    const {
      data: closerData,
      error: closerError,
    } = await supabase
      .from("profiles")
      .select("id, full_name, employee_id")
      .eq("role", "Closer")
      .eq("status", "Active")
      .order("full_name", {
        ascending: true,
      });

    if (closerError) {
      console.error(
        "Closer loading error:",
        closerError
      );
    }

    setAgents(agentData || []);
    setClosers(closerData || []);
  }

  async function loadCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setCurrentUserId(user.id);

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(
        "Current user error:",
        error
      );
      return;
    }

    if (data) {
      setCurrentRole(data.role);
    }
  }

  /* ============================================================
     CAMPAIGN CHANGE
  ============================================================ */

  function handleCampaignChange(
    newCampaign: Campaign
  ) {
    setCampaign(newCampaign);
  }

  /* ============================================================
     VALIDATE CAMPAIGN
  ============================================================ */

  function validateCampaign() {
    if (!campaign) {
      alert("Please select a campaign.");
      return false;
    }

    /* ==========================================================
       REQUIRED COMMON FIELDS
    ========================================================== */

    if (!title.trim()) {
      alert("Title is required.");
      return false;
    }

    if (!customerType.trim()) {
      alert("Customer Type is required.");
      return false;
    }

    /* ==========================================================
       NBN
    ========================================================== */

    if (campaign === "NBN") {
      if (!nbnName.trim()) {
        alert("NBN Name is required.");
        return false;
      }

      if (!nbnPhone.trim()) {
        alert("NBN Phone is required.");
        return false;
      }

      setCustomerName(nbnName);
      setMobile(nbnPhone);
      setEmail(nbnEmail);
      setDob(nbnDob);
      setAddress(nbnAddress);
    }

    /* ==========================================================
       PHI
    ========================================================== */

    if (campaign === "PHI") {
      if (!phiFirstName.trim()) {
        alert(
          "PHI First Name is required."
        );
        return false;
      }

      if (!phiLastName.trim()) {
        alert(
          "PHI Last Name is required."
        );
        return false;
      }

      if (!phiMobile.trim()) {
        alert(
          "PHI Mobile is required."
        );
        return false;
      }

      setCustomerName(
        `${phiFirstName.trim()} ${phiLastName.trim()}`
      );

      setMobile(phiMobile);
      setEmail(phiEmail);
      setState(phiState);
    }

    /* ==========================================================
       ENERGY
    ========================================================== */

    if (campaign === "Energy") {
      const requiredTextFields: Array<[string, string]> = [
        [customerName, "Customer Name"],
        [address, "Address"],
        [suburb, "Suburb"],
        [state, "State"],
        [postcode, "Postcode"],
        [fuelType, "Fuel Type"],
        [nmi, "NMI"],
        [currentRetailer, "Current Retailer"],
        [offeredRetailer, "Offered Retailer"],
      ];

      for (const [value, label] of requiredTextFields) {
        if (!String(value || "").trim()) {
          alert(`${label} is required.`);
          return false;
        }
      }

      if (!/^\d{10}$/.test(mobile.trim())) {
        alert("Phone must be exactly 10 digits. Example: 0412525859");
        return false;
      }

      if (!/^\d{10}$/.test(nmi.trim())) {
        alert("NMI must be exactly 10 digits.");
        return false;
      }

      if (mirn.trim() && !/^\d{10}$/.test(mirn.trim())) {
        alert("MIRN must be exactly 10 digits when entered.");
        return false;
      }
    }

    /* ==========================================================
       DNCR
    ========================================================== */

    if (!dncrNumber.trim()) {
      alert(
        "DNCR Number is required."
      );
      return false;
    }

    if (!/^\d+$/.test(dncrNumber.trim())) {
      alert(
        "DNCR must contain numbers only."
      );
      return false;
    }

    /* ==========================================================
       CALLBACK
    ========================================================== */

    if (
      status === "Callback" &&
      (!callbackDate ||
        !callbackTime)
    ) {
      alert(
        "Please select Callback Date and Time."
      );
      return false;
    }

    return true;
  }

  /* ============================================================
     SAFE API JSON RESPONSE
  ============================================================ */

  async function readApiResponse(response: Response) {
    const text = await response.text();

    if (!text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error(
        "❌ API returned invalid JSON:",
        text
      );

      throw new Error(
        `Server returned invalid JSON: ${text.slice(0, 300)}`
      );
    }
  }

  /* ============================================================
     SAVE LEAD
  ============================================================ */

  async function saveLead(
    allowDuplicate = false,
    reason = ""
  ) {
    if (!validateCampaign()) {
      return;
    }

    if (
      allowDuplicate &&
      canOverrideDuplicate &&
      !reason.trim()
    ) {
      alert(
        "Please enter duplicate reason."
      );
      return;
    }

    setLoading(true);

    const finalCallbackDate =
      status === "Callback"
        ? callbackDate || null
        : null;

    const finalCallbackTime =
      status === "Callback"
        ? callbackTime || null
        : null;

    /* ============================================================
       FINAL COMMON VALUES
    ============================================================ */

    const finalCustomerName =
      campaign === "NBN"
        ? nbnName
        : campaign === "PHI"
          ? `${phiFirstName.trim()} ${phiLastName.trim()}`
          : customerName;

    const finalMobile =
      campaign === "NBN"
        ? nbnPhone
        : campaign === "PHI"
          ? phiMobile
          : mobile;

    const finalEmail =
      campaign === "NBN"
        ? nbnEmail
        : campaign === "PHI"
          ? phiEmail
          : email;

    const finalAddress =
      campaign === "NBN"
        ? nbnAddress
        : campaign === "PHI"
          ? ""
          : address;

    const finalState =
      campaign === "PHI"
        ? phiState
        : state;

    const finalDob =
      campaign === "NBN"
        ? nbnDob || null
        : campaign === "PHI"
          ? null
          : dob || null;

    try {
      /* ==========================================================
         UPDATE
      ========================================================== */

      if (isEdit) {
        const updateResponse = await fetch(`/api/leads/${initialData.id}/edit`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              /* COMMON */

              title:
                title || null,

              customer_type:
                customerType || null,

              customer_name:
                finalCustomerName,

              mobile:
                finalMobile,

              alternate_mobile:
                alternateMobile,

              email:
                finalEmail,

              dob:
                finalDob,

              address:
                finalAddress,

              suburb:
                suburb || null,

              state:
                finalState,

              postcode,

              campaign,

              /* ==================================================
                 ENERGY
              ================================================== */

              nmi:
                campaign === "Energy"
                  ? nmi
                  : null,

              mirn:
                campaign === "Energy"
                  ? mirn
                  : null,

              fuel_type:
                campaign === "Energy"
                  ? fuelType
                  : null,

              current_retailer:
                campaign === "Energy"
                  ? currentRetailer
                  : null,

              offered_retailer:
                campaign === "Energy"
                  ? offeredRetailer
                  : null,

              solar:
                campaign === "Energy"
                  ? solar
                  : false,

              concession:
                campaign === "Energy"
                  ? concession
                  : false,

              life_support:
                campaign === "Energy"
                  ? lifeSupport
                  : false,

              /* ==================================================
                 DNCR
              ================================================== */

              dncr_number:
                dncrNumber.trim() || null,

              /* ==================================================
                 NBN
                 NO LT / BOOKING HERE
              ================================================== */

              avc_no:
                campaign === "NBN"
                  ? avcNo
                  : null,

              nbn_provider:
                campaign === "NBN"
                  ? nbnProvider
                  : null,

              paying:
                campaign === "NBN"
                  ? paying
                  : null,

              home_owner:
                campaign === "NBN"
                  ? homeOwner
                  : null,

              offered_nbn_retailer:
                campaign === "NBN"
                  ? offeredNbnRetailer
                  : null,

              /* ==================================================
                 PHI
              ================================================== */

              phi_first_name:
                campaign === "PHI"
                  ? phiFirstName
                  : null,

              phi_last_name:
                campaign === "PHI"
                  ? phiLastName
                  : null,

              phi_current_fund:
                campaign === "PHI"
                  ? phiCurrentFund
                  : null,

              phi_status:
                campaign === "PHI"
                  ? phiStatus
                  : null,

              /* PHI LT / BOOKING */

              phi_lt_booking:
                campaign === "PHI"
                  ? phiLtBooking
                  : null,

              phi_booked_by:
                campaign === "PHI"
                  ? phiBookedBy
                  : null,

              phi_booked_date:
                campaign === "PHI"
                  ? phiBookedDate || null
                  : null,

              phi_booked_time:
                campaign === "PHI"
                  ? phiBookedTime || null
                  : null,

              phi_agent_note:
                campaign === "PHI"
                  ? phiAgentNote
                  : null,

              phi_advisor_feedback:
                campaign === "PHI"
                  ? phiAdvisorFeedback
                  : null,

              phi_outcome:
                campaign === "PHI"
                  ? phiOutcome
                  : null,

              /* ==================================================
                 NOTES
              ================================================== */

              comments,

              /* ==================================================
                 ASSIGNMENT
              ================================================== */

              assigned_agent:
                assignedAgent || null,

              assigned_closer:
                assignedCloser || null,

              status,

              callback_date:
                finalCallbackDate,

              callback_time:
                finalCallbackTime,
            }),
        });

        const updateResult = await updateResponse.json().catch(() => ({}));
        const updatedRows = updateResult?.lead ? [updateResult.lead] : [];
        const error = updateResponse.ok
          ? null
          : new Error(updateResult?.message || "Unable to update lead.");

        if (error) {
          console.error("LEAD UPDATE ERROR:", {
            message: error.message,
          });
          throw new Error(
            error.message ||
              "Unable to update lead."
          );
        }

        if (!updatedRows || updatedRows.length === 0) {
          console.error(
            "LEAD UPDATE MATCHED 0 ROWS:",
            {
              attemptedId: initialData.id,
            }
          );
          throw new Error(
            "The update ran but matched 0 rows in the database. " +
              "This usually means a Row Level Security policy on 'leads' " +
              "is blocking UPDATE for this row/role, or the lead id is wrong. " +
              "No changes were actually saved."
          );
        }

        alert(
          "Lead updated successfully."
        );

        router.push("/leads");
        return;
      }

      /* ==========================================================
         CREATE
      ========================================================== */

      const payload = {
                /* ==================================================
                   COMMON
                ================================================== */

                title:
                  title || null,

                customer_type:
                  customerType || null,

                customer_name:
                  finalCustomerName,

                mobile:
                  finalMobile,

                alternate_mobile:
                  alternateMobile,

                email:
                  finalEmail,

                dob:
                  finalDob,

                address:
                  finalAddress,

                state:
                  finalState,

                postcode,

                suburb:
                  suburb || null,

                campaign,

                /* ==================================================
                   ENERGY
                ================================================== */

                nmi:
                  campaign === "Energy"
                    ? nmi
                    : null,

                mirn:
                  campaign === "Energy"
                    ? mirn
                    : null,

                fuel_type:
                  campaign === "Energy"
                    ? fuelType
                    : null,

                current_retailer:
                  campaign === "Energy"
                    ? currentRetailer
                    : null,

                offered_retailer:
                  campaign === "Energy"
                    ? offeredRetailer
                    : null,

                solar:
                  campaign === "Energy"
                    ? solar
                    : false,

                concession:
                  campaign === "Energy"
                    ? concession
                    : false,

                life_support:
                  campaign === "Energy"
                    ? lifeSupport
                    : false,

                /* ==================================================
                   DNCR
                ================================================== */

                dncr_number:
                  dncrNumber.trim() || null,

                /* ==================================================
                   NBN
                   IMPORTANT:
                   NO nbn_lt_booking
                ================================================== */

                avc_no:
                  campaign === "NBN"
                    ? avcNo
                    : null,

                nbn_provider:
                  campaign === "NBN"
                    ? nbnProvider
                    : null,

                paying:
                  campaign === "NBN"
                    ? paying
                    : null,

                home_owner:
                  campaign === "NBN"
                    ? homeOwner
                    : null,

                offered_nbn_retailer:
                  campaign === "NBN"
                    ? offeredNbnRetailer
                    : null,

                /* ==================================================
                   PHI
                ================================================== */

                phi_first_name:
                  campaign === "PHI"
                    ? phiFirstName
                    : null,

                phi_last_name:
                  campaign === "PHI"
                    ? phiLastName
                    : null,

                phi_current_fund:
                  campaign === "PHI"
                    ? phiCurrentFund
                    : null,

                phi_status:
                  campaign === "PHI"
                    ? phiStatus
                    : null,

                /* PHI LT / BOOKING */

                phi_lt_booking:
                  campaign === "PHI"
                    ? phiLtBooking
                    : null,

                phi_booked_by:
                  campaign === "PHI"
                    ? phiBookedBy
                    : null,

                phi_booked_date:
                  campaign === "PHI"
                    ? phiBookedDate || null
                    : null,

                phi_booked_time:
                  campaign === "PHI"
                    ? phiBookedTime || null
                    : null,

                phi_agent_note:
                  campaign === "PHI"
                    ? phiAgentNote
                    : null,

                phi_advisor_feedback:
                  campaign === "PHI"
                    ? phiAdvisorFeedback
                    : null,

                phi_outcome:
                  campaign === "PHI"
                    ? phiOutcome
                    : null,

                /* ==================================================
                   NOTES
                ================================================== */

                comments,

                /* ==================================================
                   ASSIGNMENT
                ================================================== */

                assigned_agent:
                  currentRole === "Agent"
                    ? currentUserId
                    : assignedAgent ||
                      null,

                assigned_closer:
                  currentRole === "Agent"
                    ? null
                    : assignedCloser ||
                      null,

                /* ==================================================
                   APPROVAL
                ================================================== */

                approval_status:
                  currentRole === "Agent"
                    ? "Pending"
                    : "Approved",

                approved_by:
                  currentRole === "Agent"
                    ? null
                    : currentUserId,

                approved_at:
                  currentRole === "Agent"
                    ? null
                    : new Date().toISOString(),

                /* ==================================================
                   STATUS
                ================================================== */

                status:
                  currentRole === "Agent"
                    ? "Pending Approval"
                    : status,

                callback_date:
                  finalCallbackDate,

                callback_time:
                  finalCallbackTime,

                /* ==================================================
                   DUPLICATE
                ================================================== */

                allowDuplicate,

                duplicateReason:
                  reason,

                /* ==================================================
                   USER
                ================================================== */

                userId:
                  currentUserId ||
                  null,
      };

      /* ==========================================================
         PUBLIC SUBMISSION OVERRIDE
         When provided, this replaces the normal /api/leads POST
         entirely — the override owns its own success/error/duplicate
         handling (e.g. the public partner intake form).
      ========================================================== */

      if (submitOverride) {
        await submitOverride(payload);
        return;
      }

      const response =
        await fetch(
          "/api/leads",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(payload),
          }
        );

      const result =
        await readApiResponse(response);

      /* ==========================================================
         DUPLICATE
      ========================================================== */

      if (
        response.status === 409 &&
        result.duplicate
      ) {
        setDuplicateLead({
          ...result.lead,
          duplicateBy:
            result.duplicateBy,
        });

        setShowDuplicateModal(
          true
        );

        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create lead."
        );
      }

      alert(
        `${campaign} lead created successfully.`
      );

      router.push("/leads");

    } catch (error: any) {
      console.error(
        "Lead save error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="border-b border-slate-200 px-8 py-6">

        <h1 className="text-2xl font-bold text-slate-800">
          {isEdit
            ? "Edit Lead"
            : "New Lead"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create and manage FutureCrest CRM leads.
        </p>

      </div>

      <div className="space-y-10 p-8">

        {/* ======================================================
            CAMPAIGN SELECTOR
        ====================================================== */}

        <section>

          <h2 className="mb-5 text-lg font-semibold text-slate-800">
            Select Campaign
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* ENERGY */}

            <button
              type="button"
              onClick={() =>
                handleCampaignChange(
                  "Energy"
                )
              }
              className={`rounded-2xl border-2 p-5 text-left transition ${
                campaign === "Energy"
                  ? "border-blue-600 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
            >

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
                  ⚡
                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    Energy
                  </p>

                  <p className="text-xs text-slate-500">
                    Electricity & Gas
                  </p>

                </div>

              </div>

              {campaign ===
                "Energy" && (
                <p className="mt-4 text-xs font-bold text-blue-600">
                  ✓ Selected
                </p>
              )}

            </button>

            {/* PHI */}

            <button
              type="button"
              onClick={() =>
                handleCampaignChange(
                  "PHI"
                )
              }
              className={`rounded-2xl border-2 p-5 text-left transition ${
                campaign === "PHI"
                  ? "border-purple-600 bg-purple-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50"
              }`}
            >

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-xl text-white">
                  🛡️
                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    PHI
                  </p>

                  <p className="text-xs text-slate-500">
                    Health Insurance
                  </p>

                </div>

              </div>

              {campaign ===
                "PHI" && (
                <p className="mt-4 text-xs font-bold text-purple-600">
                  ✓ Selected
                </p>
              )}

            </button>

            {/* NBN */}

            <button
              type="button"
              onClick={() =>
                handleCampaignChange(
                  "NBN"
                )
              }
              className={`rounded-2xl border-2 p-5 text-left transition ${
                campaign === "NBN"
                  ? "border-emerald-600 bg-emerald-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
              }`}
            >

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white">
                  📶
                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    NBN
                  </p>

                  <p className="text-xs text-slate-500">
                    Broadband
                  </p>

                </div>

              </div>

              {campaign ===
                "NBN" && (
                <p className="mt-4 text-xs font-bold text-emerald-600">
                  ✓ Selected
                </p>
              )}

            </button>

          </div>

        </section>

        {/* ======================================================
            COMMON — applies to every campaign (Energy/PHI/NBN).
            Must stay OUTSIDE any campaign === "..." check, or these
            fields won't render (and therefore won't save) for
            campaigns other than the one it's nested under.
        ====================================================== */}

        <section>
          <h2 className="mb-6 text-lg font-semibold text-slate-800">
            Customer Details
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Title <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4"
              >
                <option value="">Select Title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Miss">Miss</option>
                <option value="Dr">Dr</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4"
              >
                <option value="">Select Customer Type</option>
                <option value="Residential">Residential</option>
                <option value="Business">Business</option>
              </select>
            </div>

          </div>
        </section>

        {/* ======================================================
            ENERGY
        ====================================================== */}

        {campaign ===
          "Energy" && (
          <>

            <CustomerSection
  customerName={customerName}
  setCustomerName={setCustomerName}

  mobile={mobile}
  setMobile={setMobile}

  alternateMobile={alternateMobile}
  setAlternateMobile={setAlternateMobile}

  email={email}
  setEmail={setEmail}

  dob={dob}
  setDob={setDob}

  address={address}
  setAddress={setAddress}

  suburb={suburb}
  setSuburb={setSuburb}

  state={state}
  setState={setState}

  postcode={postcode}
  setPostcode={setPostcode}

  fuelType={fuelType}
  setFuelType={setFuelType}

  dncrNumber={dncrNumber}
  setDncrNumber={setDncrNumber}

  agentName={agentName}
  setAgentName={setAgentName}
/>

            <EnergySection
  nmi={nmi}
  setNmi={setNmi}
  mirn={mirn}
  setMirn={setMirn}
  currentRetailer={currentRetailer}
  setCurrentRetailer={setCurrentRetailer}
  offeredRetailer={offeredRetailer}
  setOfferedRetailer={setOfferedRetailer}
/>

            {/* ENERGY OPTIONS */}

            <section>

              <h2 className="mb-6 text-lg font-semibold text-slate-800">
                Customer Options
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                {/* SOLAR */}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">

                  <input
                    type="checkbox"
                    checked={
                      solar
                    }
                    onChange={(
                      e
                    ) =>
                      setSolar(
                        e.target.checked
                      )
                    }
                    className="h-5 w-5"
                  />

                  <span className="font-medium">
                    Solar
                  </span>

                </label>

                {/* CONCESSION */}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">

                  <input
                    type="checkbox"
                    checked={
                      concession
                    }
                    onChange={(
                      e
                    ) =>
                      setConcession(
                        e.target.checked
                      )
                    }
                    className="h-5 w-5"
                  />

                  <span className="font-medium">
                    Concession
                  </span>

                </label>

                {/* LIFE SUPPORT */}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">

                  <input
                    type="checkbox"
                    checked={
                      lifeSupport
                    }
                    onChange={(
                      e
                    ) =>
                      setLifeSupport(
                        e.target.checked
                      )
                    }
                    className="h-5 w-5"
                  />

                  <span className="font-medium">
                    Life Support
                  </span>

                </label>

              </div>

            </section>

          </>
        )}

        {/* ======================================================
            PHI
        ====================================================== */}

        {campaign ===
          "PHI" && (
          <PHISection
            firstName={
              phiFirstName
            }
            setFirstName={
              setPhiFirstName
            }

            lastName={
              phiLastName
            }
            setLastName={
              setPhiLastName
            }

            mobile={
              phiMobile
            }
            setMobile={
              setPhiMobile
            }

            email={
              phiEmail
            }
            setEmail={
              setPhiEmail
            }

            state={
              phiState
            }
            setState={
              setPhiState
            }

            dncr={dncrNumber}
setDncr={setDncrNumber}

            currentFund={
              phiCurrentFund
            }
            setCurrentFund={
              setPhiCurrentFund
            }

            status={
              phiStatus
            }
            setStatus={
              setPhiStatus
            }

            /* ================================================
               LT / BOOKING
            ================================================= */

            ltBooking={
              phiLtBooking
            }
            setLtBooking={
              setPhiLtBooking
            }

            bookedBy={
              phiBookedBy
            }
            setBookedBy={
              setPhiBookedBy
            }

            bookedDate={
              phiBookedDate
            }
            setBookedDate={
              setPhiBookedDate
            }

            bookedTime={
              phiBookedTime
            }
            setBookedTime={
              setPhiBookedTime
            }

            agentNote={
              phiAgentNote
            }
            setAgentNote={
              setPhiAgentNote
            }

            advisorFeedback={
              phiAdvisorFeedback
            }
            setAdvisorFeedback={
              setPhiAdvisorFeedback
            }

            outcome={
              phiOutcome
            }
            setOutcome={
              setPhiOutcome
            }

            agentName={agentName}
            setAgentName={setAgentName}
          />
        )}

        {/* ======================================================
            NBN
            NO LT / BOOKING
        ====================================================== */}

        {campaign ===
          "NBN" && (
          <NBNSection

            name={
              nbnName
            }
            setName={
              setNbnName
            }

            phone={
              nbnPhone
            }
            setPhone={
              setNbnPhone
            }

            address={
              nbnAddress
            }
            setAddress={
              setNbnAddress
            }

            avcNo={
              avcNo
            }
            setAvcNo={
              setAvcNo
            }

            nbnProvider={
              nbnProvider
            }
            setNbnProvider={
              setNbnProvider
            }

            paying={
              paying
            }
            setPaying={
              setPaying
            }

            homeOwner={
              homeOwner
            }
            setHomeOwner={
              setHomeOwner
            }

            email={
              nbnEmail
            }
            setEmail={
              setNbnEmail
            }

            dob={
              nbnDob
            }
            setDob={
              setNbnDob
            }

            offeredRetailer={
              offeredNbnRetailer
            }
            setOfferedRetailer={
              setOfferedNbnRetailer
            }

            dncr={dncrNumber}
            setDncr={setDncrNumber}

            agentName={agentName}
            setAgentName={setAgentName}

          />
        )}

        {/* ======================================================
            COMMON COMMENTS
        ====================================================== */}

        <section>

          <h2 className="mb-6 text-lg font-semibold text-slate-800">
            Comments
          </h2>

          <textarea
            rows={5}
            value={
              comments
            }
            onChange={(
              e
            ) =>
              setComments(
                e.target.value
              )
            }
            placeholder="Enter comments..."
            className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

        </section>

        {/* ======================================================
            ASSIGNMENT
        ====================================================== */}

        {!hideAssignment && (
          <AssignmentSection
            agents={
              agents
            }

            closers={
              closers
            }

            assignedAgent={
              assignedAgent
            }

            setAssignedAgent={
              setAssignedAgent
            }

            assignedCloser={
              assignedCloser
            }

            setAssignedCloser={
              setAssignedCloser
            }

            status={
              status
            }

            setStatus={
              setStatus
            }

            isAgent={
              currentRole ===
                "Agent" ||
              !!submitOverride
            }
          />
        )}

        {/* ======================================================
            CALLBACK
        ====================================================== */}

        <CallbackSection
          status={
            status
          }

          callbackDate={
            callbackDate
          }

          setCallbackDate={
            setCallbackDate
          }

          callbackTime={
            callbackTime
          }

          setCallbackTime={
            setCallbackTime
          }
        />

        {/* ======================================================
            DUPLICATE MODAL
        ====================================================== */}

        <DuplicateLeadModal
          open={
            showDuplicateModal
          }

          lead={
            duplicateLead
          }

          canOverride={
            canOverrideDuplicate
          }

          reason={
            duplicateReason
          }

          setReason={
            setDuplicateReason
          }

          onClose={() =>
            setShowDuplicateModal(
              false
            )
          }

          onOverride={() =>
            saveLead(
              true,
              duplicateReason
            )
          }
        />

        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <FormActions
          loading={
            loading
          }

          isEdit={
            isEdit
          }

          onCancel={() =>
            router.back()
          }

          onSave={() =>
            saveLead(false)
          }
        />

      </div>

    </div>
  );
}