// src/hooks/usePaymentHistory.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Payment } from "@/types";

export function usePaymentHistory(customerId: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;

    // payments sub-collection under the top-level customers collection
    const paymentsRef = collection(db, "customers", customerId, "payments");
    const q = query(paymentsRef, orderBy("billingMonth", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Payment)
        );
        setPayments(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [customerId]);

  return { payments, loading, error };
}
