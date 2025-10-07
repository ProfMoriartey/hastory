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
  dateOfVisit: z.string().nullable().optional(),
  sourceOfHistory: z.string().nullable().optional(),
}),


  chiefComplaint: z.object({
    complaint: z.string().optional(),
    duration: z.string().optional(),
  }),

historyOfPresentIllness: z.object({
  onset: z.union([z.string(), z.number()]).nullable().optional(),
  site: z.union([z.string(), z.number()]).nullable().optional(),
  character: z.union([z.string(), z.number()]).nullable().optional(),
  radiation: z.union([z.string(), z.number()]).nullable().optional(),
  associatedSymptoms: z.array(z.string()).nullable().optional(),
  timing: z.union([z.string(), z.number()]).nullable().optional(),
  exacerbatingFactors: z.array(z.string()).nullable().optional(),
  relievingFactors: z.array(z.string()).nullable().optional(),
  severity: z.union([z.string(), z.number()]).nullable().optional(),
  chronologicalNarrative: z.union([z.string(), z.number()]).nullable().optional(),
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

  socialHistory: z.object({
  smoking: z.union([z.string(), z.boolean(), z.number()]).nullable().optional(),
  alcohol: z.union([z.string(), z.boolean(), z.number()]).nullable().optional(),
  drugs: z.union([z.string(), z.boolean(), z.number()]).nullable().optional(),
  diet: z.union([z.string(), z.number()]).nullable().optional(),
  exercise: z.union([z.string(), z.number()]).nullable().optional(),
  occupationHazards: z.union([z.string(), z.number()]).nullable().optional(),
  livingConditions: z.union([z.string(), z.number()]).nullable().optional(),
  sexualHistory: z.union([z.string(), z.number()]).nullable().optional(),
}).optional(),


  preventiveCare: z
    .object({
      immunizations: z.array(z.string()).optional(),
      screeningTests: z.array(z.string()).optional(),
    })
    .optional(),

  assessment: z
  .object({
    // Allow strings, numbers, booleans, or nulls
    summary: z.union([z.string(), z.number(), z.boolean()]).nullable().optional(),

    // Allow either an array of strings or a single string (model sometimes gives a comma list)
    differentialDiagnoses: z
      .union([
        z.array(z.string()),
        z.string(),
        z.number(),
        z.boolean(),
      ])
      .nullable()
      .optional(),
  })
  .optional(),

 plan: z
  .object({
    investigations: z.array(z.string()).nullable().optional(),
    treatment: z.array(z.string()).nullable().optional(),
    followUp: z.union([z.string(), z.number(), z.boolean()]).nullable().optional(),
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
