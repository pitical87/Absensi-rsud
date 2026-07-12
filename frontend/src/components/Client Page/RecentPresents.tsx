import { useEffect, useState } from "react";
import { CiLogin, CiLogout } from "react-icons/ci";
import { getAttRecords } from "../../utils/api/Attendence";

type RecordItem = {
  hari: string;
  tanggal_label: string;
  jam_masuk: string;
  jam_pulang: string | null;
  status: string;
};

export default function RecentPresents() {
  const [record, setRecord] = useState<RecordItem[]>([]);
  useEffect(() => {
    getAttRecords().then((res) => {
      if (res.sukses) setRecord(res.riwayat);
    });
  }, []);
  return (
    <>
      <section className="px-6 py-4 w-full">
        <h1 className="text-lg w-full font-bold">Riwayat Terakhir</h1>
        <div className="mt-4">
          <ul className="flex flex-col bg-white border border-gray-300 rounded-xl max-h-70 overflow-y-auto">
            {record.length === 0 ? (
              <li className="p-4 text-center text-gray-400 text-sm">
                Belum ada riwayat absensi
              </li>
            ) : (
              record.map((r, i) => (
                <li
                  key={i}
                  className="p-4 flex items-center justify-between border-b border-gray-300">
                  <div className="flex flex-col">
                    <span className="text-md font-medium ">{r.hari}</span>
                    <span className="text-sm text-gray-500">
                      {r.tanggal_label}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <CiLogin />
                        {r.jam_masuk}
                      </span>
                      <span className="text-xsm text-gray-400 flex items-center gap-1">
                        <CiLogout /> {r.jam_pulang}
                      </span>
                    </div>
                    <span
                      className={`
                      text-sm ${
                        r.status === "Tepat Waktu"
                          ? "text-green-500 bg-green-100"
                          : "text-orange-500 bg-orange-100"
                      } w-fit px-2 py-1 rounded-md mt-1`}>
                      {r.status}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </>
  );
}
