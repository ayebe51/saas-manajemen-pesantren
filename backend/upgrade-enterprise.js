const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgrade() {
  try {
    const email = 'admin@al-ikhlas.com';
    const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
    
    if (user && user.tenantId) {
      const updatedTenant = await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { plan: 'ENTERPRISE' }
      });
      console.log('Successfully upgraded tenant to ENTERPRISE:', updatedTenant.name);
    } else {
      console.log('User or tenant not found.');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

upgrade();
