import { useEffect, useState } from "react";
import { FaStar, FaRegStar, FaXmark } from "react-icons/fa6";
import { getPerformaBulan } from "../../utils/api/Attendence";

type Performa = {
  sukses: boolean;
  bulan: number;
  tahun: number;
  nama_bulan: string;
  bintang: number | null;
  pesan: string | null;
};

const FLAG_KEY = "maro_performa_bulan";

export default function PerformaBanner() {
  const [data, setData] = useState<Performa | null>(null);

  useEffect(() => {
    const now = new Date();
    const masihAwalBulan = now.getDate() <= 5;
    const kunci = `${now.getFullYear()}-${now.getMonth() + 1}`;
    if (!masihAwalBulan || localStorage.getItem(FLAG_KEY) === kunci) return;

    getPerformaBulan()
      .then((res) => {
        if (res.sukses && res.bintang !== null) {
          localStorage.setItem(FLAG_KEY, kunci);
          setData(res);
        }
      })
      .catch(() => {});
  }, []);

  if (!data || data.bintang === null) return null;

  const bulat = Math.round(data.bintang);
  const baik = bulat >= 5;
  const lumayan = bulat === 4;

  return (
    <section className="px-6 pt-2 w-full">
      <div
        className={`rounded-2xl border p-4 flex gap-3 ${
          baik
            ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
            : lumayan
              ? "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200"
              : "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
        }`}>
        <div className="shrink-0">
          <span className="flex gap-0.5 text-amber-400">
            {[1, 2, 3, 4, 5].map((i) =>
              i <= bulat ? <FaStar key={i} /> : <FaRegStar key={i} />,
            )}
          </span>
        </div>
        <div className="flex-1">
          <p
            className={`text-sm font-bold ${
              baik ? "text-amber-800" : lumayan ? "text-blue-800" : "text-red-700"
            }`}>
            Performa Bintang Bulan {data.nama_bulan}
          </p>
          <p className="mt-1 text-sm text-gray-600">{data.pesan}</p>
        </div>
        <button
          onClick={() => setData(null)}
          className="self-start text-gray-400 hover:text-gray-600"
          aria-label="Tutup">
          <FaXmark />
        </button>
      </div>
    </section>
  );
}
