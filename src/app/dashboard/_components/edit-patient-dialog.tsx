"use client";

import * as React from "react";
import type { Patient } from "~/server/db/schema";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { updatePatientAction } from "../actions";
import { useFormStatus } from "react-dom";
import { toast } from "react-hot-toast";

interface EditPatientDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

export default function EditPatientDialog({
  patient,
  open,
  onOpenChange,
  children,
}: EditPatientDialogProps) {
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setFormError(null);

    // Add patient ID to the form data for the Server Action
    formData.append("id", patient.id.toString());

    const result = await updatePatientAction(formData);

    if ("error" in result) {
      setFormError(result.error);
      toast.error("Update failed.");
    } else {
      toast.success(`Patient ${patient.name} updated.`);
      onOpenChange(false); // Close modal on success
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The dropdown menu trigger */}
      {children}

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Patient: {patient.name}</DialogTitle>
          <DialogDescription>
            Update basic demographic information below.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={patient.name}
                required
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateOfBirth" className="text-right">
                DOB
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="text"
                defaultValue={patient.dateOfBirth ?? ""}
                placeholder="YYYY-MM-DD"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Gender
              </Label>
              <Input
                id="gender"
                name="gender"
                defaultValue={patient.gender ?? ""}
                placeholder="Male/Female/Other"
                className="col-span-3"
              />
            </div>
          </div>

          {formError && (
            <p className="mb-4 text-sm text-red-600">{formError}</p>
          )}

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
