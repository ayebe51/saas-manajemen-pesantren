import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Pesantren Al-Ikhlas',
      address: 'Jl. Raya Pesantren No. 1, Jawa Barat',
      phone: '081234567890',
      plan: 'PRO',
      settings: JSON.stringify({
        theme: 'light',
        allowVisitorBooking: true,
      }),
    },
  });
  console.log(`Created Tenant: ${tenant.name}`);

  // 2. Create Platform Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@pesantren-saas.com',
      passwordHash: superAdminPassword,
      role: 'SUPERADMIN',
      name: 'SaaS Platform Admin',
    },
  });
  console.log('Created Super Admin');

  // 3. Create Tenant Admin
  const tenantAdminPassword = await bcrypt.hash('admin123', 10);
  const tenantAdmin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@al-ikhlas.com',
      passwordHash: tenantAdminPassword,
      role: 'TENANT_ADMIN',
      name: 'Admin Al-Ikhlas',
      phone: '08111111111',
    },
  });
  console.log('Created Tenant Admin');

  // 4. Create Musyrif (Staff)
  const musyrifPassword = await bcrypt.hash('musyrif123', 10);
  const musyrif = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'musyrif@al-ikhlas.com',
      passwordHash: musyrifPassword,
      role: 'MUSYRIF',
      name: 'Ustadz Ahmad',
      phone: '08222222222',
    },
  });
  console.log('Created Musyrif');

  // 5. Create 5 Wali
  const walis = [];
  for (let i = 1; i <= 5; i++) {
    const wali = await prisma.wali.create({
      data: {
        tenantId: tenant.id,
        name: `Wali Santri ${i}`,
        relation: i % 2 === 0 ? 'Ayah' : 'Ibu',
        phone: `0850000000${i}`,
        email: `wali${i}@example.com`,
      },
    });
    walis.push(wali);
  }
  console.log(`Created ${walis.length} Walis`);

  // 6. Create 20 Santri and link to Walis
  const santris = [];
  for (let i = 1; i <= 20; i++) {
    const randomWali = walis[Math.floor(Math.random() * walis.length)];
    
    const santri = await prisma.santri.create({
      data: {
        tenantId: tenant.id,
        nisn: `100200300${i.toString().padStart(2, '0')}`,
        name: `Santri ${i} Al-Ikhlas`,
        gender: i % 2 === 0 ? 'L' : 'P',
        dob: new Date(2010, 5, i),
        kelas: `Kelas ${Math.floor(i/5) + 7}`, 
        room: `Kamar ${Math.floor(i/10) + 1}`,
        
        walis: {
          create: {
            waliId: randomWali.id,
            isPrimary: true
          }
        }
      },
    });
    santris.push(santri);
  }
  console.log(`Created ${santris.length} Santris`);

  // 7. Create Sample Data (Izin, Invoices, Catatan)
  
  // Create an Izin
  const sampleIzin = await prisma.izin.create({
    data: {
      tenantId: tenant.id,
      santriId: santris[0].id,
      type: 'PULANG',
      reason: 'Acara Keluarga',
      startAt: new Date(new Date().getTime() + 86400000), // Tomorrow
      endAt: new Date(new Date().getTime() + 86400000 * 3), // +3 days
      status: 'APPROVED',
      requestedBy: musyrif.id,
      approvedBy: walis[0].id,
      approvedAt: new Date(),
      qrCodeData: `IZIN-${Date.now()}-001`,
    }
  });
  console.log('Created Sample Izin');

  // Create an unpaid Invoice
  const sampleInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      santriId: santris[0].id,
      amountDue: 500000,
      dueDate: new Date(new Date().getTime() + 86400000 * 10),
      status: 'UNPAID',
      lines: {
        create: [
          { description: 'SPP Bulan Ini', amount: 300000, type: 'SPP' },
          { description: 'Uang Makan', amount: 200000, type: 'MAKAN' },
        ]
      }
    }
  });

  // Create a paid Invoice
  const samplePaidInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      santriId: santris[1].id,
      amountDue: 500000,
      dueDate: new Date(new Date().getTime() - 86400000 * 5),
      status: 'PAID',
      lines: {
        create: [
          { description: 'SPP Bulan Ini', amount: 300000, type: 'SPP' },
          { description: 'Uang Makan', amount: 200000, type: 'MAKAN' },
        ]
      },
      payments: {
        create: {
          method: 'TRANSFER',
          amount: 500000,
          status: 'SUCCESS',
          paidAt: new Date()
        }
      }
    }
  });
  console.log('Created Sample Invoices');

  // Create Catatan Harian
  await prisma.catatanHarian.create({
    data: {
      tenantId: tenant.id,
      santriId: santris[0].id,
      authorId: musyrif.id,
      content: 'Santri sangat aktif dalam diskusi kelas hari ini.',
      category: 'Prestasi'
    }
  });
  console.log('Created Sample Catatan');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
