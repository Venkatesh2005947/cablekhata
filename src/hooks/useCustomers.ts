// src/hooks/useCustomers.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Customer } from "@/types";

// In-memory cache for instant 0ms tab navigation
const memoryCustomersCache: Record<string, Customer[]> = {};

export function useCustomers(areaId: string) {
  const [customers, setCustomers] = useState<Customer[]>(
    () => (areaId ? memoryCustomersCache[areaId] || [] : [])
  );
  const [loading, setLoading] = useState<boolean>(() => (areaId ? !memoryCustomersCache[areaId] : true));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!areaId) return;

    const customersRef = collection(db, "areas", areaId, "customers");
    const q = query(customersRef, orderBy("walkOrder", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Customer)
        );
        memoryCustomersCache[areaId] = data;
        setCustomers(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [areaId]);

  return { customers, loading, error };
}
