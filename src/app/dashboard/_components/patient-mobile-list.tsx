"use client";

import type { Patient } from "~/server/db/schema";
import { Button } from "~/components/ui/button";
import {
  ArrowRight,
  Edit,
  Trash2,
  Calendar,
  User,
  Baby,
  MoreHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { deletePatientAction } from "../actions";
import { useState } from "react";
import { toast } from "react-hot-toast";
import EditPatientDialog from "./edit-patient-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";

interface PatientMobileListProps {
  patients: Patient[];
}

export default function PatientMobileList({
  patients,
}: PatientMobileListProps) {
  // 🎯 State to track which patient's edit dialog is open
  const [isEditingId, setIsEditingId] = useState<number | null>(null);

  const handleDelete = async (patientId: number, patientName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete patient ${patientName} and all their sessions?`,
      )
    ) {
      return;
    }

    void toast.promise(deletePatientAction(patientId), {
      loading: `Deleting ${patientName}...`,
      success: "Patient deleted successfully.",
      // ✅ FIX: Safely access the 'error' property
      error: (err: { error?: string }) =>
        `Deletion failed: ${(err as { error?: string })?.error ?? "Server error"}`,
    });
  };

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          className="border-t-4 border-blue-500 shadow-lg transition hover:shadow-xl"
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-gray-800">
                {patient.name}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Patient ID: {patient.id}
              </CardDescription>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a
                    href={`/patient/${patient.id}/new-session`}
                    className="flex items-center"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" /> Start Session
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  // 🎯 Set the state to open the dialog for THIS patient
                  onClick={() => setIsEditingId(patient.id)}
                  className="text-blue-600 focus:text-blue-700"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(patient.id, patient.name)}
                  className="text-red-600 focus:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-1 p-4 pt-2 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="mr-2 h-4 w-4 text-blue-500" />
              <span>DOB: {patient.dateOfBirth ?? "N/A"}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Baby className="mr-2 h-4 w-4 text-blue-500" />
              <span>Gender: {patient.gender ?? "N/A"}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <User className="mr-2 h-4 w-4 text-blue-500" />
              <span>
                Added: {new Date(patient.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
              <a href={`/patient/${patient.id}/new-session`}>
                Start New Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </Card>
      ))}

      {/* 🎯 Render Edit Dialog outside the map, conditional on the state */}
      {patients.map((patient) => (
        <EditPatientDialog
          key={`edit-${patient.id}`}
          patient={patient}
          // Set 'open' based on whether this patient ID matches the editing ID
          open={isEditingId === patient.id}
          // When the dialog closes, clear the editing ID
          onOpenChange={(open) => {
            if (!open) setIsEditingId(null);
          }}
        />
      ))}
    </div>
  );
}
