// src/db/schema.ts

import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { type PatientHistory } from "~/lib/patientHistorySchema"; 
import { sql } from "drizzle-orm"; // For defaultNow()

// 1. Users Table (Top-level ownership)
export const users = pgTable("users", {
  // Uses Clerk's ID as the primary key for direct linkage
  id: text("id").primaryKey(), 
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Define relations for the users table
export const usersRelations = relations(users, ({ many }) => ({
  patients: many(patients), // A user can have many patients
}));

// 2. Patients Table (Demographics and User Link)
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  // Foreign Key to the specific User
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), 
  
  // Patient details
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  // You might add initial notes or demographics here
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Define relations for the patients table
export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, { // A patient belongs to one user
    fields: [patients.userId],
    references: [users.id],
  }),
  sessions: many(sessions), // A patient can have many sessions/visits
}));


// 3. Sessions Table (Individual visits/reports)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  
  // Foreign Key to the specific Patient
  patientId: serial("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }), // Link to patients
  
  // The raw transcript or input text
  transcript: text("transcript").notNull(), 
  
  // The structured, Zod-validated JSON report data
  // Using $type ensures TypeScript knows the JSON structure
  structuredData: jsonb("structured_data").$type<PatientHistory>().notNull(), 
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Define relations for the sessions table
export const sessionsRelations = relations(sessions, ({ one }) => ({
  patient: one(patients, { // A session belongs to one patient
    fields: [sessions.patientId],
    references: [patients.id],
  }),
}));


// Type Exports for Drizzle operations
export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;