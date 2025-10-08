// src/app/dashboard/_components/patient-columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Patient } from "~/server/db/schema";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

// Define the columns for the Shadcn Data Table
export const columns: ColumnDef<Patient>[] = [
  {
    accessorKey: "name",
    header: "Patient Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "dateOfBirth",
    header: "D.O.B",
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "createdAt",
    header: "Added On",
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="link" asChild>
        {/* 🎯 This link navigates to the patient-specific session view */}
        <a href={`/patient/${row.original.id}`}>
          View Sessions <ArrowRight className="ml-1 h-4 w-4" />
        </a>
      </Button>
    ),
  },
];
