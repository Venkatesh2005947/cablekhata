// src/hooks/useAreas.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Area, AreaWithStats, Customer } from "@/types";

export function useAreas() {
  const [areas, setAreas] = useState<AreaWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const areasRef = collection(db, "areas");
    const q = query(areasRef, orderBy("walkOrder", "asc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const areasWithStats: AreaWithStats[] = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const area = { id: doc.id, ...doc.data() } as Area;

              // Fetch customer stats for this area
              const customersRef = collection(db, "areas", doc.id, "customers");
              const customerSnap = await getDocs(customersRef);
              const customers = customerSnap.docs.map(
                (c) => ({ id: c.id, ...c.data() } as Customer)
              );

              const paidCount = customers.filter((c) => c.status === "PAID").length;
              const pendingCount = customers.filter(
                (c) => c.status === "PENDING" || c.status === "OVERDUE"
              ).length;
              const partialCount = customers.filter(
                (c) => c.status === "PARTIAL"
              ).length;
              const targetAmount = customers.reduce(
                (sum, c) => sum + (c.monthlyFee || 0),
                0
              );
              // Approximate collected: paid customers' full fee + partial customers' partial payments
              // For now we use the target of paid customers as collected
              const collectedAmount = customers
                .filter((c) => c.status === "PAID")
                .reduce((sum, c) => sum + (c.monthlyFee || 0), 0);

              return {
                ...area,
                totalHouses: customers.length,
                paidCount,
                pendingCount,
                partialCount,
                collectedAmount,
                targetAmount,
                progressPercent:
                  targetAmount > 0
                    ? Math.round((collectedAmount / targetAmount) * 100)
                    : 0,
              };
            })
          );
          setAreas(areasWithStats);
          setLoading(false);
        } catch (err) {
          setError("Failed to load areas");
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { areas, loading, error };
}
