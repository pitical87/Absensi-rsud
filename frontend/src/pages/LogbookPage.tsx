import { useState } from "react";
import TopNavbar from "../components/Client Page/TopNavbar";
import LogBookForm from "../components/Logbook Page/LogBookForm";
import LogBookRiwayat from "../components/Logbook Page/LogBookRiwayat";

export default function LogbookPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <TopNavbar />
      <LogBookForm onSaved={() => setRefreshKey((k) => k + 1)} />
      <LogBookRiwayat refreshKey={refreshKey} />
    </div>
  );
}
