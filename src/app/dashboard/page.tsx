// src/app/dashboard/page.tsx
import { getPatientsAction } from "./actions";
import type { Patient } from "~/server/db/schema";
import { DataTable } from "~/components/ui/data-table"; // Assuming you have a generic Shadcn Data Table
import { columns } from "./_components/patient-columns";
import CreatePatientForm from "./_components/create-patient-form";
import { Button } from "~/components/ui/button";
import { UserButton } from "@clerk/nextjs"; // For sign-out/user profile

// This component is a Server Component. It fetches data directly.
export default async function DashboardPage() {
  let patients: Patient[] = [];
  let error: string | null = null;

  try {
    // 1. Fetch data on the server
    patients = await getPatientsAction();
  } catch (e) {
    error = "Failed to load patients. Authentication might be required.";
    console.error(e);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800">
            🩺 Doctor Dashboard
          </h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-gray-800">
            Patient List ({patients.length})
          </h2>
          {/* Create Patient Button (Triggers the modal/form) */}
          <CreatePatientForm>
            <Button>+ New Patient</Button>
          </CreatePatientForm>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
            {error}
          </div>
        )}

        {/* Patient Data Table */}
        {patients.length > 0 ? (
          <DataTable data={patients} columns={columns} />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
            <p className="text-gray-500">No patients recorded yet.</p>
            <p className="mt-2 text-sm text-gray-400">
              Use the &quot;New Patient&quot; button to get started.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
