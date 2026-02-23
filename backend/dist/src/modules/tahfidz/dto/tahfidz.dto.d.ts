export declare enum TahfidzType {
    ZIYADAH = "ZIYADAH",
    MUROJAAH = "MUROJAAH",
    SABAQ = "SABAQ"
}
export declare class CreateTahfidzDto {
    santriId: string;
    surah: string;
    ayat?: string;
    type: TahfidzType;
    grade?: string;
    notes?: string;
    date?: string;
}
export declare class CreateMutabaahDto {
    santriId: string;
    date?: string;
    sholatWajib?: boolean;
    tahajud?: boolean;
    dhuha?: boolean;
    puasaSunnah?: boolean;
    bacaQuran?: boolean;
    notes?: string;
}
