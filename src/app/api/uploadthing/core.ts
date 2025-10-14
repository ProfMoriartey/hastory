// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/server"; 
import { auth } from "@clerk/nextjs/server"; 
const f = createUploadthing();

// 🛑 REMOVE the separate async helper function (handleAuth)

// Define your FileRouter
export const ourFileRouter = {
  // Define an endpoint named 'patientAudio'
 patientAudio: f({ 
 audio: { maxFileSize: "16MB", maxFileCount: 1 } 
 })
 // ✅ FIX: Use an anonymous async function directly in the middleware
 .middleware(async () => {
 const { userId } = await auth();
 
 if (!userId) {
          // Log or throw specific error
          console.error("Upload denied: Clerk userId not found.");
          throw new Error("Unauthorized");
      }
      
      // The return value becomes the metadata
 return { userId };
 })
 // Logic that runs after upload is complete
 .onUploadComplete(async ({ metadata, file }) => {
 // ... (rest of onUploadComplete) ...
 }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;