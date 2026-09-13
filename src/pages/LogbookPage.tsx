import { useState } from "react";
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
  const [tab, setTab] = useState<Tab>("manual");
  const [refreshKey, setRefreshKey] = useState(0);

  const keManual = () => {
    setTab("manual");
    setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      <TopNavbar />
      <div className="flex gap-2 px-6 pt-4">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
              tab === t
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {tab === "manual" ? (
        <>
          <LogBookForm onSaved={() => setRefreshKey((k) => k + 1)} />
          <LogBookRiwayat refreshKey={refreshKey} />
        </>
      ) : (
        <LogBookSimrs onSaved={keManual} />
      )}
    </div>
  );
}