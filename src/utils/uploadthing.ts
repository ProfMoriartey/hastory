// src/utils/uploadthing.ts
import { generateReactHelpers, generateUploadButton, generateUploadDropzone } from "@uploadthing/react"; // ✅ Changed function name
import type { OurFileRouter } from "~/app/api/uploadthing/core";

// Use generateReactHelpers instead of generateComponents
// It returns the necessary components and hooks for the client side.
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
  
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
