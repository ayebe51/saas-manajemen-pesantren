export declare enum EmployeePosition {
    GURU = "GURU",
    MUSYRIF = "MUSYRIF",
    STAF = "STAF",
    SECURITY = "SECURITY"
}
export declare class CreateEmployeeDto {
    userId?: string;
    nip?: string;
    name: string;
    position: EmployeePosition;
    phone?: string;
    address?: string;
    joinDate?: string;
}
export declare class CreatePayrollDto {
    employeeId: string;
    month: number;
    year: number;
    baseSalary: number;
    allowances?: number;
    deductions?: number;
}
