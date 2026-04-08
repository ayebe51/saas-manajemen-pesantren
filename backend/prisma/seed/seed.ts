import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 19 modules as defined in the spec
const MODULES = [
  'dashboard',
  'santri',
  'ppdb',
  'academic',
  'catatan',
  'pelanggaran',
  'kesehatan',
  'kunjungan',
  'attendance',
  'points',
  'keuangan',
  'spp',
  'topup',
  'koperasi',
  'perizinan',
  'dormitory',
  'employee',
  'eid',
  'laporan',
];

type PermMatrix = Record<string, { canRead: boolean; canWrite: boolean }>;

/**
 * Build a permission matrix for a role.
 * rw = read+write, r = read only, '-' = no access
 */
function buildMatrix(config: Record<string, 'rw' | 'r' | '-'>): PermMatrix {
  const matrix: PermMatrix = {};
  for (const mod of MODULES) {
    const access = config[mod] ?? '-';
    matrix[mod] = {
      canRead: access === 'rw' || access === 'r',
      canWrite: access === 'rw',
    };
  }
  return matrix;
}

const ROLE_PERMISSIONS: Record<string, PermMatrix> = {
  Super_Admin: buildMatrix(
    Object.fromEntries(MODULES.map((m) => [m, 'rw'])) as Record<string, 'rw'>,
  ),

  Admin_Pesantren: buildMatrix({
    dashboard: 'r',
    santri: 'rw',
    ppdb: 'rw',
    academic: 'rw',
    catatan: 'rw',
    pelanggaran: 'rw',
    kesehatan: 'r',
    kunjungan: 'rw',
    attendance: 'rw',
    points: 'r',
    keuangan: 'r',
    spp: 'r',
    topup: 'r',
    koperasi: 'r',
    perizinan: 'rw',
    dormitory: 'rw',
    employee: 'rw',
    eid: 'rw',
    laporan: 'rw',
  }),

  Wali_Kelas: buildMatrix({
    dashboard: '-',
    santri: 'r',
    ppdb: '-',
    academic: 'rw',
    catatan: 'rw',
    pelanggaran: 'rw',
    kesehatan: '-',
    kunjungan: '-',
    attendance: 'rw',
    points: 'r',
    keuangan: '-',
    spp: '-',
    topup: '-',
    koperasi: '-',
    perizinan: '-',
    dormitory: '-',
    employee: '-',
    eid: '-',
    laporan: '-',
  }),

  Petugas_Keuangan: buildMatrix({
    dashboard: '-',
    santri: 'r',
    ppdb: '-',
    academic: '-',
    catatan: '-',
    pelanggaran: '-',
    kesehatan: '-',
    kunjungan: '-',
    attendance: '-',
    points: '-',
    keuangan: 'rw',
    spp: 'rw',
    topup: 'rw',
    koperasi: 'rw',
    perizinan: '-',
    dormitory: '-',
    employee: '-',
    eid: '-',
    laporan: 'r',
  }),

  Petugas_Kesehatan: buildMatrix({
    dashboard: '-',
    santri: 'r',
    ppdb: '-',
    academic: '-',
    catatan: '-',
    pelanggaran: '-',
    kesehatan: 'rw',
    kunjungan: '-',
    attendance: '-',
    points: '-',
    keuangan: '-',
    spp: '-',
    topup: '-',
    koperasi: '-',
    perizinan: '-',
    dormitory: '-',
    employee: '-',
    eid: '-',
    laporan: '-',
  }),

  Petugas_Asrama: buildMatrix({
    dashboard: '-',
    santri: 'r',
    ppdb: '-',
    academic: '-',
    catatan: '-',
    pelanggaran: '-',
    kesehatan: '-',
    kunjungan: 'rw',
    attendance: 'rw',
    points: '-',
    keuangan: '-',
    spp: '-',
    topup: '-',
    koperasi: '-',
    perizinan: 'r',
    dormitory: 'rw',
    employee: '-',
    eid: '-',
    laporan: '-',
  }),

  Santri: buildMatrix({
    dashboard: '-',
    santri: '-',
    ppdb: '-',
    academic: 'r',
    catatan: '-',
    pelanggaran: '-',
    kesehatan: '-',
    kunjungan: '-',
    attendance: 'r',
    points: '-',
    keuangan: '-',
    spp: '-',
    topup: '-',
    koperasi: '-',
    perizinan: 'r',
    dormitory: '-',
    employee: '-',
    eid: '-',
    laporan: '-',
  }),

  Wali_Santri: buildMatrix({
    dashboard: '-',
    santri: 'r',
    ppdb: '-',
    academic: 'r',
    catatan: 'r',
    pelanggaran: '-',
    kesehatan: '-',
    kunjungan: '-',
    attendance: 'r',
    points: '-',
    keuangan: 'r',
    spp: '-',
    topup: '-',
    koperasi: '-',
    perizinan: 'r',
    dormitory: '-',
    employee: '-',
    eid: '-',
    laporan: '-',
  }),

  Owner: buildMatrix(
    Object.fromEntries(MODULES.map((m) => [m, 'r'])) as Record<string, 'r'>,
  ),
};

