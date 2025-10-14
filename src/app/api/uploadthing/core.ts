// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/server"; 
import { auth } from "@clerk/nextjs/server"; 
const f = createUploadthing();

// Helper to get the authenticated user ID
const handleAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId };
};

// Define your FileRouter
export const ourFileRouter = {
  // Define an endpoint named 'patientAudio'
  patientAudio: f({ 
    audio: { maxFileSize: "16MB", maxFileCount: 1 } 
  })
    // Apply authentication and metadata check
    .middleware(() => handleAuth())
    // Logic that runs after upload is complete
    .onUploadComplete(async ({ metadata, file }) => {
      // metadata contains { userId: 'user_xyz' } from handleAuth()
      console.log("Upload complete for user:", metadata.userId);
      console.log("File URL:", file.url);
      
      // 💡 Actionable Insight: In a later step, you will save this URL 
      // to your Drizzle database within a Server Action, not here.
      // This step just confirms the file is successfully on S3/Blob storage.
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;