import { CiLock, CiLogin, CiLogout } from "react-icons/ci";
import { useNavigate } from "react-router";

type props = {
  hasMasuk: boolean;
  hasPulang: boolean;
};

export default function Absensi({ hasMasuk, hasPulang }: props) {
  const navigate = useNavigate();
  return (
    <>
      <section className="flex flex-col items-center px-6 py-2 gap-2">
        <h1 className="text-lg w-full font-bold">Absensi Hari Ini</h1>
        <div
          className="bg-white border border-gray-300 flex font-semibold
            items-center gap-2 w-full rounded-xl p-3 text-blue-500 text-xs">
          <CiLock className="text-sm font-semibold" />
          <span>Absen pulang hanya tersedia sesudah absen masuk.</span>
        </div>
        <div className="flex items-center justify-between gap-5 w-full">
          <button
            disabled={hasMasuk}
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
            disabled={!hasMasuk || hasPulang}
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
