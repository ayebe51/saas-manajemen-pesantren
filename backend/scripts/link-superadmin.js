"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('No tenant found. Run seed first.');
        return;
    }
    const result = await prisma.user.updateMany({
        where: { role: 'SUPERADMIN', tenantId: null },
        data: { tenantId: tenant.id },
    });
    console.log(`Updated ${result.count} superadmin(s) with tenantId: ${tenant.id}`);
    const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
    console.log('Superadmin tenantId:', superadmin?.tenantId);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=link-superadmin.js.map