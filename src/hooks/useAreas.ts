// src/hooks/useAreas.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLocalCache, setLocalCache } from "@/lib/cache";
import type { Area, AreaWithStats, Customer } from "@/types";

const CACHE_KEY = "cablekhata_cached_areas_v2";
const CUSTOMERS_CACHE_KEY = "cablekhata_customers_subcoll_v3";
// Cache TTL: 5 minutes — after this, show a brief skeleton on first load
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_TS_KEY = "cablekhata_customers_cache_ts";

// Global in-memory cache to make tab switches 0ms instant
let memoryAreasCache: AreaWithStats[] | null = null;
let memoryCustomersCache: Customer[] | null = null;

export const DEFAULT_AREAS: AreaWithStats[] = [
  {
    id: "surya-hotel",
    name: "Surya Hotel",
    description: "Near Bus Stop & Main Road",
    icon: "hotel",
    walkOrder: 1,
    defaultMonthlyFee: 250,
    totalHouses: 6,
    paidCount: 3,
    pendingCount: 2,
    partialCount: 1,
    collectedAmount: 750,
    targetAmount: 1450,
    progressPercent: 52,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "bus-stand",
    name: "Bus Stand",
    description: "Ajith Complex & S.B.I. ATM Area",
    icon: "directions_bus",
    walkOrder: 2,
    defaultMonthlyFee: 250,
    totalHouses: 0,
    paidCount: 0,
    pendingCount: 0,
    partialCount: 0,
    collectedAmount: 0,
    targetAmount: 0,
    progressPercent: 0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "temple-street",
    name: "Temple Street",
    description: "Anna Nagar & Murugan Temple",
    icon: "temple_hindu",
    walkOrder: 3,
    defaultMonthlyFee: 250,
    totalHouses: 0,
    paidCount: 0,
    pendingCount: 0,
    partialCount: 0,
    collectedAmount: 0,
    targetAmount: 0,
    progressPercent: 0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "railway-colony",
    name: "Railway Colony",
    description: "Government Staff Quarters & Park",
    icon: "train",
    walkOrder: 4,
    defaultMonthlyFee: 250,
    totalHouses: 0,
    paidCount: 0,
    pendingCount: 0,
    partialCount: 0,
    collectedAmount: 0,
    targetAmount: 0,
    progressPercent: 0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "main-bazar-road",
    name: "Main Bazar Road",
    description: "Shaw & Karunanidhi Street Shops",
    icon: "storefront",
    walkOrder: 5,
    defaultMonthlyFee: 250,
    totalHouses: 0,
    paidCount: 0,
    pendingCount: 0,
    partialCount: 0,
    collectedAmount: 0,
    targetAmount: 0,
    progressPercent: 0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

export function useAreas() {
  const [areas, setAreas] = useState<AreaWithStats[]>(() => {
    if (memoryAreasCache && memoryAreasCache.length > 0) return memoryAreasCache;
    const cached = getLocalCache<AreaWithStats[]>(CACHE_KEY);
    if (cached && cached.length > 0) {
      memoryAreasCache = cached;
      return cached;
    }
    return DEFAULT_AREAS;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    // If we have cached or default areas, we are NOT blocked on loading!
    return false;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let latestAreasDocs: Area[] = [];
    let latestCustomers: Customer[] =
      memoryCustomersCache || getLocalCache<Customer[]>(CUSTOMERS_CACHE_KEY) || [];

    let connected = false;
    const timeout = setTimeout(() => {
      if (!connected) {
        console.warn("Firestore connection timed out after 10s");
        setLoading(false);
      }
    }, 10_000);

    const computeAndSetStats = (areaList: Area[], custList: Customer[]) => {
      const customersByArea: Record<string, Customer[]> = {};
      custList.forEach((c) => {
        const aId = c.areaId || "";
        if (!customersByArea[aId]) customersByArea[aId] = [];
        customersByArea[aId].push(c);
      });

      const areasWithStats: AreaWithStats[] = areaList.map((area) => {
        const areaCustomers = customersByArea[area.id] || [];
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
      setLocalCache(CACHE_KEY, areasWithStats);
      setAreas(areasWithStats);
    };

    // 1. Subscribe to Areas collection
    const areasRef = collection(db, "areas");
    const qAreas = query(areasRef, orderBy("walkOrder", "asc"));

    const unsubAreas = onSnapshot(
      qAreas,
      (snapshot) => {
        connected = true;
        clearTimeout(timeout);
        latestAreasDocs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Area)
        );
        computeAndSetStats(latestAreasDocs, latestCustomers);
        setLoading(false);
      },
      (err) => {
        connected = true;
        clearTimeout(timeout);
        console.warn("Could not stream areas:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // 2. Subscribe to customers via collectionGroup — reads all areas/{id}/customers
    const qCustomers = query(collectionGroup(db, "customers"));
    const unsubCustomers = onSnapshot(
      qCustomers,
      (snapshot) => {
        latestCustomers = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Customer)
        );
        memoryCustomersCache = latestCustomers;
        setLocalCache(CUSTOMERS_CACHE_KEY, latestCustomers);

        // Pre-warm per-area cache for instant 0ms house navigation
        const byArea: Record<string, Customer[]> = {};
        latestCustomers.forEach((c) => {
          if (c.areaId) {
            if (!byArea[c.areaId]) byArea[c.areaId] = [];
            byArea[c.areaId].push(c);
          }
        });
        Object.entries(byArea).forEach(([aId, custs]) => {
          setLocalCache(`cablekhata_cust_${aId}`, custs);
        });

        try {
          localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
        } catch { /* ignore */ }
        computeAndSetStats(latestAreasDocs, latestCustomers);
      },
      (err) => {
        console.warn("Could not stream customers for area stats:", err);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubAreas();
      unsubCustomers();
    };
  }, []);

  return { areas, loading, error };
}
