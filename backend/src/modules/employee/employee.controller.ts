import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateEmployeeDto, CreatePayrollDto } from './dto/employee.dto';
import { EmployeeService } from './employee.service';

@ApiTags('Kepegawaian (HR) & Penggajian')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mendaftarkan data pegawai/guru baru' })
  async createEmployee(@TenantId() tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeeService.createEmployee(tenantId, dto);
  }

  @Get()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Melihat semua daftar pegawai pesantren' })
  async getEmployees(@TenantId() tenantId: string) {
    return this.employeeService.getEmployees(tenantId);
  }

  @Post('payroll')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Membuat draf penggajian (payroll) bulanan' })
  async createPayroll(@TenantId() tenantId: string, @Body() dto: CreatePayrollDto) {
    return this.employeeService.createPayroll(tenantId, dto);
  }

  @Get(':employeeId/payroll')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Melihat histori slip gaji seorang pegawai' })
  async getPayrollHistory(@TenantId() tenantId: string, @Param('employeeId') employeeId: string) {
    return this.employeeService.getEmployeePayrollHistory(tenantId, employeeId);
  }

  @Post('payroll/:payrollId/pay')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mengesahkan pembayaran gaji (Draft -> Paid)' })
  async executePayment(@TenantId() tenantId: string, @Param('payrollId') payrollId: string) {
    return this.employeeService.executePayrollPayment(tenantId, payrollId);
  }
}
