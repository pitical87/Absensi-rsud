import { BiCheckCircle } from "react-icons/bi";
import { FiFileText } from "react-icons/fi";
import { GiPaperClip } from "react-icons/gi";
import TopNavbar from "../components/Client Page/TopNavbar";

const approvals = [
  {
    id: 1,
    pegawai: "Firman Diaina",
    nip: "9101010101010101",
    unit: "SARPRAS — UNIT PIT",
    jenis: "Izin",
    tanggal: "22 Juli 2026 s.d. 23 Juli 2026",
    lama: "2 hari kerja",
    alamat: "Tes",
    alasan: "Tes",
    lampiran: true,
  },
];

export default function PendingLeave() {
  return (
    <>
      <TopNavbar />

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <BiCheckCircle className="h-4 w-4 text-blue-600" />

                <h2 className=" font-bold text-slate-800">
                  Menunggu Persetujuan Saya
                </h2>
              </div>

              <span className="rounded-full bg-amber-100 text-sm px-2 py-1 font-semibold text-amber-700">
                1 Pengajuan
              </span>
            </div>
            <p className="mt-3 text-sm  text-slate-500">
              Anda melihat halaman ini karena posisi Anda{" "}
              <span className="font-semibold text-slate-700">
                (Koordinator / Kepala Unit / Ruang / Instalasi)
              </span>{" "}
              berperan dalam alur persetujuan izin/cuti pegawai.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-4">Pegawai</th>
                  <th className="px-5 py-4">Jenis</th>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Lama</th>
                  <th className="px-5 py-4">Alamat</th>
                  <th className="px-5 py-4">Alasan</th>
                  <th className="px-5 py-4 w-[340px]">Tindakan</th>
                </tr>
              </thead>

              <tbody>
                {approvals.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 align-top text-sm text-slate-700">
                    <td className="px-5 py-5">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {item.pegawai}
                      </h3>

                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                        NIP
                      </p>

                      <p>{item.nip}</p>

                      <p className="mt-2 text-slate-500">{item.unit}</p>
                    </td>

                    <td className="px-5 py-5 font-semibold">{item.jenis}</td>

                    <td className="px-5 py-5 leading-6">{item.tanggal}</td>

                    <td className="px-5 py-5">{item.lama}</td>

                    <td className="px-5 py-5">{item.alamat}</td>

                    <td className="px-5 py-5">
                      <p>{item.alasan}</p>

                      {item.lampiran && (
                        <button className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                          <GiPaperClip className="h-4 w-4" />
                          Lihat lampiran
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-5">
                      <textarea
                        rows={3}
                        placeholder="Catatan (opsional)..."
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          px-4
                          py-3
                          text-sm
                          outline-none
                          transition
                          resize-none
                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100
                        "
                      />

                      <div className="mt-4 flex gap-3">
                        <button
                          className="
                            rounded-xl
                            bg-blue-600
                            px-6
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-blue-700
                          ">
                          Setujui
                        </button>

                        <button
                          className="
                            rounded-xl
                            bg-red-100
                            px-6
                            py-2.5
                            text-sm
                            font-medium
                            text-red-600
                            transition
                            hover:bg-red-200
                          ">
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= RIWAYAT ================= */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3">
            <FiFileText className="h-6 w-6 text-blue-600" />

            <h2 className="text-2xl font-bold text-slate-800">
              Riwayat Keputusan Saya
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-4">Waktu</th>
                  <th className="px-5 py-4">Pegawai</th>
                  <th className="px-5 py-4">Jenis</th>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Putusan</th>
                  <th className="px-5 py-4">Catatan</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-slate-500">
                    Belum ada riwayat keputusan.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
