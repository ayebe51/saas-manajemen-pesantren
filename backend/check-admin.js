"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Checking database...");
    const users = await prisma.user.findMany();
    console.log("Total users:", users.length);
    const superadminEmail = 'superadmin@pesantren.com';
    let superadmin = await prisma.user.findUnique({ where: { email: superadminEmail } });
    if (superadmin) {
        console.log(`User ${superadminEmail} found. Resetting password to 'superadmin123'...`);
        const hash = await bcrypt.hash('superadmin123', 10);
        await prisma.user.update({
            where: { id: superadmin.id },
            data: { passwordHash: hash }
        });
        console.log("Password reset successful.");
    }
    else {
        console.log(`User ${superadminEmail} not found. Creating new superadmin...`);
        const hash = await bcrypt.hash('superadmin123', 10);
        await prisma.user.create({
            data: {
                email: superadminEmail,
                passwordHash: hash,
                name: 'Super Administrator',
                role: 'SUPERADMIN',
            }
        });
        console.log("Superadmin created successfully with password 'superadmin123'.");
    }
    console.log("Admin accounts available:");
    users.filter(u => u.role === 'SUPERADMIN' || u.role === 'TENANT_ADMIN').forEach(u => {
        console.log(`- [${u.role}] ${u.email}`);
    });
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=check-admin.js.map