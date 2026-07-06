import { HiOutlineChartPie } from "react-icons/hi";
import { LuClock3 } from "react-icons/lu";

export default function PresentStatistic() {
  return (
    <div>
      <section className="px-6 py-2 w-full">
        <h1 className="text-lg w-full font-bold">Statistik Bulan Ini</h1>
        <div className="mt-4 flex justify-between items-center gap-5">
          <div
            className="flex flex-col items-center bg-white border 
                  border-gray-300 rounded-xl p-4 gap-1 w-full">
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              <HiOutlineChartPie /> Kehadiran
            </span>
            <span className="text-2xl font-bold w-full">98%</span>
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              19 dari 20 hari kerja
            </span>
          </div>
          <div
            className="flex flex-col items-center bg-white border 
                  border-gray-300 rounded-xl p-4 gap-1 w-full">
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              <LuClock3 />
              Jam Kerja
            </span>
            <span className="text-2xl font-bold w-full">154 jam</span>
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              target 160 jam
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
