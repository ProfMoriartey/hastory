// src/app/dashboard/_components/create-patient-form.tsx
"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "~/components/ui/dialog";
import { createPatientAction } from "../actions";
import { useFormStatus } from "react-dom"; // Hook for form submission status

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Create Patient"}
    </Button>
  );
}

export default function CreatePatientForm({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Define the Server Action function directly
  const handleSubmit = async (formData: FormData) => {
    setFormError(null);
    const result = await createPatientAction(formData);

    // ✅ FIX: Use the 'in' operator for type narrowing
    if ("error" in result) {
      setFormError(result.error);
    } else {
      setOpen(false); // Close modal on success
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter the patient&apos;s basic details to create a new record.
          </DialogDescription>
        </DialogHeader>

        {/* 🎯 Use the Server Action directly on the form */}
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
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
