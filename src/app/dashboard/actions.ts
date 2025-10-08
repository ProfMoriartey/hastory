// src/app/dashboard/actions.ts
"use server";

import { db } from "~/server/db/index"; // Assuming your Drizzle client instance
import { patients, users, type NewPatient, type Patient } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

async function syncUser(userId: string): Promise<void> {
  // Drizzle's insert operation handles conflict resolution for upsert logic.
  await db.insert(users)
    .values({ id: userId })
    // If a conflict occurs on the primary key (id), do nothing.
    // This is the efficient way to check and insert in one atomic step.
    .onConflictDoNothing({ target: users.id }); 
}

// --- Schemas for Server Action Input Validation (Zod) ---

const CreatePatientSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

// --- Read Action: Fetch Patients ---

/** Fetches all patients belonging to the logged-in user. */
export async function getPatientsAction(): Promise<Patient[]> {
  const { userId } = await auth();
  if (!userId) {
    // In a protected route, this case should ideally not happen.
    // Throwing an error ensures security.
    throw new Error("Unauthorized: User ID not available.");
  }

  // Fetch patients where the userId matches the current user
  const patientList = await db.query.patients.findMany({
    where: eq(patients.userId, userId),
    orderBy: [patients.name],
  });

  return patientList;
}

// --- Create Action: Create New Patient ---

/** Creates a new patient linked to the logged-in user. */
export async function createPatientAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Authentication required to create a patient." };
  }

  // 🎯 STEP 1: JIT SYNC
  try {
    await syncUser(userId); 
  } catch (syncError) {
    console.error("JIT User Sync Failed:", syncError);
    return { error: "Failed to verify user identity." };
  }
  
  // 2. Validate Form Data using Zod (UNCHANGED)
  const validationResult = CreatePatientSchema.safeParse({
    name: formData.get("name"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message ?? "Invalid form data.";
    return { error: `Invalid input: ${errorMessage}` };
  }

  const newPatientData: NewPatient = {
    userId: userId,
    name: validationResult.data.name,
    dateOfBirth: validationResult.data.dateOfBirth,
    gender: validationResult.data.gender,
  };

  try {
    // 3. Insert into 'patients' (now guaranteed to pass foreign key check)
    await db.insert(patients).values(newPatientData);

    // 4. Revalidate the dashboard page
    revalidatePath("/dashboard");

    return { success: true };
  } catch (e) {
    console.error("Database error creating patient:", e);
    return { error: "Database error. Could not create patient." };
  }
}

// --- Schema for Update Action Input Validation ---
const UpdatePatientSchema = z.object({
  id: z.coerce.number().int().positive(), // Ensure ID is a positive number
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

// --- Action: Update Existing Patient ---

/** Updates an existing patient's details, verifying user ownership. */
export async function updatePatientAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth();
  const id = formData.get("id");

  if (!userId) {
    return { error: "Authentication required." };
  }
  
  // 1. Validate Form Data
  const validationResult = UpdatePatientSchema.safeParse({
    id: id,
    name: formData.get("name"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message ?? "Invalid update data.";
    return { error: `Validation error: ${errorMessage}` };
  }
  
  const { id: patientId, ...dataToUpdate } = validationResult.data;

  try {
    // 2. Perform the update with Drizzle, using a complex WHERE clause (userId AND patientId)
    const updatedPatients = await db.update(patients)
    .set(dataToUpdate)
    .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, userId)
    ))
    // ✅ FIX: Use .returning() to get the list of affected rows
    .returning({ id: patients.id }); // Only return the ID column for efficiency
    
// Check if any row was actually updated by checking the array length
if (updatedPatients.length === 0) {
    // This means the patient ID didn't exist OR it belonged to another user.
    return { error: "Update failed: Patient not found or ownership invalid." };
}

    // 3. Revalidate the dashboard
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("Database error updating patient:", e);
    return { error: "Database error. Could not update patient." };
  }
}

// --- Action: Delete Patient ---

/** Deletes a patient and all associated sessions, verifying user ownership. */
export async function deletePatientAction(
  patientId: number, // Expect the ID directly, not FormData
): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Authentication required." };
  }
  
  // Zod validation for the ID
  const idValidation = z.number().int().positive().safeParse(patientId);
  if (!idValidation.success) {
      return { error: "Invalid patient ID format." };
  }

  try {
    // 1. Perform the delete with Drizzle, ensuring ownership
    // onDelete: "cascade" in the schema handles deleting all related sessions automatically.
    const deletedPatients = await db.delete(patients)
    .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, userId)
    ))
    // ✅ FIX: Use .returning() to get the list of affected rows
    .returning({ id: patients.id }); 
    
// Check if any row was deleted by checking the array length
if (deletedPatients.length === 0) {
    return { error: "Deletion failed: Patient not found or ownership invalid." };
}

    // 2. Revalidate the dashboard
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("Database error deleting patient:", e);
    return { error: "Database error. Could not delete patient." };
  }
}