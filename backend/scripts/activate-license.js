"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const existing = await prisma.license.findFirst({
        where: { status: 'ACTIVE' },
    });
    if (existing) {
        console.log('License already active:', existing.id);
        return;
    }
    const license = await prisma.license.create({
        data: {
            licenseKey: 'DEV-LICENSE-2026',
            status: 'ACTIVE',
            activatedAt: new Date(),
            lastVerifiedAt: new Date(),
            gracePeriodDays: 30,
        },
    });
    console.log('License activated:', license.id);
}
main()
    .catch((e) => {
    console.error(e.message);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=activate-license.js.map