// src/types/index.ts
// Shared TypeScript types matching the Firestore data model

export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
export type PaymentMethod = "Cash" | "UPI" | "Cheque" | "Other";

// ─── Area ──────────────────────────────────────────────────────────
export interface Area {
  id: string;
  name: string;               // e.g. "Surya Hotel"
  description: string;        // e.g. "Near Bus Stop & Main Road"
  icon: string;               // Material Symbol name, e.g. "location_on"
  walkOrder: number;          // Route stop number (1, 2, 3…)
  defaultMonthlyFee: number;  // Default plan for new customers in this area
  collectorNotes?: string;    // e.g. "Shops close at 1:30 PM"
  createdAt: string;          // ISO date string
}

// ─── Customer ──────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;               // e.g. "Ramesh Kumar"
  phone: string;              // e.g. "9876543210"
  address: string;            // Full free-text address
  areaId: string;             // FK → areas/{areaId}
  areaName: string;           // Denormalized for display
  houseNumber: string;        // e.g. "12"
  walkOrder: number;          // Order within the area route
  stbId: string;              // Set-Top Box ID, e.g. "STB-8831"
  connectionId: string;       // e.g. "CBL012"
  monthlyFee: number;         // e.g. 250
  status: PaymentStatus;      // Current month's status
  collectorNote?: string;     // e.g. "Gate locked in morning"
  isActive: boolean;
  createdAt: string;
}

// ─── Payment Record ────────────────────────────────────────────────
export interface Payment {
  id: string;
  customerId: string;
  customerName: string;       // Denormalized for reports
  areaId: string;
  billingMonth: string;       // Format: "YYYY-MM", e.g. "2026-09"
  amount: number;             // Amount actually paid
  dueAmount: number;          // Full monthly fee
  method: PaymentMethod;
  paidDate: string;           // ISO date string
  collectedBy: string;        // Collector name / userId
  notes?: string;             // e.g. "Paid at gate"
  status: PaymentStatus;
  createdAt: string;
}

// ─── Collection Session ────────────────────────────────────────────
export interface CollectionSession {
  id: string;
  date: string;               // "YYYY-MM-DD"
  collectorId: string;
  collectorName: string;
  totalCollected: number;
  totalPending: number;
  totalHouses: number;
  paidHouses: number;
  pendingHouses: number;
  partialHouses: number;
}

// ─── UI helpers ────────────────────────────────────────────────────
export interface AreaWithStats extends Area {
  totalHouses: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
  collectedAmount: number;
  targetAmount: number;
  progressPercent: number;
}
