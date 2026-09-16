// src/lib/payments.ts
// Utility to record payments and update customer balances in Firestore in real time.

import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Customer, PaymentMethod, PaymentStatus } from "@/types";
import { showToast } from "@/components/ui/Toast";

export interface RecordPaymentParams {
  customer: Customer;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  collectorName?: string;
}

export async function recordPayment({
  customer,
  amount,
  method,
  notes = "",
  collectorName = "Operator",
}: RecordPaymentParams): Promise<boolean> {
  if (!customer || !customer.id) {
    showToast({ message: "Invalid customer selected", icon: "error" });
    return false;
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    showToast({ message: "Please enter a valid amount", icon: "warning" });
    return false;
  }

  try {
    const now = new Date();
    const billingMonth = now.toISOString().slice(0, 7); // e.g. "2026-09"
    const nowIso = now.toISOString();

    // Determine status
    let newStatus: PaymentStatus = "PAID";
    if (numAmount < customer.monthlyFee) {
      newStatus = "PARTIAL";
    }

    const paymentData = {
      customerId: customer.id,
      customerName: customer.name,
      areaId: customer.areaId,
      billingMonth,
      amount: numAmount,
      dueAmount: customer.monthlyFee,
      method,
      paidDate: nowIso,
      collectedBy: collectorName,
      notes,
      status: newStatus,
      createdAt: nowIso,
    };

    // 1. Add payment record to customers/{customerId}/payments
    const paymentsRef = collection(db, "customers", customer.id, "payments");
    await addDoc(paymentsRef, paymentData);

    // 1b. Also add to root 'payments' collection for fast feed & collection reports
    await addDoc(collection(db, "payments"), paymentData);

    // 2. Update customer document in area subcollection (for useCustomers & useAreas hooks)
    if (customer.areaId) {
      const areaCustRef = doc(db, "areas", customer.areaId, "customers", customer.id);
      await updateDoc(areaCustRef, {
        status: newStatus,
        lastPaidAmount: numAmount,
        lastPaidDate: nowIso,
        updatedAt: nowIso,
      });
    }

    // 3. Update top-level customer document
    const topCustRef = doc(db, "customers", customer.id);
    await updateDoc(topCustRef, {
      status: newStatus,
      lastPaidAmount: numAmount,
      lastPaidDate: nowIso,
      updatedAt: nowIso,
    });

    showToast({
      message: `₹${numAmount} ${method} recorded for ${customer.name}`,
      icon: "check_circle",
    });

    return true;
  } catch (error: any) {
    console.error("Failed to record payment:", error);
    showToast({
      message: error?.message || "Failed to save payment",
      icon: "error",
    });
    return false;
  }
}
