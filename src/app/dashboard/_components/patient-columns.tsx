"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Patient } from "~/server/db/schema";
import PatientActions from "./patient-actions"; // ✅ Import the new component

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
    cell: ({ row }) => row.original.dateOfBirth ?? "N/A",
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => row.original.gender ?? "N/A",
  },
  {
    accessorKey: "createdAt",
    header: "Added On",
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // ✅ Now rendering the Client Component, passing required data as props
      return <PatientActions patient={row.original} />;
    },
  },
];