async function seedRolesAndPermissions() {
  console.log('Seeding roles and permissions...');

  for (const [roleName, permMatrix] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: getRoleDescription(roleName),
      },
    });

    for (const [module, perms] of Object.entries(permMatrix)) {
      await prisma.permission.upsert({
        where: { roleId_module: { roleId: role.id, module } },
        update: { canRead: perms.canRead, canWrite: perms.canWrite },
        create: {
          roleId: role.id,
          module,
          canRead: perms.canRead,
          canWrite: perms.canWrite,
        },
      });
    }

    console.log(`  Role '${roleName}' seeded with ${Object.keys(permMatrix).length} module permissions`);
  }
}

function getRoleDescription(roleName: string): string {
  const descriptions: Record<string, string> = {
    Super_Admin: 'Pengguna dengan akses penuh ke seluruh sistem',
    Admin_Pesantren: 'Pengguna dengan akses administratif operasional pesantren',
    Wali_Kelas: 'Ustadz/ustadzah yang bertanggung jawab atas kelas tertentu',
    Petugas_Keuangan: 'Pengguna yang mengelola transaksi keuangan',
    Petugas_Kesehatan: 'Pengguna yang mengelola data kesehatan santri',
    Petugas_Asrama: 'Pengguna yang mengelola data asrama dan kamar',
    Santri: 'Peserta didik yang terdaftar di pesantren',
    Wali_Santri: 'Orang tua atau wali yang bertanggung jawab atas santri',
    Owner: 'Pimpinan pesantren dengan akses laporan dan dashboard',
  };
  return descriptions[roleName] ?? roleName;
}

async function main() {
  console.log('Seeding database...');

  // Seed roles and permissions first
  await seedRolesAndPermissions();

  // 1. Create Super Admin User (No Tenant) — will be linked to tenant after tenant creation
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);

  // 2. Create Sample Tenant first
  const existingTenant = await prisma.tenant.findFirst({
    where: { name: 'Pesantren Al-Hikmah' },
  });

  const tenant = existingTenant ?? await prisma.tenant.create({
    data: {
      name: 'Pesantren Al-Hikmah',
      address: 'Jl. Pesantren No. 1, Jakarta',
      phone: '021-12345678',
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });
  console.log('Tenant:', tenant.name);

  // Create Super Admin linked to the tenant
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@pesantren.com' },
    update: { tenantId: tenant.id },
    create: {
      email: 'superadmin@pesantren.com',
      passwordHash: superAdminPassword,
      name: 'Super Administrator',
      role: 'SUPERADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('Super Admin User created:', superAdmin.email);

  // Update tenant adminUserId
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { adminUserId: superAdmin.id },
  });

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
  const existingMusyrif = await prisma.user.findUnique({ where: { email: 'musyrif1@alhikmah.com' } });
  if (!existingMusyrif) {
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
        },
      ],
    });
  }

  // 5. Create 20 Santri (skip if already exist)
  const existingSantriCount = await prisma.santri.count({ where: { tenantId: tenant.id } });
  if (existingSantriCount === 0) {
    console.log('Creating 20 Santri...');
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
        },
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
        },
      });

      await prisma.santriWali.create({
        data: { santriId: santriList[(i - 1) * 2].id, waliId: wali.id, isPrimary: true },
      });
      await prisma.santriWali.create({
        data: { santriId: santriList[(i - 1) * 2 + 1].id, waliId: wali.id, isPrimary: true },
      });
    }
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
