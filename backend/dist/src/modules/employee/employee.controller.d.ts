import { CreateEmployeeDto, CreatePayrollDto } from './dto/employee.dto';
import { EmployeeService } from './employee.service';
export declare class EmployeeController {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    createEmployee(tenantId: string, dto: CreateEmployeeDto): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        userId: string | null;
        nip: string | null;
        position: string;
        joinDate: Date | null;
    }>;
    getEmployees(tenantId: string): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        userId: string | null;
        nip: string | null;
        position: string;
        joinDate: Date | null;
    }[]>;
    createPayroll(tenantId: string, dto: CreatePayrollDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        paidAt: Date | null;
        employeeId: string;
        month: number;
        year: number;
        baseSalary: number;
        allowances: number;
        deductions: number;
        netAmount: number;
    }>;
    getPayrollHistory(tenantId: string, employeeId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        paidAt: Date | null;
        employeeId: string;
        month: number;
        year: number;
        baseSalary: number;
        allowances: number;
        deductions: number;
        netAmount: number;
    }[]>;
    executePayment(tenantId: string, payrollId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        paidAt: Date | null;
        employeeId: string;
        month: number;
        year: number;
        baseSalary: number;
        allowances: number;
        deductions: number;
        netAmount: number;
    }>;
}
