import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 19 modules per spec Requirements 2.1, 2.5
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

type Access = 'rw' | 'r' | '-';
type PermMatrix = Record<string, { canRead: boolean; canWrite: boolean }>;

function buildMatrix(config: Record<string, Access>): PermMatrix {
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

// Permission matrix for 9 roles × 19 modules — Requirements 2.1, 2.5
const ROLE_PERMISSIONS: Record<string, PermMatrix> = {
  Super_Admin: buildMatrix(
    Object.fromEntries(MODULES.map((m) => [m, 'rw'])) as Record<string, Access>,
  ),
  Admin_Pesantren: buildMatrix({
    dashboard: 'r', santri: 'rw', ppdb: 'rw', academic: 'rw', catatan: 'rw',
    pelanggaran: 'rw', kesehatan: 'r', kunjungan: 'rw', attendance: 'rw',
    points: 'r', keuangan: 'r', spp: 'r', topup: 'r', koperasi: 'r',
    perizinan: 'rw', dormitory: 'rw', employee: 'rw', eid: 'rw', laporan: 'rw',
  }),
  Wali_Kelas: buildMatrix({
    dashboard: '-', santri: 'r', ppdb: '-', academic: 'rw', catatan: 'rw',
    pelanggaran: 'rw', kesehatan: '-', kunjungan: '-', attendance: 'rw',
    points: 'r', keuangan: '-', spp: '-', topup: '-', koperasi: '-',
    perizinan: '-', dormitory: '-', employee: '-', eid: '-', laporan: '-',
  }),
  Petugas_Keuangan: buildMatrix({
    dashboard: '-', santri: 'r', ppdb: '-', academic: '-', catatan: '-',
    pelanggaran: '-', kesehatan: '-', kunjungan: '-', attendance: '-',
    points: '-', keuangan: 'rw', spp: 'rw', topup: 'rw', koperasi: 'rw',
    perizinan: '-', dormitory: '-', employee: '-', eid: '-', laporan: 'r',
  }),
  Petugas_Kesehatan: buildMatrix({
    dashboard: '-', santri: 'r', ppdb: '-', academic: '-', catatan: '-',
    pelanggaran: '-', kesehatan: 'rw', kunjungan: '-', attendance: '-',
    points: '-', keuangan: '-', spp: '-', topup: '-', koperasi: '-',
    perizinan: '-', dormitory: '-', employee: '-', eid: '-', laporan: '-',
  }),
  Petugas_Asrama: buildMatrix({
    dashboard: '-', santri: 'r', ppdb: '-', academic: '-', catatan: '-',
    pelanggaran: '-', kesehatan: '-', kunjungan: 'rw', attendance: 'rw',
    points: '-', keuangan: '-', spp: '-', topup: '-', koperasi: '-',
    perizinan: 'r', dormitory: 'rw', employee: '-', eid: '-', laporan: '-',
  }),
  Santri: buildMatrix({
    dashboard: '-', santri: '-', ppdb: '-', academic: 'r', catatan: '-',
    pelanggaran: '-', kesehatan: '-', kunjungan: '-', attendance: 'r',
    points: '-', keuangan: '-', spp: '-', topup: '-', koperasi: '-',
    perizinan: 'r', dormitory: '-', employee: '-', eid: '-', laporan: '-',
  }),
  Wali_Santri: buildMatrix({
    dashboard: '-', santri: 'r', ppdb: '-', academic: 'r', catatan: 'r',
    pelanggaran: '-', kesehatan: '-', kunjungan: '-', attendance: 'r',
    points: '-', keuangan: 'r', spp: '-', topup: '-', koperasi: '-',
    perizinan: 'r', dormitory: '-', employee: '-', eid: '-', laporan: '-',
  }),
  Owner: buildMatrix(
    Object.fromEntries(MODULES.map((m) => [m, 'r'])) as Record<string, Access>,
  ),
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
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

// WA notification templates — Requirement 18.5, 18.8
const WA_TEMPLATES = [
  {
    key: 'PRESENSI_MASUK',
    body: "Assalamu'alaikum {{wali_nama}}, santri {{santri_nama}} telah hadir pada sesi {{sesi_nama}} pukul {{waktu}}. Terima kasih.",
  },
  {
    key: 'PRESENSI_KELUAR',
    body: "Assalamu'alaikum {{wali_nama}}, santri {{santri_nama}} telah keluar pada sesi {{sesi_nama}} pukul {{waktu}}.",
  },
  {
    key: 'PEMBAYARAN_BERHASIL',
    body: 'Pembayaran SPP {{bulan}} untuk {{santri_nama}} sebesar Rp{{jumlah}} telah diterima. No. Invoice: {{invoice_number}}. Terima kasih.',
  },
  {
    key: 'TOPUP_BERHASIL',
    body: 'Top-up saldo untuk {{santri_nama}} sebesar Rp{{jumlah}} berhasil. Saldo terkini: Rp{{saldo}}.',
  },
  {
    key: 'PELANGGARAN',
    body: 'Yth. {{wali_nama}}, santri {{santri_nama}} tercatat melakukan pelanggaran: {{pelanggaran_nama}} pada {{tanggal}}. Poin pelanggaran: {{total_poin}}.',
  },
  {
    key: 'REWARD',
    body: 'Selamat! Santri {{santri_nama}} mendapatkan poin reward: {{reward_nama}} pada {{tanggal}}. Total poin: {{total_poin}}.',
  },
  {
    key: 'IZIN_APPROVED',
    body: 'Izin santri {{santri_nama}} telah disetujui. Periode: {{tanggal_mulai}} s/d {{tanggal_selesai}}. Harap kembali tepat waktu.',
  },
  {
    key: 'IZIN_REJECTED',
    body: 'Izin santri {{santri_nama}} tidak dapat disetujui. Alasan: {{alasan}}. Silakan hubungi pihak pesantren untuk informasi lebih lanjut.',
  },
  {
    key: 'KUNJUNGAN',
    body: "Assalamu'alaikum {{wali_nama}}, tamu atas nama {{nama_tamu}} ({{hubungan}}) telah berkunjung kepada santri {{santri_nama}} pada {{waktu_masuk}}.",
  },
  {
    key: 'BUKU_PENGHUBUNG',
    body: 'Yth. {{wali_nama}}, Wali Kelas {{wali_kelas_nama}} telah membuat catatan baru untuk santri {{santri_nama}}. Silakan cek aplikasi untuk detailnya.',
  },
];

async function seedRolesAndPermissions(): Promise<Record<string, string>> {
  console.log('Seeding 9 roles and 19-module permission matrix...');
  const roleIds: Record<string, string> = {};

  for (const [roleName, permMatrix] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: ROLE_DESCRIPTIONS[roleName] },
      create: {
        name: roleName,
        description: ROLE_DESCRIPTIONS[roleName],
      },
    });
    roleIds[roleName] = role.id;

    for (const [module, perms] of Object.entries(permMatrix)) {
      await prisma.permission.upsert({
        where: { roleId_module: { roleId: role.id, module } },
        update: { canRead: perms.canRead, canWrite: perms.canWrite },
        create: { roleId: role.id, module, canRead: perms.canRead, canWrite: perms.canWrite },
      });
    }

    console.log(`  ✓ Role '${roleName}' — ${Object.keys(permMatrix).length} permissions`);
  }

  return roleIds;
}

