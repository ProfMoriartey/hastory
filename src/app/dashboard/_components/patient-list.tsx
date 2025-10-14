"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Patient } from "~/server/db/schema";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Edit, Trash2, Loader2, User, Calendar, Baby } from "lucide-react";
import { deletePatientAction } from "../actions";
import EditPatientDialog from "./edit-patient-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import toast from "react-hot-toast";

interface PatientListProps {
  patients: Patient[];
}

export default function PatientList({ patients }: PatientListProps) {
  const router = useRouter();
  const [isEditingId, setIsEditingId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const handleDelete = async (patientId: number, patientName: string) => {
    setIsDeletingId(patientId);

    const result = await deletePatientAction(patientId);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(`Patient ${patientName} and all sessions deleted.`);
    }
    setIsDeletingId(null);
  };

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          className="shadow-md transition duration-200 hover:shadow-lg"
        >
          {/* Main Card Content Container: Uses flex to stack on mobile, but uses grid to align text on desktop */}
          <CardContent className="flex flex-col gap-3 p-4 sm:gap-0">
            <div className="flex w-full items-start justify-between">
              {/* Patient Info Column */}
              <div
                className="flex flex-grow cursor-pointer items-start pr-4"
                onClick={() => router.push(`/patient/${patient.id}`)}
              >
                <User className="mt-1 mr-4 hidden h-6 w-6 flex-shrink-0 text-blue-600 sm:block" />

                {/* Name and Details Container */}
                <div className="flex w-full flex-col">
                  <span className="flex items-center text-xl font-bold text-gray-800">
                    {/* User icon on mobile */}
                    <User className="mr-2 h-5 w-5 text-blue-600 sm:hidden" />
                    {patient.name}
                  </span>

                  {/* Details Row: Stacks on mobile, remains inline on desktop */}
                  <div className="mt-1 flex flex-col text-sm text-gray-500 sm:flex-row sm:gap-4">
                    <span className="flex items-center">
                      <Baby className="mr-1 h-3 w-3" />
                      DOB: {patient.dateOfBirth ?? "N/A"}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Added: {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Column (Top Right) */}
              <div className="flex flex-shrink-0 justify-end gap-2 pt-1">
                {/* Edit Button (Opens Dialog) */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card navigation
                    setIsEditingId(patient.id);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                {/* Delete Button (Opens Alert Dialog) */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeletingId === patient.id}
                      onClick={(e) => e.stopPropagation()} // Prevent card navigation
                    >
                      {isDeletingId === patient.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete patient{" "}
                        <span className="font-bold">{patient.name}</span> and
                        all their associated session reports? This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(patient.id, patient.name)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeletingId === patient.id}
                      >
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* RENDER EDIT MODAL (Managed by state) */}
      {isEditingId !== null && (
        <EditPatientDialog
          // ✅ FIX: Use the '!' operator
          patient={patients.find((p) => p.id === isEditingId)!}
          open={true}
          onOpenChange={(open) => {
            if (!open) setIsEditingId(null);
          }}
        />
      )}
    </div>
  );
}
