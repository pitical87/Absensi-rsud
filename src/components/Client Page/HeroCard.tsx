import { useAuth } from "../../context/AuthContext";
import { GetGreeting, GetRandomGreeting } from "../../utils/DateUtils";

type props = {
  masuk: { waktu: string; status: string } | null;
  pulang: { waktu: string } | null;
  isDokter?: boolean;
  sesi?: number;
};

export default function HeroCard({ masuk, pulang, isDokter, sesi }: props) {
  const { user } = useAuth();
  return (
    <>
      <section className="px-4 sm:px-6 pt-4 pb-2">
        <div className="flex flex-col rounded-2xl bg-blue-600 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white break-words">
                {GetGreeting()}, {user?.nama_lengkap}
              </h1>
              <p className="mt-1 text-sm text-blue-200">{GetRandomGreeting()}</p>
            </div>
            {isDokter && (sesi ?? 0) > 0 && (
              <span className="shrink-0 rounded-full bg-blue-800/40 px-3 py-1 text-xs font-medium text-blue-100">
                Sesi {sesi} hari ini
              </span>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 rounded-2xl bg-blue-300/40 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-100">Masuk</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                {masuk ? masuk.waktu : "-"}
              </p>
              <p className="mt-2 text-sm text-blue-100">
                {" "}
                {masuk ? "Sudah absen" : "Belum absen"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-100">Pulang</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                {pulang ? pulang.waktu : "-"}
              </p>
              <p className="mt-2 text-sm text-blue-100">
                {" "}
                {pulang ? "Sudah absen" : "Belum absen"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
