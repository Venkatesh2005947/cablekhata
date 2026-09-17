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

export function useAreas() {
  const [areas, setAreas] = useState<AreaWithStats[]>(() => {
    if (memoryAreasCache && memoryAreasCache.length > 0) return memoryAreasCache;
    const cached = getLocalCache<AreaWithStats[]>(CACHE_KEY);
    if (cached && cached.length > 0) {
      memoryAreasCache = cached;
      return cached;
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return !memoryAreasCache || memoryAreasCache.length === 0;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let latestAreasDocs: Area[] = [];
    let latestCustomers: Customer[] =
      memoryCustomersCache || getLocalCache<Customer[]>(CUSTOMERS_CACHE_KEY) || [];

    // Safety timeout: if Firestore doesn't respond within 10s, stop loading
    // and show an error instead of hanging on skeletons forever.
    let connected = false;
    const timeout = setTimeout(() => {
      if (!connected) {
        console.warn("Firestore connection timed out after 10s");
        setLoading(false);
        setError("Could not connect to database. Please check your internet connection and try again.");
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
    //    subcollections in ONE efficient query (no top-level full-table scan)
    const qCustomers = query(collectionGroup(db, "customers"));
    const unsubCustomers = onSnapshot(
      qCustomers,
      (snapshot) => {
        latestCustomers = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Customer)
        );
        memoryCustomersCache = latestCustomers;
        setLocalCache(CUSTOMERS_CACHE_KEY, latestCustomers);
        // Record timestamp for TTL checks
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
