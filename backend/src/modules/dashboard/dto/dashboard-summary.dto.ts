export interface PresensiHariIniDto {
  hadir: number;
  pendingReview: number;
  ditolak: number;
  total: number;
}

export interface TagihanJatuhTempoDto {
  count: number;
  totalJumlah: number;
}

export interface NotifikasiTerbaruDto {
  id: string;
  tipe: string;
  keterangan: string;
  createdAt: Date;
}

export interface DashboardSummaryDto {
  santriAktif: number;
  presensiHariIni: PresensiHariIniDto;
  tagihanJatuhTempo: TagihanJatuhTempoDto;
  notifikasiTerbaru: NotifikasiTerbaruDto[];
  cachedAt: string;
}
