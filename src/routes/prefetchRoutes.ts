export const routeLoaders = {
  present: () => import("../pages/PresentPage"),
  izin: () => import("../pages/IzinPage"),
  persetujuan: () => import("../pages/PendingLeave"),
  logbook: () => import("../pages/LogbookPage"),
  lembur: () => import("../pages/LemburPage"),
  absenLembur: () => import("../pages/AbsenLemburPage"),
  persetujuanLembur: () => import("../pages/PersetujuanLembur"),
  ubahJadwal: () => import("../pages/PerubahanJadwalPage"),
  persetujuanJadwal: () => import("../pages/PersetujuanPerubahanJadwal"),
  kelolaJadwal: () => import("../pages/KelolaJadwalPage"),
  verifikasiEmail: () => import("../pages/VerifikasiEmailPage"),
  rekap: () => import("../components/Rekap"),
  profile: () => import("../pages/ProfilPage"),
} as const;

export type RouteKey = keyof typeof routeLoaders;

const prefetched = new Set<RouteKey>();

export function prefetchRoute(key: RouteKey): void {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  routeLoaders[key]().catch(() => {
    prefetched.delete(key);
  });
}

export function prefetchMainMenus(options: {
  lemburAktif: boolean;
  canKelolaJadwal: boolean;
  canApproveIzin: boolean;
  canApproveLembur: boolean;
  canApproveJadwal: boolean;
}): () => void {
  const keys: RouteKey[] = ["izin", "ubahJadwal", "logbook", "present", "profile"];
  if (options.lemburAktif) keys.push("lembur");
  if (options.canKelolaJadwal) keys.push("kelolaJadwal");
  if (options.canApproveIzin) keys.push("persetujuan");
  if (options.lemburAktif && options.canApproveLembur) {
    keys.push("persetujuanLembur");
  }
  if (options.canApproveJadwal) keys.push("persetujuanJadwal");

  const run = () => {
    for (const key of keys) {
      prefetchRoute(key);
    }
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const id = window.requestIdleCallback(run, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }

  const timer = setTimeout(run, 800);
  return () => clearTimeout(timer);
}
