const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'admin@al-ikhlas.com';
    let user = await prisma.user.findUnique({ where: { email } });
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    if (user) {
      user = await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword }
      });
      console.log('Password reset successfully for existing user:', user.email);
    } else {
      let tenant = await prisma.tenant.findFirst({ where: { name: { contains: 'Ikhlas' } } });
      if (!tenant) {
        tenant = await prisma.tenant.findFirst();
      }
      
      if (!tenant) {
         console.log('No tenant found. Cannot create user.');
         return;
      }
      
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: 'Admin Al-Ikhlas',
          role: 'SUPERADMIN',
          tenantId: tenant.id
        }
      });
      console.log('User created successfully:', user.email);
    }
  } catch (e) {
    console.error('ERROR MESSAGE:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
