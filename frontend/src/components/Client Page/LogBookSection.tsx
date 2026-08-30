import { BiPencil } from "react-icons/bi";
import { TfiWrite } from "react-icons/tfi";
import { useNavigate } from "react-router";

export default function LogBookSection() {
  const navigate = useNavigate();
  return (
    <section className="w-full px-6 pt-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <TfiWrite className="text-lg" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-800">Buat Logbook untuk Hari Ini</h1>

            <p className="mt-1 text-sm text-gray-500">Catat aktivitas dan pekerjaan yang kamu lakukan hari ini.</p>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={() => navigate("/logbook")}
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <BiPencil className="text-lg" />
            Tulis Logbook
          </button>
        </div>
      </div>
    </section>
  );
}
