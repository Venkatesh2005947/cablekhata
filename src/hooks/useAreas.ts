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

// Global in-memory cache to make page switches 0ms instant
let memoryAreasCache: AreaWithStats[] | null = null;

export function useAreas() {
  const [areas, setAreas] = useState<AreaWithStats[]>(() => memoryAreasCache || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryAreasCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const areasRef = collection(db, "areas");
    const q = query(areasRef, orderBy("walkOrder", "asc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          // 1. Fetch all customers once in a single fast query instead of N separate queries
          const customersSnap = await getDocs(collection(db, "customers"));
          const allCustomers = customersSnap.docs.map(
            (c) => ({ id: c.id, ...c.data() } as Customer)
          );

          // 2. Group customers by areaId in memory (0ms)
          const customersByArea: Record<string, Customer[]> = {};
          allCustomers.forEach((c) => {
            const aId = c.areaId || "";
            if (!customersByArea[aId]) customersByArea[aId] = [];
            customersByArea[aId].push(c);
          });

          // 3. Map areas with instant computed stats
          const areasWithStats: AreaWithStats[] = snapshot.docs.map((doc) => {
            const area = { id: doc.id, ...doc.data() } as Area;
            const areaCustomers = customersByArea[doc.id] || [];

            const paidCount = areaCustomers.filter((c) => c.status === "PAID").length;
            const pendingCount = areaCustomers.filter(
              (c) => c.status === "PENDING" || c.status === "OVERDUE"
            ).length;
            const partialCount = areaCustomers.filter(
              (c) => c.status === "PARTIAL"
            ).length;
            const targetAmount = areaCustomers.reduce(
              (sum, c) => sum + (c.monthlyFee || 0),
              0
            );
            const collectedAmount = areaCustomers
              .filter((c) => c.status === "PAID")
              .reduce((sum, c) => sum + (c.monthlyFee || 0), 0);

            return {
              ...area,
              totalHouses: areaCustomers.length,
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
          });

          memoryAreasCache = areasWithStats;
          setAreas(areasWithStats);
          setLoading(false);
        } catch (err: any) {
          console.error("Failed to load areas:", err);
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
