"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmployeeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let EmployeeService = EmployeeService_1 = class EmployeeService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmployeeService_1.name);
    }
    async createEmployee(tenantId, dto) {
        if (dto.userId) {
            const user = await this.prisma.user.findFirst({
                where: { id: dto.userId, tenantId },
            });
            if (!user)
                throw new common_1.BadRequestException('Linked User Account not found in this tenant');
        }
        return this.prisma.employee.create({
            data: {
                tenantId,
                userId: dto.userId,
                nip: dto.nip,
                name: dto.name,
                position: dto.position,
                phone: dto.phone,
                address: dto.address,
                joinDate: dto.joinDate ? new Date(dto.joinDate) : null,
            },
        });
    }
    async getEmployees(tenantId) {
        return this.prisma.employee.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }
    async createPayroll(tenantId, dto) {
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, tenantId },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        const netAmount = dto.baseSalary + (dto.allowances || 0) - (dto.deductions || 0);
        return this.prisma.payroll.create({
            data: {
                tenantId,
                employeeId: dto.employeeId,
                month: dto.month,
                year: dto.year,
                baseSalary: dto.baseSalary,
                allowances: dto.allowances || 0,
                deductions: dto.deductions || 0,
                netAmount,
                status: 'DRAFT',
            },
        });
    }
    async executePayrollPayment(tenantId, payrollId) {
        const payroll = await this.prisma.payroll.findFirst({
            where: { id: payrollId, tenantId },
            include: { employee: true },
        });
        if (!payroll)
            throw new common_1.NotFoundException('Payroll record not found');
        if (payroll.status === 'PAID')
            throw new common_1.BadRequestException('Payroll is already paid');
        return this.prisma.payroll.update({
            where: { id: payroll.id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
        });
    }
    async getEmployeePayrollHistory(tenantId, employeeId) {
        return this.prisma.payroll.findMany({
            where: { tenantId, employeeId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = EmployeeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map