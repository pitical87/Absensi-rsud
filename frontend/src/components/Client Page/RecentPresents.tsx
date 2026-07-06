import { CiLogin, CiLogout } from "react-icons/ci";

export default function RecentPresents() {
  return (
    <div>
      <section className="px-6 py-4 w-full">
        <h1 className="text-lg w-full font-bold">Riwayat Terakhir</h1>
        <div className="mt-4">
          <ul className="flex flex-col bg-white border border-gray-300 rounded-xl">
            <li className="p-4 flex items-center justify-between border-b border-gray-300">
              <div className="flex flex-col">
                <span className="text-md font-medium ">Selasa</span>
                <span className="text-sm text-gray-500">1 Juli 2026</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <CiLogin /> 08:02
                  </span>
                  <span className="text-xsm text-gray-400 flex items-center gap-1">
                    <CiLogout /> 14:02
                  </span>
                </div>
                <span className="text-sm text-green-500 bg-green-100 w-fit px-2 py-1 rounded-md mt-1">
                  Hadir
                </span>
              </div>
            </li>
            <li className="p-4 flex items-center justify-between border-b border-gray-300">
              <div className="flex flex-col">
                <span className="text-md font-medium ">Selasa</span>
                <span className="text-sm text-gray-500">1 Juli 2026</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <CiLogin /> 08:17
                  </span>
                  <span className="text-xsm text-gray-400 flex items-center gap-1">
                    <CiLogout /> 16:02
                  </span>
                </div>
                <span className="text-sm text-orange-500 bg-orange-100 w-fit px-2 py-1 rounded-md mt-1">
                  Terlambat
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
