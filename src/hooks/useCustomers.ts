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
import { getLocalCache, setLocalCache } from "@/lib/cache";
import type { Customer } from "@/types";

// In-memory cache for instant 0ms tab navigation
const memoryCustomersCache: Record<string, Customer[]> = {};

export function useCustomers(areaId: string) {
  const cacheKey = `cablekhata_cust_${areaId}`;

  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (!areaId) return [];
    if (memoryCustomersCache[areaId]?.length > 0) return memoryCustomersCache[areaId];
    const cached = getLocalCache<Customer[]>(cacheKey);
    if (cached && cached.length > 0) {
      memoryCustomersCache[areaId] = cached;
      return cached;
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (!areaId) return false;
    return !(memoryCustomersCache[areaId]?.length > 0);
  });
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
        setLocalCache(cacheKey, data);
        setCustomers(data);
        setLoading(false);
      },
      (err) => {
        console.warn("Could not stream customers:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [areaId, cacheKey]);

  return { customers, loading, error };
}
