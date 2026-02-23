import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmployeeDto, CreatePayrollDto } from './dto/employee.dto';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEmployee(tenantId: string, dto: CreateEmployeeDto) {
    if (dto.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: dto.userId, tenantId },
      });
      if (!user) throw new BadRequestException('Linked User Account not found in this tenant');
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

  async getEmployees(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createPayroll(tenantId: string, dto: CreatePayrollDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

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

  async executePayrollPayment(tenantId: string, payrollId: string) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id: payrollId, tenantId },
      include: { employee: true },
    });

    if (!payroll) throw new NotFoundException('Payroll record not found');
    if (payroll.status === 'PAID') throw new BadRequestException('Payroll is already paid');

    return this.prisma.payroll.update({
      where: { id: payroll.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  async getEmployeePayrollHistory(tenantId: string, employeeId: string) {
    return this.prisma.payroll.findMany({
      where: { tenantId, employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
