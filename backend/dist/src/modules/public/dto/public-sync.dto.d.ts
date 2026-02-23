export declare class SyncSantriItemDto {
    nisn: string;
    name: string;
    gender: string;
    birthDate: string;
    birthPlace: string;
    address?: string;
    waliName?: string;
    waliPhone?: string;
    waliEmail?: string;
}
export declare class BulkSyncSantriDto {
    data: SyncSantriItemDto[];
}
