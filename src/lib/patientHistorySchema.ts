// src/lib/patientHistorySchema.ts

import { z } from "zod";

/**
 * Zod schema for validating structured patient history data
 */
export const PatientHistorySchema = z.object({
  patient: z.object({
    fullName: z.string().nullable().optional(),
    age: z.number().nullable().optional(),
    gender: z.string().nullable().optional(),
    occupation: z.string().nullable().optional(),
    maritalStatus: z.string().nullable().optional(),
    dateOfVisit: z.string().nullable().optional(), // Expect ISO string
    sourceOfHistory: z.string().nullable().optional(),
  }),

  chiefComplaint: z.object({
    complaint: z.string().nullable().optional(),
    duration: z.string().nullable().optional(),
  }),

  historyOfPresentIllness: z.object({
    // Standardize all descriptive fields to string, allowing null/optional
    onset: z.string().nullable().optional(), 
    site: z.string().nullable().optional(),
    character: z.string().nullable().optional(),
    radiation: z.string().nullable().optional(),
    timing: z.string().nullable().optional(),
    severity: z.string().nullable().optional(),

    // Array fields use .nullish() which resolves to undefined, allowing
    // the calling code (normalizePatientHistory) to handle the default.
    associatedSymptoms: z.array(z.string()).nullish(),
    exacerbatingFactors: z.array(z.string()).nullish(),
    relievingFactors: z.array(z.string()).nullish(),
    
    // ✅ FIX for the specific error: Enforce string and allow null/undefined
    chronologicalNarrative: z.string().nullable().optional(), 
  }),

  reviewOfSystems: z
    .object({
      general: z.array(z.string()).nullish(),
      cardiovascular: z.array(z.string()).nullish(),
      respiratory: z.array(z.string()).nullish(),
      gastrointestinal: z.array(z.string()).nullish(),
      genitourinary: z.array(z.string()).nullish(),
      neurological: z.array(z.string()).nullish(),
      musculoskeletal: z.array(z.string()).nullish(),
      endocrine: z.array(z.string()).nullish(),
      psychiatric: z.array(z.string()).nullish(),
      skin: z.array(z.string()).nullish(),
    })
    .optional(),

  pastMedicalHistory: z
    .object({
      chronicDiseases: z.array(z.string()).nullish(),
      surgeries: z.array(z.string()).nullish(),
      hospitalizations: z.array(z.string()).nullish(),
      allergies: z.array(z.string()).nullish(),
      immunizations: z.array(z.string()).nullish(),
      transfusions: z.array(z.string()).nullish(),
    })
    .optional(),

  medications: z
    .object({
      current: z
        .array(
          z.object({
            name: z.string(),
            dose: z.string().nullable().optional(),
            frequency: z.string().nullable().optional(),
          })
        )
        .nullish(),
      past: z.array(z.string()).nullish(),
      supplements: z.array(z.string()).nullish(),
    })
    .optional(),

  familyHistory: z
    .object({
      diseases: z.array(z.string()).nullish(),
      relativesAffected: z.array(z.string()).nullish(),
      hereditaryConditions: z.array(z.string()).nullish(),
    })
    .optional(),

  socialHistory: z
    .object({
      // Use z.string() and rely on normalization/coercion for non-string AI outputs
      smoking: z.string().nullable().optional(),
      alcohol: z.string().nullable().optional(),
      drugs: z.string().nullable().optional(),
      diet: z.string().nullable().optional(),
      exercise: z.string().nullable().optional(),
      occupationHazards: z.string().nullable().optional(),
      livingConditions: z.string().nullable().optional(),
      sexualHistory: z.string().nullable().optional(),
    })
    .optional(),

  preventiveCare: z
    .object({
      immunizations: z.array(z.string()).nullish(),
      screeningTests: z.array(z.string()).nullish(),
    })
    .optional(),

  assessment: z
    .object({
      summary: z.string().nullable().optional(),

      // Allow either an array of strings or a single string (model sometimes gives a comma list)
      differentialDiagnoses: z.array(z.string()).nullish(),
    })
    .optional(),

  plan: z
    .object({
      investigations: z.array(z.string()).nullish(),
      treatment: z.array(z.string()).nullish(),
      followUp: z.string().nullable().optional(),
    })
    .optional(),
});

export type PatientHistory = z.infer<typeof PatientHistorySchema>;

// The schema string is provided below (no changes needed)
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