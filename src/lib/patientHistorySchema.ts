import { z } from "zod";

/**
 * Zod schema for validating structured patient history data
 */
export const PatientHistorySchema = z.object({
  patient: z.object({
    fullName: z.string().optional(),
    age: z.number().nullable().optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    maritalStatus: z.string().optional(),
    dateOfVisit: z.string().optional(), // ISO date string
    sourceOfHistory: z.string().optional(),
  }),

  chiefComplaint: z.object({
    complaint: z.string().optional(),
    duration: z.string().optional(),
  }),

  historyOfPresentIllness: z.object({
    onset: z.string().optional(),
    site: z.string().optional(),
    character: z.string().optional(),
    radiation: z.string().optional(),
    associatedSymptoms: z.array(z.string()).optional(),
    timing: z.string().optional(),
    exacerbatingFactors: z.array(z.string()).optional(),
    relievingFactors: z.array(z.string()).optional(),
    severity: z.string().optional(),
    chronologicalNarrative: z.string().optional(),
  }),

  reviewOfSystems: z
    .object({
      general: z.array(z.string()).optional(),
      cardiovascular: z.array(z.string()).optional(),
      respiratory: z.array(z.string()).optional(),
      gastrointestinal: z.array(z.string()).optional(),
      genitourinary: z.array(z.string()).optional(),
      neurological: z.array(z.string()).optional(),
      musculoskeletal: z.array(z.string()).optional(),
      endocrine: z.array(z.string()).optional(),
      psychiatric: z.array(z.string()).optional(),
      skin: z.array(z.string()).optional(),
    })
    .optional(),

  pastMedicalHistory: z
    .object({
      chronicDiseases: z.array(z.string()).optional(),
      surgeries: z.array(z.string()).optional(),
      hospitalizations: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      immunizations: z.array(z.string()).optional(),
      transfusions: z.array(z.string()).optional(),
    })
    .optional(),

  medications: z
    .object({
      current: z
        .array(
          z.object({
            name: z.string(),
            dose: z.string().optional(),
            frequency: z.string().optional(),
          })
        )
        .optional(),
      past: z.array(z.string()).optional(),
      supplements: z.array(z.string()).optional(),
    })
    .optional(),

  familyHistory: z
    .object({
      diseases: z.array(z.string()).optional(),
      relativesAffected: z.array(z.string()).optional(),
      hereditaryConditions: z.array(z.string()).optional(),
    })
    .optional(),

  socialHistory: z
    .object({
      smoking: z.string().optional(),
      alcohol: z.string().optional(),
      drugs: z.string().optional(),
      diet: z.string().optional(),
      exercise: z.string().optional(),
      occupationHazards: z.string().optional(),
      livingConditions: z.string().optional(),
      sexualHistory: z.string().optional(),
    })
    .optional(),

  preventiveCare: z
    .object({
      immunizations: z.array(z.string()).optional(),
      screeningTests: z.array(z.string()).optional(),
    })
    .optional(),

  assessment: z
    .object({
      summary: z.string().optional(),
      differentialDiagnoses: z.array(z.string()).optional(),
    })
    .optional(),

  plan: z
    .object({
      investigations: z.array(z.string()).optional(),
      treatment: z.array(z.string()).optional(),
      followUp: z.string().optional(),
    })
    .optional(),
});

export type PatientHistory = z.infer<typeof PatientHistorySchema>;

/**
 * String version of the schema for LLM prompt usage.
 * (Used inside OpenAI messages)
 */
export const PATIENT_HISTORY_SCHEMA_STRING = `
{
  "patient": {
    "fullName": "string",
    "age": number | null,
    "gender": "string",
    "occupation": "string",
    "maritalStatus": "string",
    "dateOfVisit": "string (ISO date)",
    "sourceOfHistory": "string"
  },
  "chiefComplaint": {
    "complaint": "string",
    "duration": "string"
  },
  "historyOfPresentIllness": {
    "onset": "string",
    "site": "string",
    "character": "string",
    "radiation": "string",
    "associatedSymptoms": ["string"],
    "timing": "string",
    "exacerbatingFactors": ["string"],
    "relievingFactors": ["string"],
    "severity": "string",
    "chronologicalNarrative": "string"
  },
  "reviewOfSystems": {
    "general": ["string"],
    "cardiovascular": ["string"],
    "respiratory": ["string"],
    "gastrointestinal": ["string"],
    "genitourinary": ["string"],
    "neurological": ["string"],
    "musculoskeletal": ["string"],
    "endocrine": ["string"],
    "psychiatric": ["string"],
    "skin": ["string"]
  },
  "pastMedicalHistory": {
    "chronicDiseases": ["string"],
    "surgeries": ["string"],
    "hospitalizations": ["string"],
    "allergies": ["string"],
    "immunizations": ["string"],
    "transfusions": ["string"]
  },
  "medications": {
    "current": [{"name": "string", "dose": "string", "frequency": "string"}],
    "past": ["string"],
    "supplements": ["string"]
  },
  "familyHistory": {
    "diseases": ["string"],
    "relativesAffected": ["string"],
    "hereditaryConditions": ["string"]
  },
  "socialHistory": {
    "smoking": "string",
    "alcohol": "string",
    "drugs": "string",
    "diet": "string",
    "exercise": "string",
    "occupationHazards": "string",
    "livingConditions": "string",
    "sexualHistory": "string"
  },
  "preventiveCare": {
    "immunizations": ["string"],
    "screeningTests": ["string"]
  },
  "assessment": {
    "summary": "string",
    "differentialDiagnoses": ["string"]
  },
  "plan": {
    "investigations": ["string"],
    "treatment": ["string"],
    "followUp": "string"
  }
}
`;
