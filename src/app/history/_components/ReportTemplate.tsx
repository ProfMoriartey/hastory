import { forwardRef, type JSX } from "react";
import type { PatientHistory } from "~/lib/patientHistorySchema";

// NOTE: The PatientHistory type MUST be imported from your schema definition file.

interface ReportTemplateProps {
  data: PatientHistory;
}

type FieldValue = string | number | boolean | null | undefined;

// ✅ Helper function for individual fields
const field = (label: string, value?: FieldValue): JSX.Element | null => {
  if (value === undefined || value === null || value === "") return null;

  const stringValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  return (
    <p>
      <span className="font-medium">{label}:</span> {stringValue}
    </p>
  );
};

// ✅ Helper function for rendering lists (e.g., medications, diagnoses)
const list = (
  items?: string | string[] | number | boolean | null,
): JSX.Element => {
  const normalized: string[] = Array.isArray(items)
    ? items.map((i) => String(i))
    : items !== undefined && items !== null
      ? [String(items)]
      : [];

  return normalized.length > 0 ? (
    <ul className="list-inside list-disc text-gray-700">
      {normalized.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500 italic">No data</p>
  );
};

// ✅ Helper function for section headings
const section = (title: string, content?: JSX.Element | null) =>
  content ? (
    <div className="mb-6">
      <h2 className="mb-2 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800">
        {title}
      </h2>
      <div className="space-y-1 text-gray-700">{content}</div>
    </div>
  ) : null;

/**
 * Renders the structured patient history report, compatible with forwardRef for PDF export.
 */
const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        className="mt-6 w-full rounded-md border border-gray-200 bg-white p-6 shadow-md"
      >
        <h2 className="mb-4 text-center text-xl font-bold text-blue-700 sm:text-left">
          🧾 Structured Patient History
        </h2>

        {section(
          "Patient Info",
          <>
            {field("Full Name", data.patient?.fullName)}
            {field("Age", data.patient?.age)}
            {field("Gender", data.patient?.gender)}
            {field("Occupation", data.patient?.occupation)}
            {field("Marital Status", data.patient?.maritalStatus)}
            {field("Date of Visit", data.patient?.dateOfVisit)}
          </>,
        )}

        {section(
          "Chief Complaint",
          <>
            {field("Complaint", data.chiefComplaint?.complaint)}
            {field("Duration", data.chiefComplaint?.duration)}
          </>,
        )}

        {section(
          "History of Present Illness",
          <>
            {field("Onset", data.historyOfPresentIllness?.onset)}
            {field("Character", data.historyOfPresentIllness?.character)}
            {field("Site", data.historyOfPresentIllness?.site)}
            {field("Radiation", data.historyOfPresentIllness?.radiation)}
            {field("Timing", data.historyOfPresentIllness?.timing)}
            {field("Severity", data.historyOfPresentIllness?.severity)}
            {field(
              "Narrative",
              data.historyOfPresentIllness?.chronologicalNarrative,
            )}
          </>,
        )}

        {section("Review of Systems", list(data.reviewOfSystems?.general))}
        {section(
          "Past Medical History",
          list(data.pastMedicalHistory?.chronicDiseases),
        )}
        {section(
          "Medications",
          list(
            data.medications?.current?.map(
              (m) => `${m.name} (${m.dose ?? ""}, ${m.frequency ?? ""})`,
            ),
          ),
        )}
        {section("Family History", list(data.familyHistory?.diseases))}

        {section(
          "Social History",
          <>
            {field("Smoking", data.socialHistory?.smoking)}
            {field("Alcohol", data.socialHistory?.alcohol)}
            {field("Drugs", data.socialHistory?.drugs)}
            {field("Diet", data.socialHistory?.diet)}
            {field("Exercise", data.socialHistory?.exercise)}
            {field("Occupation Hazards", data.socialHistory?.occupationHazards)}
            {field("Living Conditions", data.socialHistory?.livingConditions)}
            {field("Sexual History", data.socialHistory?.sexualHistory)}
          </>,
        )}

        {section(
          "Assessment",
          <>
            {field("Summary", data.assessment?.summary)}
            {list(data.assessment?.differentialDiagnoses)}
          </>,
        )}

        {section(
          "Plan",
          <>
            {list(data.plan?.investigations)}
            {list(data.plan?.treatment)}
            {field("Follow Up", data.plan?.followUp)}
          </>,
        )}
      </div>
    );
  },
);

ReportTemplate.displayName = "ReportTemplate";
export default ReportTemplate;
