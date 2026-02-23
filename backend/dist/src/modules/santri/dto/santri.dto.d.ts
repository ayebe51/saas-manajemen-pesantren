export declare class CreateSantriDto {
    nisn?: string;
    name: string;
    gender: string;
    dob?: Date;
    kelas?: string;
    room?: string;
    contact?: string;
    address?: string;
}
export declare class UpdateSantriDto {
    name?: string;
    kelas?: string;
    room?: string;
    status?: string;
}
export declare class CreateWaliDto {
    name: string;
    relation: string;
    phone: string;
    email?: string;
    address?: string;
}
