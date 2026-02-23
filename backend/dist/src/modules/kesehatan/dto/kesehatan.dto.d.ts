export declare class CreateHealthRecordDto {
    santriId: string;
    symptoms: string;
    diagnosis?: string;
    actionTaken?: string;
    referred?: boolean;
}
export declare class CreateMedicationDto {
    santriId: string;
    medicineName: string;
    dose: string;
    schedule: string;
}
