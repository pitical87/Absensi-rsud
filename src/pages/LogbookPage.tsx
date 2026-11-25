import { useState } from "react";
import { useNavigate } from "react-router";
import { HiOutlineChevronRight } from "react-icons/hi";
import { IoArrowBack, IoDocumentTextOutline } from "react-icons/io5";
import { RiFileHistoryLine } from "react-icons/ri";
import TopNavbar from "../components/Client Page/TopNavbar";
import LogBookForm from "../components/Logbook Page/LogBookForm";
import LogBookRiwayat from "../components/Logbook Page/LogBookRiwayat";
import LogBookSimrs from "../components/Logbook Page/LogBookSimrs";

type Tab = "manual" | "simrs";

const TAB_LABEL: Record<Tab, string> = {
  manual: "Entri Manual",
  simrs: "Ambil dari SIMRS",
};

export default function LogbookPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("manual");
  const [refreshKey, setRefreshKey] = useState(0);
  const [riwayatOpen, setRiwayatOpen] = useState(false);

  const keManual = () => {
    setTab("manual");
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <TopNavbar />

      <section className="px-6 py-2 pb-10 flex flex-col gap-2">
        {/* Header — seragam dengan Lembur / Profil / Perubahan Jadwal */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <IoDocumentTextOutline />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-800">Logbook</h1>
            <p className="text-sm text-gray-500">
              Catat aktivitas & pekerjaan harian Anda.
            </p>
          </div>
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => navigate("/")}
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </div>

        {/* Switch Tab */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
          {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                tab === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>

        {/* Konten Tab */}
        {tab === "manual" ? (
          <LogBookForm onSaved={() => setRefreshKey((k) => k + 1)} />
        ) : (
          <LogBookSimrs onSaved={keManual} />
        )}

        {/* Tombol Popup Riwayat Logbook */}
        <button
          type="button"
          onClick={() => setRiwayatOpen(true)}
          className="flex w-full items-center gap-3 rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 active:scale-[0.99]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-600">
            <RiFileHistoryLine />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-800">
              Riwayat Logbook
            </h2>
            <p className="text-xs text-gray-500">
              Lihat, cari, dan filter catatan logbook Anda
            </p>
          </div>
          <HiOutlineChevronRight className="shrink-0 text-xl text-gray-400" />
        </button>
      </section>

      <LogBookRiwayat
        key={riwayatOpen ? "open" : "closed"}
        open={riwayatOpen}
        refreshKey={refreshKey}
        onClose={() => setRiwayatOpen(false)}
      />
    </>
  );
}
