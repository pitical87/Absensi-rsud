import { useAuth } from "../../context/AuthContext";
import { GetGreeting, GetRandomGreeting } from "../../utils/DateUtils";

type props = {
  masuk: { waktu: string; status: string } | null;
  pulang: { waktu: string } | null;
};

export default function HeroCard({ masuk, pulang }: props) {
  const { user } = useAuth();
  return (
    <>
      <section className="px-6 pt-4 pb-2">
        <div className="flex flex-col rounded-2xl bg-blue-600 p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {GetGreeting()}, {user?.nama_lengkap}
            </h1>
            <p className="mt-1 text-sm text-blue-200">{GetRandomGreeting()}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-blue-300/40 p-5">
            <div>
              <p className="text-sm font-medium text-blue-100">Masuk</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {masuk ? masuk.waktu : "-"}
              </p>
              <p className="mt-2 text-sm text-blue-100">
                {" "}
                {masuk ? "Sudah absen" : "Belum absen"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">Pulang</p>
              <p className="mt-2 text-3xl font-bold text-white">
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
