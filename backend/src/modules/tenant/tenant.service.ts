import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto, adminUserId: string) {
    const { plan, ...rest } = createTenantDto;

    // SQLite doesn't support Prisma Enums directly via Prisma Client sometimes, testing mapping
    const planEnum = plan || 'BASIC';

    const tenant = await this.prisma.tenant.create({
      data: {
        ...rest,
        plan: planEnum,
        adminUserId,
      },
    });

    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, santri: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, santri: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Parse JSON settings safely if stringified
    if (tenant.settings && typeof tenant.settings === 'string') {
      try {
        tenant.settings = JSON.parse(tenant.settings);
      } catch (e) {}
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id); // Ensure exists

    const { status, plan, settings, ...rest } = updateTenantDto;

    const updateData: any = { ...rest };
    if (status) updateData.status = status;
    if (plan) updateData.plan = plan;
    if (settings) updateData.settings = JSON.stringify(settings); // handle SQLite JSON as string

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON settings safely if stringified
    if (updatedTenant.settings && typeof updatedTenant.settings === 'string') {
      try {
        updatedTenant.settings = JSON.parse(updatedTenant.settings);
      } catch (e) {}
    }

    return updatedTenant;
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists

    // Deleting a tenant will cascade delete all related records due to onDelete: Cascade
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
