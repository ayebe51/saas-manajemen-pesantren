"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seed...');
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
                kelas: `Kelas ${Math.floor(i / 5) + 7}`,
                room: `Kamar ${Math.floor(i / 10) + 1}`,
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
    const sampleIzin = await prisma.izin.create({
        data: {
            tenantId: tenant.id,
            santriId: santris[0].id,
            type: 'PULANG',
            reason: 'Acara Keluarga',
            startAt: new Date(new Date().getTime() + 86400000),
            endAt: new Date(new Date().getTime() + 86400000 * 3),
            status: 'APPROVED',
            requestedBy: musyrif.id,
            approvedBy: walis[0].id,
            approvedAt: new Date(),
            qrCodeData: `IZIN-${Date.now()}-001`,
        }
    });
    console.log('Created Sample Izin');
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
    const employees = [];
    const roles = ['GURU', 'KEAMANAN', 'TATA_USAHA', 'MUSYRIFAH', 'MUSYRIF'];
    for (let i = 1; i <= 5; i++) {
        const emp = await prisma.employee.create({
            data: {
                tenantId: tenant.id,
                name: `Pegawai ${i} Al-Ikhlas`,
                nip: `1980000${i}`,
                phone: `081999999${i}`,
                position: roles[i - 1],
                status: 'ACTIVE',
                joinDate: new Date(2020, 1, i),
            }
        });
        employees.push(emp);
    }
    console.log(`Created ${employees.length} Employees`);
    for (let i = 0; i < 5; i++) {
        const santri = santris[i];
        await prisma.tahfidz.create({
            data: {
                tenantId: tenant.id,
                santriId: santri.id,
                surah: 'Al-Baqarah',
                ayat: `${i * 10 + 1}-${i * 10 + 10}`,
                type: i % 2 === 0 ? 'SABAK' : 'SABQI',
                grade: 'LANCAR',
                date: new Date(),
                recordedBy: musyrif.id,
                notes: 'Alhamdulillah lancar',
            }
        });
    }
    console.log('Created Tahfidz Records');
    for (const santri of santris) {
        const balance = Math.floor(Math.random() * 1000000) + 50000;
        const wallet = await prisma.wallet.create({
            data: {
                tenantId: tenant.id,
                santriId: santri.id,
                balance: balance,
                isActive: true,
            }
        });
        await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'DEPOSIT',
                method: 'TRANSFER',
                amount: balance + 50000,
                description: 'Setoran Tunai Wali',
                handledBy: 'Admin TU',
                status: 'SUCCESS'
            }
        });
        await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'PAYMENT',
                method: 'CASH',
                amount: 50000,
                description: 'Jajan Kantin',
                handledBy: 'Kasir Koperasi',
                status: 'SUCCESS'
            }
        });
    }
    console.log(`Created Wallets for ${santris.length} Santris`);
    const supplier = await prisma.supplier.create({
        data: {
            tenantId: tenant.id,
            name: 'CV Berkah',
            contact: '08122334455',
        }
    });
    const categories = ['SERAGAM', 'BUKU', 'ATRIBUT'];
    for (let i = 1; i <= 5; i++) {
        const item = await prisma.item.create({
            data: {
                tenantId: tenant.id,
                sku: `BRG-00${i}`,
                name: `Barang Koperasi ${i}`,
                category: categories[i % 3],
                description: 'Barang berkualitas',
                price: 25000 * i,
                costPrice: 15000 * i,
                stock: Math.floor(Math.random() * 50) + 5,
                minStock: 10,
            }
        });
        await prisma.inventoryTransaction.create({
            data: {
                tenantId: tenant.id,
                itemId: item.id,
                type: 'IN',
                quantity: item.stock,
                reference: `INV-IN-00${i}`,
                notes: 'Stok awal',
                handledBy: 'Admin Gudang'
            }
        });
    }
    console.log('Created Inventory Items & Transactions');
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
//# sourceMappingURL=seed.js.map