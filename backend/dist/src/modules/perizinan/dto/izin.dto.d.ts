export declare class CreateIzinDto {
    santriId: string;
    type: string;
    reason: string;
    startAt: string;
    endAt: string;
}
export declare class ApproveIzinDto {
    waliId: string;
    status: string;
    token?: string;
}
