import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Super Admin User (No Tenant)
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@pesantren.com' },
    update: {},
    create: {
      email: 'superadmin@pesantren.com',
      passwordHash: superAdminPassword,
      name: 'Super Administrator',
      role: 'SUPERADMIN',
    },
  });
  console.log('Super Admin User created:', superAdmin.email);

  // 2. Create Sample Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Pesantren Al-Hikmah',
      address: 'Jl. Pesantren No. 1, Jakarta',
      phone: '021-12345678',
      adminUserId: superAdmin.id,
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });
  console.log('Tenant created:', tenant.name);

  // 3. Create Tenant Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const tenantAdmin = await prisma.user.upsert({
    where: { email: 'admin@alhikmah.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@alhikmah.com',
      passwordHash: adminPassword,
      name: 'Admin Al-Hikmah',
      role: 'TENANT_ADMIN',
    },
  });

  // 4. Create Musyrif & Pengurus
  await prisma.user.createMany({
    data: [
      {
        tenantId: tenant.id,
        email: 'musyrif1@alhikmah.com',
        passwordHash: adminPassword,
        name: 'Ust. Ahmad',
        role: 'MUSYRIF',
      },
      {
        tenantId: tenant.id,
        email: 'pengurus1@alhikmah.com',
        passwordHash: adminPassword,
        name: 'Kang Budi',
        role: 'PENGURUS',
      }
    ]
  });

  // 5. Create 20 Santri
  console.log('Creating 20 Santri...');
  const roles = ['L', 'P'];
  const santriList = [];
  for (let i = 1; i <= 20; i++) {
    const santri = await prisma.santri.create({
      data: {
        tenantId: tenant.id,
        nisn: `10102024${i.toString().padStart(3, '0')}`,
        name: `Santri Name ${i}`,
        gender: i % 2 === 0 ? 'P' : 'L',
        kelas: `Kelas ${i % 3 === 0 ? 'X' : i % 2 === 0 ? 'XI' : 'XII'}`,
        room: `Asrama ${i % 2 === 0 ? 'Putri A' : 'Putra A'}`,
        dob: new Date(2005, i % 12, (i * 2) % 28 + 1),
      }
    });
    santriList.push(santri);
  }

  // 6. Create 5 Wali and Link to first 10 Santri
  console.log('Creating 5 Wali...');
  for (let i = 1; i <= 5; i++) {
    const wali = await prisma.wali.create({
      data: {
        tenantId: tenant.id,
        name: `Wali Bapak ${i}`,
        relation: 'Ayah',
        phone: `08123456789${i}`,
      }
    });

    // Link one wali to 2 santri
    await prisma.santriWali.create({
      data: { santriId: santriList[(i-1)*2].id, waliId: wali.id, isPrimary: true }
    });
    await prisma.santriWali.create({
      data: { santriId: santriList[(i-1)*2+1].id, waliId: wali.id, isPrimary: true }
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
