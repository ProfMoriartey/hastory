// src/components/shared/AudioUploader.tsx
"use client";

// ✅ Correct Import: Import the *typed* component from your utility file
import { UploadDropzone } from "~/utils/uploadthing";
// 🛑 Remove the unused generic import:
// import { type OurFileRouter } from "~/app/api/uploadthing/core";

interface AudioUploaderProps {
  onClientUploadComplete: (res: { url: string }[]) => void;
  onUploadError: (error: Error) => void;
}

export function AudioUploader({
  onClientUploadComplete,
  onUploadError,
}: AudioUploaderProps) {
  return (
    // 🛑 REMOVED GENERIC: UploadDropzone is already typed via generateUploadDropzone
    // <UploadDropzone<OurFileRouter>
    <UploadDropzone
      // ✅ Endpoint slug is passed as a string prop (must match core.ts slug)
      endpoint="patientAudio"
      onClientUploadComplete={(res) => {
        onClientUploadComplete(res as { url: string }[]);
      }}
      onUploadError={(error: Error) => {
        onUploadError(error);
      }}
      className="mt-4 h-10 w-50 cursor-pointer rounded-lg border border-dashed border-gray-300 p-4 hover:border-blue-500"
      content={{
        label: "Upload",
        allowedContent: "Audio (max 16MB)",
      }}
    />
  );
}
