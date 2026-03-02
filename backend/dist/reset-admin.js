"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin@pesantren.com';
    console.log(`Mencari pengguna: ${email}`);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('User tidak ditemukan!');
        return;
    }
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });
    console.log(`✅ Kata sandi ${email} berhasil direset menjadi: ${newPassword}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reset-admin.js.map