async function seedWaTemplates() {
  console.log('Seeding WA notification templates...');
  for (const tpl of WA_TEMPLATES) {
    await prisma.waTemplate.upsert({
      where: { key: tpl.key },
      update: { body: tpl.body, isActive: true },
      create: { key: tpl.key, body: tpl.body, isActive: true },
    });
    console.log(`  ✓ Template '${tpl.key}'`);
  }
}

async function main() {
  console.log('Starting seed...');

  // Step 1: Seed roles and permissions
  const roleIds = await seedRolesAndPermissions();

  // Step 2: Seed WA templates
  await seedWaTemplates();

  // Step 3: Create default Super_Admin user — Requirements 2.1
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@pesantren.com' },
    update: {},
    create: {
      email: 'superadmin@pesantren.com',
      passwordHash: superAdminPassword,
      name: 'Super Administrator',
      role: 'SUPERADMIN',
      roleId: roleIds['Super_Admin'],
    },
  });
  console.log(`✓ Super Admin user: ${superAdmin.email} (password: superadmin123)`);

  // Step 4: Create sample tenant
  const existingTenant = await prisma.tenant.findFirst({
    where: { name: 'Pesantren Al-Ikhlas' },
  });

  const tenant = existingTenant ?? await prisma.tenant.create({
    data: {
      name: 'Pesantren Al-Ikhlas',
      address: 'Jl. Raya Pesantren No. 1, Jawa Barat',
      phone: '081234567890',
      plan: 'PRO',
      status: 'ACTIVE',
      settings: JSON.stringify({ theme: 'light', allowVisitorBooking: true }),
    },
  });
  console.log(`✓ Tenant: ${tenant.name}`);

  // Step 5: Create tenant admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@al-ikhlas.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@al-ikhlas.com',
      passwordHash: adminPassword,
      name: 'Admin Al-Ikhlas',
      role: 'TENANT_ADMIN',
      roleId: roleIds['Admin_Pesantren'],
      phone: '08111111111',
    },
  });
  console.log('✓ Tenant Admin user: admin@al-ikhlas.com (password: admin123)');

  // Step 6: Create sample wali and santri
  const existingSantriCount = await prisma.santri.count({ where: { tenantId: tenant.id } });
  if (existingSantriCount === 0) {
    const walis: { id: string }[] = [];
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

    for (let i = 1; i <= 10; i++) {
      const santri = await prisma.santri.create({
        data: {
          tenantId: tenant.id,
          nis: `NIS2024${i.toString().padStart(3, '0')}`,
          name: `Santri ${i}`,
          gender: i % 2 === 0 ? 'P' : 'L',
          kelas: `Kelas ${i % 3 === 0 ? 'X' : i % 2 === 0 ? 'XI' : 'XII'}`,
          dob: new Date(2008, i % 12, (i * 2) % 28 + 1),
          status: 'AKTIF',
          walis: {
            create: {
              waliId: walis[(i - 1) % walis.length].id,
              isPrimary: true,
            },
          },
        },
      });

      // Create wallet for each santri
      await prisma.wallet.create({
        data: {
          tenantId: tenant.id,
          santriId: santri.id,
          saldo: 0,
          balance: 0,
          isActive: true,
        },
      });
    }
    console.log('✓ 10 sample santri with wallets created');
  }

  console.log('\nSeed completed successfully!');
  console.log('─────────────────────────────────────────');
  console.log('Default credentials:');
  console.log('  Super Admin : superadmin@pesantren.com / superadmin123');
  console.log('  Tenant Admin: admin@al-ikhlas.com / admin123');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
