"use client";

import { useState } from "react";
import type { Patient } from "~/server/db/schema";
import { Button } from "~/components/ui/button";
import {
  ArrowRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { deletePatientAction } from "../actions";
import EditPatientDialog from "./edit-patient-dialog";
import { toast } from "react-hot-toast";

interface PatientActionsProps {
  patient: Patient;
}

export default function PatientActions({ patient }: PatientActionsProps) {
  // ✅ Hooks are now used inside a proper React component
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete patient ${patient.name} and all their sessions?`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    const result = await deletePatientAction(patient.id);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(`Patient ${patient.name} deleted successfully.`);
    }
    setIsDeleting(false);
  };

  return (
    <div className="flex justify-end">
      <EditPatientDialog
        patient={patient}
        open={isEditing}
        onOpenChange={setIsEditing}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a
                href={`/patient/${patient.id}/new-session`}
                className="flex items-center"
              >
                <ArrowRight className="mr-2 h-4 w-4" /> Start Session
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsEditing(true)}
              className="text-blue-600 focus:text-blue-700"
              disabled={isDeleting}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Patient
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </EditPatientDialog>
    </div>
  );
}
