import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    // Example Simple Implementation: Master API Key from ENV
    const masterKey = this.configService.get<string>('MASTER_API_KEY');
    if (masterKey && apiKey === masterKey) {
      // Master key bypasses tenant restriction, or requires tenantId in header/body
      return true;
    }

    // Advanced Implementation: Look up API Key in database
    // Simplified since SQLite doesn't easily support JSON filtering natively in Prisma without specific schema
    const tenant = await this.prisma.tenant.findFirst();
    if (tenant && tenant.settings) {
      // Validate inside logic rather than db query for this boilerplate
      const settingsObj =
        typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings;
      if (settingsObj && settingsObj.apiKey === apiKey) {
        request['tenantId'] = tenant.id;
        return true;
      }
    }

    if (!tenant) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Attach tenantId to request so @TenantId decorator can pick it up
    request.tenantId = tenant.id;

    return true;
  }
}
