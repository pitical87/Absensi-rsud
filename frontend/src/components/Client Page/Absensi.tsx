import { CiLock, CiLogin, CiLogout } from "react-icons/ci";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useNavigate } from "react-router";

type props = {
  hasMasuk: boolean;
  hasPulang: boolean;
  hasLeave: boolean;
  todayLeave?: {
    jenis: string;
    jenis_cuti?: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
  } | null;
};

export default function Absensi({
  hasMasuk,
  hasPulang,
  hasLeave,
  todayLeave,
}: props) {
  const navigate = useNavigate();
  return (
    <>
      <section className="flex flex-col items-center px-6 py-2 gap-2">
        <h1 className="text-lg w-full font-bold">Absensi Hari Ini</h1>
        {hasLeave && todayLeave && (
          <div className="w-full rounded-xl bg-yellow-50 border border-yellow-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-lg">
              <IoDocumentTextOutline />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-yellow-800 text-sm">
                Sedang {todayLeave.jenis === "Cuti" ? "Cuti" : "Izin"}
              </span>
              <span className="text-xs text-yellow-600">
                {todayLeave.jenis_cuti ? `${todayLeave.jenis_cuti} — ` : ""}
                {todayLeave.tanggal_mulai} s.d. {todayLeave.tanggal_selesai}
              </span>
            </div>
          </div>
        )}
        <div
          className="bg-white border border-gray-300 flex font-semibold
            items-center gap-2 w-full rounded-xl p-3 text-blue-500 text-xs">
          <CiLock className="text-sm font-semibold" />
          <span>Absen pulang hanya tersedia sesudah absen masuk.</span>
        </div>
        <div className="flex items-center justify-between gap-5 w-full">
          <button
            disabled={hasMasuk || hasLeave}
            onClick={() => navigate("/present/masuk")}
            className="
                group w-full rounded-xl border border-blue-200 bg-white p-4
                transition-colors duration-200 cursor-pointer
                hover:bg-blue-100 hover:border-blue-400
                disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-blue-200
                disabled:cursor-not-allowed
              ">
            <div className="flex items-center gap-3">
              <span
                className="
                  flex h-8 w-8 items-center justify-center rounded-lg
                  bg-blue-100 transition-colors duration-200
                  group-hover:bg-blue-600
                  group-disabled:bg-blue-100
                ">
                <CiLogin
                  className="
                      text-xl text-blue-600
                      transition-colors duration-200
                      group-hover:text-white
                      group-disabled:text-blue-600
                    "
                />
              </span>

              <div className="flex flex-1 flex-col text-left">
                <span
                  className="
                    font-medium text-gray-800
                    transition-colors duration-200
                    group-hover:text-blue-700
                    group-disabled:text-gray-800
                  ">
                  Absen Masuk
                </span>

                <span
                  className="
                    text-xs text-gray-500
                    transition-colors duration-200
                    group-hover:text-gray-600
                    group-disabled:text-gray-500
                  ">
                  {hasMasuk ? "Sudah Masuk" : "Untuk absen Masuk"}
                </span>
              </div>
            </div>
          </button>
          <button
            disabled={!hasMasuk || hasPulang || hasLeave}
            onClick={() => navigate("/present/pulang")}
            className="
                group w-full rounded-xl border border-blue-200 bg-white p-4
                transition-colors duration-200 cursor-pointer
                hover:bg-blue-100 hover:border-blue-400
                disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-blue-200
                disabled:cursor-not-allowed
              ">
            <div className="flex items-center gap-3">
              <span
                className="
                  flex h-8 w-8 items-center justify-center rounded-lg
                  bg-blue-100 transition-colors duration-200
                  group-hover:bg-blue-600
                  group-disabled:bg-blue-100
                ">
                <CiLogout
                  className="
                      text-xl text-blue-600
                      transition-colors duration-200
                      group-hover:text-white
                      group-disabled:text-blue-600
                    "
                />
              </span>

              <div className="flex flex-1 flex-col text-left">
                <span
                  className="
                    font-medium text-gray-800
                    transition-colors duration-200
                    group-hover:text-blue-700
                    group-disabled:text-gray-800
                  ">
                  Absen Pulang
                </span>

                <span
                  className="
                    text-xs text-gray-500
                    transition-colors duration-200
                    group-hover:text-gray-600
                    group-disabled:text-gray-500
                  ">
                  {hasPulang ? "Sudah pulang" : "Absen masuk dulu"}
                </span>
              </div>
            </div>
          </button>
        </div>
      </section>
    </>
  );
}
