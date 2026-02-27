export declare class CreateIzinDto {
    santriId: string;
    type: string;
    reason: string;
    startAt: string;
    endAt: string;
}
export declare class ApproveIzinDto {
    approverId?: string;
    status: string;
    notes?: string;
    token?: string;
}
