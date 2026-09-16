// scripts/seed.mjs
// Run with: node scripts/seed.mjs
// Seeds Firestore with the demo data from the Stitch HTML prototypes.
// Requires NEXT_PUBLIC_FIREBASE_* env vars in .env.local

import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc, collection } from "firebase/firestore";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Seed Data ────────────────────────────────────────────────────
const areas = [
  { id: "surya-hotel", name: "Surya Hotel", description: "Near Bus Stop & Main Road", icon: "hotel", walkOrder: 1, defaultMonthlyFee: 250 },
  { id: "bus-stand", name: "Bus Stand", description: "Ajith Complex & S.B.I. ATM Area", icon: "directions_bus", walkOrder: 2, defaultMonthlyFee: 250 },
  { id: "temple-street", name: "Temple Street", description: "Anna Nagar & Murugan Temple", icon: "temple_hindu", walkOrder: 3, defaultMonthlyFee: 250 },
  { id: "railway-colony", name: "Railway Colony", description: "Government Staff Quarters & Park", icon: "train", walkOrder: 4, defaultMonthlyFee: 250 },
  { id: "main-bazar-road", name: "Main Bazar Road", description: "Shaw & Karunanidhi Street Shops", icon: "storefront", walkOrder: 5, defaultMonthlyFee: 250 },
];

const customers = [
  { id: "cbl012", name: "Ramesh Kumar", phone: "9876543210", address: "12, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "12", walkOrder: 1, stbId: "STB-8831", connectionId: "CBL012", monthlyFee: 250, status: "PAID", isActive: true, collectorNote: "Gate locked in morning, visit after 10 AM" },
  { id: "cbl014", name: "Suresh Murugan", phone: "9765432108", address: "14, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "14", walkOrder: 2, stbId: "STB-9120", connectionId: "CBL014", monthlyFee: 250, status: "PENDING", isActive: true },
  { id: "cbl016", name: "Karthik Selvam", phone: "9654321087", address: "16, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "16", walkOrder: 3, stbId: "STB-9234", connectionId: "CBL016", monthlyFee: 250, status: "PARTIAL", isActive: true },
  { id: "cbl018", name: "Priya Manikandan", phone: "9543210876", address: "18, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "18", walkOrder: 4, stbId: "STB-9345", connectionId: "CBL018", monthlyFee: 300, status: "PAID", isActive: true },
  { id: "cbl020", name: "Selvam Anbazhagan", phone: "9432108765", address: "20, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "20", walkOrder: 5, stbId: "STB-9456", connectionId: "CBL020", monthlyFee: 250, status: "PENDING", isActive: true },
  { id: "cbl022", name: "Anitha Rajan", phone: "9321087654", address: "22, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "22", walkOrder: 6, stbId: "STB-9567", connectionId: "CBL022", monthlyFee: 200, status: "PAID", isActive: true },
];

const payments = {
  cbl012: [
    { id: "pay-sep-cbl012", billingMonth: "2026-09", amount: 250, dueAmount: 250, method: "Cash", paidDate: "2026-09-02T10:30:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-aug-cbl012", billingMonth: "2026-08", amount: 250, dueAmount: 250, method: "UPI", paidDate: "2026-08-03T11:15:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-jul-cbl012", billingMonth: "2026-07", amount: 250, dueAmount: 250, method: "Cash", paidDate: "2026-07-04T09:45:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-jun-cbl012", billingMonth: "2026-06", amount: 250, dueAmount: 250, method: "Cash", paidDate: "2026-06-05T10:00:00.000Z", collectedBy: "Rajesh", status: "PAID" },
  ],
  cbl014: [
    { id: "pay-aug-cbl014", billingMonth: "2026-08", amount: 250, dueAmount: 250, method: "Cash", paidDate: "2026-08-05T14:20:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-jul-cbl014", billingMonth: "2026-07", amount: 250, dueAmount: 250, method: "UPI", paidDate: "2026-07-06T15:10:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-jun-cbl014", billingMonth: "2026-06", amount: 250, dueAmount: 250, method: "Cash", paidDate: "2026-06-07T11:30:00.000Z", collectedBy: "Rajesh", status: "PAID" },
  ],
  cbl018: [
    { id: "pay-sep-cbl018", billingMonth: "2026-09", amount: 300, dueAmount: 300, method: "UPI", paidDate: "2026-09-04T16:00:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-aug-cbl018", billingMonth: "2026-08", amount: 300, dueAmount: 300, method: "UPI", paidDate: "2026-08-04T17:00:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-jul-cbl018", billingMonth: "2026-07", amount: 300, dueAmount: 300, method: "Cash", paidDate: "2026-07-05T16:30:00.000Z", collectedBy: "Rajesh", status: "PAID" },
  ],
  cbl022: [
    { id: "pay-sep-cbl022", billingMonth: "2026-09", amount: 200, dueAmount: 200, method: "Cash", paidDate: "2026-09-03T12:00:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-aug-cbl022", billingMonth: "2026-08", amount: 200, dueAmount: 200, method: "Cash", paidDate: "2026-08-06T10:00:00.000Z", collectedBy: "Rajesh", status: "PAID" },
    { id: "pay-jul-cbl022", billingMonth: "2026-07", amount: 200, dueAmount: 200, method: "Cash", paidDate: "2026-07-07T12:30:00.000Z", collectedBy: "Rajesh", status: "PAID" },
  ],
};

async function seed() {
  console.log("🌱 Seeding Firestore with demo data...\n");

  // Seed areas
  for (const area of areas) {
    const { id, ...data } = area;
    await setDoc(doc(db, "areas", id), { ...data, createdAt: new Date().toISOString() });

    // Add customers as sub-collection
    const areaCustomers = customers.filter((c) => c.areaId === id);
    for (const customer of areaCustomers) {
      const { id: cid, ...cdata } = customer;
      await setDoc(doc(db, "areas", id, "customers", cid), { ...cdata, createdAt: new Date().toISOString() });
    }
    console.log(`✅ Area: ${area.name} (${areaCustomers.length} customers)`);
  }

  // Seed top-level customers + payments
  for (const customer of customers) {
    const { id, ...data } = customer;
    await setDoc(doc(db, "customers", id), { ...data, createdAt: new Date().toISOString() });

    const customerPayments = payments[id] ?? [];
    for (const payment of customerPayments) {
      const { id: pid, ...pdata } = payment;
      const fullPayment = {
        ...pdata,
        customerId: id,
        customerName: customer.name,
        areaId: customer.areaId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "customers", id, "payments", pid), fullPayment);
      await setDoc(doc(db, "payments", pid), fullPayment);
    }
    if (customerPayments.length > 0) {
      console.log(`  💰 ${customer.name}: ${customerPayments.length} payment records`);
    }
  }

  console.log("\n✅ Seeding complete! Open your app and connect Firebase to see real data.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
