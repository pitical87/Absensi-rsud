import { BiPencil } from "react-icons/bi";
import { TfiWrite } from "react-icons/tfi";
import { useNavigate } from "react-router";

type props = {
  hasMasuk: boolean;
  hasPulang: boolean;
  hasLeave: boolean;
};

export default function LogBookSection({ hasMasuk, hasPulang, hasLeave }: props) {
  const navigate = useNavigate();
  const aktif = hasMasuk && !hasPulang && !hasLeave;
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
            disabled={!aktif}
            className="
              flex w-full items-center justify-center gap-2
              rounded-xl
              bg-blue-600
              px-4 py-3
              text-sm font-semibold text-white
              shadow-sm
              transition
              hover:bg-blue-700
              active:scale-[0.98]

              disabled:cursor-not-allowed
              disabled:bg-gray-300
              disabled:text-gray-500
              disabled:shadow-none
              disabled:hover:bg-gray-300
              disabled:active:scale-100
            "
          >
            {aktif ? (
              <>
                <BiPencil className="text-lg" /> Tulis Logbook
              </>
            ) : (
              "Absen masuk dulu untuk mengisi logbook hari ini."
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
