import { IoIosNotificationsOutline } from "react-icons/io";
import { GetCurrentDateString } from "../../utils/DateUtils";
import { useState } from "react";

export default function TopNavbar() {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div className="relative">
      <section className="b-white flex items-center justify-between border-b border-gray-200 px-5 py-4 bg-white">
        <div className="flex flex-col cursor-default">
          <h1 className="text-xl font-bold">Absensi RSUD</h1>
          <span className="text-sm text-gray-500">
            {GetCurrentDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IoIosNotificationsOutline className="text-2xl text-gray-700 cursor-pointer" />
          <button
            onClick={() => setShowMenu(true)}
            className="flex h-8 w-8 items-center text-sm justify-center rounded-full cursor-pointer
                bg-blue-100 font-semibold text-blue-600">
            RI
          </button>
        </div>
      </section>

      {showMenu && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-4 top-16 z-50 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-xl font-bold text-gray-900">Rizaldi</h2>
              <p className="mt-1 text-gray-500 text-sm">Analis Politik</p>
            </div>

            {/* Menu */}
            <button
              className="w-full border-b border-gray-200 px-5 py-3 text-left text-md transition-colors hover:bg-gray-50"
              onClick={() => {
                setShowMenu(false);
                // navigate("/history")
              }}>
              Rekap Kehadiran
            </button>

            <button
              className="w-full px-5 py-3 text-left text-md text-red-600 transition-colors hover:bg-red-50"
              onClick={() => {
                setShowMenu(false);
                // logout()
              }}>
              Keluar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
