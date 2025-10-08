import { getPatientsAction } from "./actions";
import type { Patient } from "~/server/db/schema";
import { DataTable } from "~/components/ui/data-table";
import { columns } from "./_components/patient-columns";
import CreatePatientForm from "./_components/create-patient-form";
import { Button } from "~/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import PatientMobileList from "./_components/patient-mobile-list"; // 🎯 Import Mobile List

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

  // --- Layout Constants ---
  const headerContent = (
    <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <h1 className="text-xl font-bold text-gray-800">🩺 Dashboard</h1>
      <UserButton afterSignOutUrl="/" />
    </div>
  );

  const headerControls = (
    <div className="mt-2 mb-4 flex items-center justify-between sm:mt-0">
      <h2 className="text-2xl font-semibold text-gray-800 sm:text-3xl">
        Patients ({patients.length})
      </h2>
      <CreatePatientForm>
        <Button className="bg-blue-600 hover:bg-blue-700">+ New Patient</Button>
      </CreatePatientForm>
    </div>
  );
  // -------------------------

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* 🎯 FIXED HEADER (PWA Feel) */}
      <header className="fixed top-0 z-20 w-full border-b border-gray-200 bg-white shadow-md">
        {headerContent}
      </header>

      {/* Main Content Area: Padding compensates for the fixed header */}
      <main className="mx-auto w-full max-w-5xl px-4 pt-16 pb-8 sm:pt-20">
        {headerControls}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
            {error}
          </div>
        )}

        {/* 🎯 DESKTOP VIEW: Data Table (Hidden on small screens) */}
        <div className="hidden sm:block">
          {patients.length > 0 ? (
            <DataTable data={patients} columns={columns} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm">
              <p className="text-gray-500">No patients recorded yet.</p>
              <p className="mt-2 text-sm text-gray-400">
                Use the &quot;New Patient&quot; button to get started.
              </p>
            </div>
          )}
        </div>

        {/* 🎯 MOBILE VIEW: Card List (Hidden on tablet/desktop) */}
        <div className="sm:hidden">
          {patients.length > 0 ? (
            <PatientMobileList patients={patients} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm">
              <p className="text-gray-500">No patients recorded yet.</p>
              <p className="mt-2 text-sm text-gray-400">
                Use the &quot;New Patient&quot; button to get started.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
