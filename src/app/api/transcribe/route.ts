// import { NextResponse } from "next/server";

// interface TranscriptionResponse {
//   text?: string;
//   error?: string;
// }

// export async function POST(req: Request): Promise<NextResponse<TranscriptionResponse>> {
//   try {
//     const formData = await req.formData();
//     const audio = formData.get("audio") as File | null;

//     if (!audio) {
//       return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
//     }

//     // Build multipart/form-data for OpenAI endpoint
//     const upload = new FormData();
//     upload.append("file", new File([audio], "recording.ogg", { type: "audio/ogg" }));
//     upload.append("model", "gpt-4o-mini-transcribe");

//     const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
//       },
//       body: upload,
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("OpenAI API error:", errorText);
//       return NextResponse.json(
//         { error: "Transcription failed", details: errorText },
//         { status: 500 }
//       );
//     }

//     const data = (await response.json()) as { text?: string };
//     const text = data.text ?? "No transcription returned.";

//     return NextResponse.json({ text });
//   } catch (err) {
//     const error = err as Error;
//     console.error("Transcription error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
