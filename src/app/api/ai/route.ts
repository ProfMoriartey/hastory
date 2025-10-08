// import { NextResponse } from "next/server";
// import {
//   PATIENT_HISTORY_SCHEMA_STRING,
//   PatientHistorySchema,
//   type PatientHistory,
// } from "~/lib/patientHistorySchema";
// import { cleanTranscriptionText } from "~/lib/cleanText";

// interface ChatMessage {
//   role: "system" | "user" | "assistant";
//   content: string;
// }

// interface OpenRouterChoice {
//   message: ChatMessage;
//   text?: string;
// }

// interface OpenRouterResponse {
//   choices?: OpenRouterChoice[];
//   error?: { message: string };
// }

// /** Recursively normalizes values for consistent JSON structure. */
// function normalizePatientHistory(data: unknown): unknown {
//   const normalizeValue = (val: unknown): unknown => {
//     if (Array.isArray(val)) return val.map(normalizeValue);

//     if (typeof val === "string") {
//       const trimmed = val.trim();

//       // 🧠 Convert comma-separated strings into arrays
//       if (trimmed.includes(",")) {
//         return trimmed
//           .split(",")
//           .map((s) => s.trim())
//           .filter(Boolean);
//       }

//       // 🧠 Convert "45 years old" → 45
//       const ageRegex = /^(\d{1,3})\s*(years?)?\s*(old)?$/i;
//       const match = ageRegex.exec(trimmed);
//       if (match) {
//         const ageString = match[1];
//         const num = ageString ? parseInt(ageString, 10) : NaN;
//         return isNaN(num) ? null : num;
//       }

//       // 🧠 Convert "none" / "n/a" / "no" → null
//       if (["none", "n/a", "no", "nil"].includes(trimmed.toLowerCase())) {
//         return null;
//       }

//       return trimmed;
//     }

//     if (typeof val === "number") return val;
//     if (val === true) return "yes";
//     if (val === false) return "no";
//     if (val === undefined) return null;
//     if (val === null) return null;

//     if (typeof val === "object" && val !== null) {
//       return Object.fromEntries(
//         Object.entries(val).map(([k, v]) => [k, normalizeValue(v)]),
//       );
//     }

//     return val;
//   };

//   const normalized = normalizeValue(data);

//   // 🧩 Force certain fields to always be arrays
//   if (
//     typeof normalized === "object" &&
//     normalized &&
//     "pastMedicalHistory" in normalized
//   ) {
//     const pmh = (normalized as Record<string, unknown>).pastMedicalHistory as
//       | Record<string, unknown>
//       | undefined;
//     if (pmh) {
//       for (const key of [
//         "chronicDiseases",
//         "hospitalizations",
//         "allergies",
//         "immunizations",
//         "transfusions",
//       ]) {
//         const val = pmh[key];
//         if (typeof val === "string") pmh[key] = [val];
//         if (val === null || val === undefined) pmh[key] = [];
//       }
//     }
//   }

//   if (
//     typeof normalized === "object" &&
//     normalized &&
//     "medications" in normalized
//   ) {
//     const meds = (normalized as Record<string, unknown>).medications as
//       | Record<string, unknown>
//       | undefined;
//     if (meds && typeof meds.supplements === "string") {
//       meds.supplements = [meds.supplements];
//     }
//   }

//   return normalized;
// }

// export async function POST(req: Request) {
//   try {
//     const body = (await req.json()) as { prompt?: string };
//     const prompt = body?.prompt?.trim();

//     if (!prompt) {
//       return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
//     }

//     // 🧼 Clean the text before sending to the model
//     const cleanedPrompt = cleanTranscriptionText(prompt);

//     const systemPrompt = `
//     You are a professional **medical documentation assistant and language model**.
// Your task is to analyze raw doctor–patient conversation transcripts, even if they include typos,
// incorrect spelling, speech recognition errors, or informal expressions.

// Your goal:
// 1. **Correct spelling and grammar** where needed.
// 2. **Interpret the intended meaning** of phrases using context.
// 3. **Extract and organize all medically relevant information** into a JSON object that follows this schema exactly:

// ${PATIENT_HISTORY_SCHEMA_STRING}

// Rules:
// - Always return a valid JSON object (no markdown, no commentary).
// - If any value is missing or uncertain, set it to null.
// - If a value is not explicitly stated but can be reasonably inferred, provide your best guess.
// - If the input text contains errors, infer the correct medical term when possible (e.g., "diaebtes" → "diabetes").
// - Use concise, formal clinical language (e.g., "shortness of breath" instead of "hard to breathe").
// - Dates must be ISO strings (e.g., "2025-10-07"), not numbers.
// - Arrays should be present even if empty.
// - Use English medical terminology.
// - Do NOT include explanations, reasoning, or comments — JSON only.
// - Ensure all string fields are enclosed in quotes.
// - Do not write explanations, only the JSON.
// - Booleans should not appear; use strings or null instead.
// - Keep arrays even if empty (e.g., "associatedSymptoms": []).
// `;

//     const response = await fetch(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "qwen/qwen3-30b-a3b:free",
//           messages: [
//             { role: "system", content: systemPrompt },
//             {
//               role: "user",
//               content: `Doctor–patient conversation:\n${cleanedPrompt}`,
//             },
//           ],
//         }),
//       },
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("OpenRouter API Error:", errorText);
//       return NextResponse.json(
//         { error: "API request failed", details: errorText },
//         { status: 500 },
//       );
//     }

//     const data = (await response.json()) as OpenRouterResponse;

//     const rawText =
//       data?.choices?.[0]?.message?.content ??
//       data?.choices?.[0]?.text ??
//       data?.error?.message ??
//       "";

//     // 🧠 Parse AI JSON safely
//     let parsed: unknown;
//     try {
//       // 🧩 Handle models that return multiple JSON objects concatenated
//       const fixedJson = rawText
//         .trim()
//         // If there are two JSON objects separated by newlines, merge them
//         .replace(/}\s*{/g, ',"')
//         // Fix the extra quote inserted above (replace ,"{ with ,")
//         .replace(/,"/g, ",")
//         // Just in case double commas appear
//         .replace(/,,+/g, ",");

//       parsed = JSON.parse(fixedJson);
//     } catch (err) {
//       console.warn("AI returned invalid JSON:", rawText);
//       return NextResponse.json(
//         { error: "Model output not valid JSON", rawText },
//         { status: 422 },
//       );
//     }

//     // ✅ Normalize before validation
//     const normalizedBeforeValidation = normalizePatientHistory(parsed);

//     const validation = PatientHistorySchema.safeParse(
//       normalizedBeforeValidation,
//     );
//     if (!validation.success) {
//       console.error("Schema validation error:", validation.error.format());
//       return NextResponse.json(
//         {
//           error: "Invalid data shape",
//           issues: validation.error.format(),
//           rawText,
//         },
//         { status: 422 },
//       );
//     }

//     const normalized = normalizePatientHistory(
//       validation.data,
//     ) as PatientHistory;

//     // ✅ Return validated structured data to frontend
//     return NextResponse.json(normalized, { status: 200 });
//   } catch (err: unknown) {
//     const error = err as Error;
//     console.error("Server error:", error);
//     return NextResponse.json(
//       { error: "Server error", details: error.message },
//       { status: 500 },
//     );
//   }
// }
