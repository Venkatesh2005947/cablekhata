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

const DEFAULT_SURYA_CUSTOMERS: Customer[] = [
  { id: "cbl012", name: "Ramesh Kumar", phone: "9876543210", address: "12, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "12", walkOrder: 1, stbId: "STB-8831", connectionId: "CBL012", monthlyFee: 250, status: "PAID", isActive: true, collectorNote: "Gate locked in morning, visit after 10 AM", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cbl014", name: "Suresh Murugan", phone: "9765432108", address: "14, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "14", walkOrder: 2, stbId: "STB-9120", connectionId: "CBL014", monthlyFee: 250, status: "PENDING", isActive: true, createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cbl016", name: "Karthik Selvam", phone: "9654321087", address: "16, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "16", walkOrder: 3, stbId: "STB-9234", connectionId: "CBL016", monthlyFee: 250, status: "PARTIAL", isActive: true, createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cbl018", name: "Priya Manikandan", phone: "9543210876", address: "18, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "18", walkOrder: 4, stbId: "STB-9345", connectionId: "CBL018", monthlyFee: 300, status: "PAID", isActive: true, createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cbl020", name: "Selvam Anbazhagan", phone: "9432108765", address: "20, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "20", walkOrder: 5, stbId: "STB-9456", connectionId: "CBL020", monthlyFee: 250, status: "PENDING", isActive: true, createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cbl022", name: "Anitha Rajan", phone: "9321087654", address: "22, Gandhi Street, Near Surya Hotel, Srivilliputhur", areaId: "surya-hotel", areaName: "Surya Hotel", houseNumber: "22", walkOrder: 6, stbId: "STB-9567", connectionId: "CBL022", monthlyFee: 200, status: "PAID", isActive: true, createdAt: "2026-09-01T00:00:00.000Z" },
];

function getInitialCustomers(areaId: string): Customer[] {
  if (!areaId) return [];
  if (memoryCustomersCache[areaId]?.length > 0) return memoryCustomersCache[areaId];

  // 1. Check area-specific local cache
  const cached = getLocalCache<Customer[]>(`cablekhata_cust_${areaId}`);
  if (cached && cached.length > 0) {
    memoryCustomersCache[areaId] = cached;
    return cached;
  }

  // 2. Check full collectionGroup cache from useAreas
  const allCusts = getLocalCache<Customer[]>("cablekhata_customers_subcoll_v3");
  if (allCusts && allCusts.length > 0) {
    const areaCusts = allCusts.filter((c) => c.areaId === areaId);
    if (areaCusts.length > 0) {
      memoryCustomersCache[areaId] = areaCusts;
      return areaCusts;
    }
  }

  // 3. Fallback default for demo area
  if (areaId === "surya-hotel") {
    return DEFAULT_SURYA_CUSTOMERS;
  }

  return [];
}

export function useCustomers(areaId: string) {
  const cacheKey = `cablekhata_cust_${areaId}`;

  const [customers, setCustomers] = useState<Customer[]>(() => getInitialCustomers(areaId));
  const [loading, setLoading] = useState<boolean>(() => {
    if (!areaId) return false;
    const initial = getInitialCustomers(areaId);
    return initial.length === 0;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!areaId) return;

    let connected = false;
    const timeout = setTimeout(() => {
      if (!connected) {
        setLoading(false);
      }
    }, 8_000);

    const customersRef = collection(db, "areas", areaId, "customers");
    const q = query(customersRef, orderBy("walkOrder", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        connected = true;
        clearTimeout(timeout);
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Customer))
          .filter((c) => c.isActive !== false);
        memoryCustomersCache[areaId] = data;
        setLocalCache(cacheKey, data);
        setCustomers(data);
        setLoading(false);
      },
      (err) => {
        connected = true;
        clearTimeout(timeout);
        console.warn("Could not stream customers:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [areaId, cacheKey]);

  return { customers, loading, error };
}
