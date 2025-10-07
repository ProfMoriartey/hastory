/**
 * Cleans and normalizes transcription text before sending to the AI model.
 * - Fixes common typos and phonetic errors.
 * - Collapses whitespace.
 * - Trims the result.
 */

const CORRECTION_MAP: Record<string, string> = {
  // general misspellings
  ptint: "patient",
  patent: "patient",
  pationt: "patient",
  docter: "doctor",
  temparature: "temperature",
  temprature: "temperature",
  inflamation: "inflammation",
  diaebtes: "diabetes",
  diabetus: "diabetes",
  hipertnsion: "hypertension",
  hipertenion: "hypertension",
  presure: "pressure",
  feaver: "fever",
  couh: "cough",
  sour: "sore",
  throght: "throat",
  breth: "breath",
  shorntess: "shortness",
  hart: "heart",
  stomac: "stomach",
  liverd: "liver",
  kidny: "kidney",
  alergie: "allergy",
  medicne: "medicine",
  injction: "injection",
  opertion: "operation",
  surgury: "surgery",
  abdomnal: "abdominal",
  painfull: "painful",
  ankel: "ankle",
  faver: "fever",
  chiken: "chicken",
  pox: "pox",
  diareah: "diarrhea",
  vomting: "vomiting",
  constpation: "constipation",
  hypertention: "hypertension",
  // abbreviations commonly used in medical dictations
  bp: "blood pressure",
  hr: "heart rate",
  rr: "respiratory rate",
  temp: "temperature",
  hx: "history",
  dx: "diagnosis",
  tx: "treatment",
  sx: "symptoms",
  rx: "prescription",
};

/**
 * Safely cleans transcription text.
 * - Replaces known typos from CORRECTION_MAP
 * - Collapses whitespace
 * - Trims leading/trailing spaces
 */
export function cleanTranscriptionText(input: string): string {
  let output = input.toLowerCase();

  // Replace all known typos
  for (const [wrong, correct] of Object.entries(CORRECTION_MAP)) {
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    output = output.replace(regex, correct);
  }

  // Collapse extra spaces and trim
  output = output.replace(/\s+/g, " ").trim();

  return output;
}
