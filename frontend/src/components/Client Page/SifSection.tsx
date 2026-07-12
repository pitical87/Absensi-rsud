import React from "react";
import { BiCalendar } from "react-icons/bi";
import {
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import { IoPersonOutline, IoSunny } from "react-icons/io5";
import { LuInfo } from "react-icons/lu";
import { PiBuildingOfficeFill } from "react-icons/pi";

export default function SifSection() {
  return (
    <div className="flex flex-col w-full items-center gap-2 px-6 py-4">
      <h1 className="flex gap-3 items-center w-text-lg w-full font-bold">
        <BiCalendar /> Shift hari ini
      </h1>
      <div
        className="bg-white border border-gray-300 flex font-semibold
                  items-center gap-2 w-full rounded-xl p-3 text-blue-500 text-sm">
        <LuInfo className="text-md font-semibold" />
        <span className="text-xs">
          Jadwal diambil dari sistem sesuai penugasan anda
        </span>
      </div>
      <div className="flex w-full gap-3">
        {/* Shift */}
        <div className="flex w-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <IoSunny className="text-xl text-amber-500" />
          </div>

          <div className="flex flex-col">
            <span className="w-fit rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">
              Shift Pagi
            </span>

            <span className="mt-1 text-sm font-semibold text-gray-800">
              08.00 - 14.00
            </span>

            <span className="text-xs text-gray-500">Durasi 6 jam</span>
          </div>
        </div>

        {/* Unit */}
        <div className="flex w-1/2 flex-col justify-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <PiBuildingOfficeFill className="text-lg text-sky-600" />

            <div>
              <p className="text-[11px] text-gray-500">Unit</p>
              <p className="text-sm font-semibold">PIT</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IoPersonOutline className="text-lg text-sky-600" />

            <div>
              <p className="text-[11px] text-gray-500">Atasan</p>
              <p className="text-sm font-semibold">Dr. Andi</p>
            </div>
          </div>
        </div>
      </div>
      {/* izin */}
      <section className="rounded-2xl border border-gray-200 bg-white p-3 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Tidak bisa hadir hari ini?
            </h3>
          </div>

          <button className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100">
            <HiOutlineDocumentText size={20} />
            Ajukan Izin
          </button>
        </div>
      </section>
    </div>
  );
}
