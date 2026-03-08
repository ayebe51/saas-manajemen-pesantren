"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tenant, superAdminPassword, superAdmin, tenantAdminPassword, tenantAdmin, musyrifPassword, musyrif, walis, i, wali, santris, i, randomWali, santri, sampleIzin, sampleInvoice, samplePaidInvoice, employees, roles, i, emp, i, santri, _i, santris_1, santri, balance, wallet, supplier, categories, i, item;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Starting seed...');
                    return [4 /*yield*/, prisma.tenant.findFirst({
                            where: { name: 'Pesantren Al-Ikhlas' },
                        })];
                case 1:
                    tenant = _a.sent();
                    if (!!tenant) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma.tenant.create({
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
                        })];
                case 2:
                    tenant = _a.sent();
                    console.log("Created Tenant: ".concat(tenant.name));
                    return [3 /*break*/, 4];
                case 3:
                    console.log("Found existing Tenant: ".concat(tenant.name));
                    _a.label = 4;
                case 4: return [4 /*yield*/, bcrypt.hash('superadmin123', 10)];
                case 5:
                    superAdminPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@pesantren-saas.com' },
                            update: {},
                            create: {
                                email: 'admin@pesantren-saas.com',
                                passwordHash: superAdminPassword,
                                role: 'SUPERADMIN',
                                name: 'SaaS Platform Admin',
                            },
                        })];
                case 6:
                    superAdmin = _a.sent();
                    console.log('Upserted Super Admin');
                    return [4 /*yield*/, bcrypt.hash('admin123', 10)];
                case 7:
                    tenantAdminPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@al-ikhlas.com' },
                            update: {},
                            create: {
                                tenantId: tenant.id,
                                email: 'admin@al-ikhlas.com',
                                passwordHash: tenantAdminPassword,
                                role: 'TENANT_ADMIN',
                                name: 'Admin Al-Ikhlas',
                                phone: '08111111111',
                            },
                        })];
                case 8:
                    tenantAdmin = _a.sent();
                    console.log('Upserted Tenant Admin');
                    return [4 /*yield*/, bcrypt.hash('musyrif123', 10)];
                case 9:
                    musyrifPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'musyrif@al-ikhlas.com' },
                            update: {},
                            create: {
                                tenantId: tenant.id,
                                email: 'musyrif@al-ikhlas.com',
                                passwordHash: musyrifPassword,
                                role: 'MUSYRIF',
                                name: 'Ustadz Ahmad',
                                phone: '08222222222',
                            },
                        })];
                case 10:
                    musyrif = _a.sent();
                    console.log('Upserted Musyrif');
                    walis = [];
                    i = 1;
                    _a.label = 11;
                case 11:
                    if (!(i <= 5)) return [3 /*break*/, 14];
                    return [4 /*yield*/, prisma.wali.create({
                            data: {
                                tenantId: tenant.id,
                                name: "Wali Santri ".concat(i),
                                relation: i % 2 === 0 ? 'Ayah' : 'Ibu',
                                phone: "0850000000".concat(i),
                                email: "wali".concat(i, "@example.com"),
                            },
                        })];
                case 12:
                    wali = _a.sent();
                    walis.push(wali);
                    _a.label = 13;
                case 13:
                    i++;
                    return [3 /*break*/, 11];
                case 14:
                    console.log("Created ".concat(walis.length, " Walis"));
                    santris = [];
                    i = 1;
                    _a.label = 15;
                case 15:
                    if (!(i <= 20)) return [3 /*break*/, 18];
                    randomWali = walis[Math.floor(Math.random() * walis.length)];
                    return [4 /*yield*/, prisma.santri.create({
                            data: {
                                tenantId: tenant.id,
                                nisn: "100200300".concat(i.toString().padStart(2, '0')),
                                name: "Santri ".concat(i, " Al-Ikhlas"),
                                gender: i % 2 === 0 ? 'L' : 'P',
                                dob: new Date(2010, 5, i),
                                kelas: "Kelas ".concat(Math.floor(i / 5) + 7),
                                room: "Kamar ".concat(Math.floor(i / 10) + 1),
                                walis: {
                                    create: {
                                        waliId: randomWali.id,
                                        isPrimary: true
                                    }
                                }
                            },
                        })];
                case 16:
                    santri = _a.sent();
                    santris.push(santri);
                    _a.label = 17;
                case 17:
                    i++;
                    return [3 /*break*/, 15];
                case 18:
                    console.log("Created ".concat(santris.length, " Santris"));
                    return [4 /*yield*/, prisma.izin.create({
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
                                qrCodeData: "IZIN-".concat(Date.now(), "-001"),
                            }
                        })];
                case 19:
                    sampleIzin = _a.sent();
                    console.log('Created Sample Izin');
                    return [4 /*yield*/, prisma.invoice.create({
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
                        })];
                case 20:
                    sampleInvoice = _a.sent();
                    return [4 /*yield*/, prisma.invoice.create({
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
                        })];
                case 21:
                    samplePaidInvoice = _a.sent();
                    console.log('Created Sample Invoices');
                    // Create Catatan Harian
                    return [4 /*yield*/, prisma.catatanHarian.create({
                            data: {
                                tenantId: tenant.id,
                                santriId: santris[0].id,
                                authorId: musyrif.id,
                                content: 'Santri sangat aktif dalam diskusi kelas hari ini.',
                                category: 'Prestasi'
                            }
                        })];
                case 22:
                    // Create Catatan Harian
                    _a.sent();
                    console.log('Created Sample Catatan');
                    employees = [];
                    roles = ['GURU', 'KEAMANAN', 'TATA_USAHA', 'MUSYRIFAH', 'MUSYRIF'];
                    i = 1;
                    _a.label = 23;
                case 23:
                    if (!(i <= 5)) return [3 /*break*/, 26];
                    return [4 /*yield*/, prisma.employee.create({
                            data: {
                                tenantId: tenant.id,
                                name: "Pegawai ".concat(i, " Al-Ikhlas"),
                                nip: "1980000".concat(i),
                                phone: "081999999".concat(i),
                                position: roles[i - 1],
                                status: 'ACTIVE',
                                joinDate: new Date(2020, 1, i),
                            }
                        })];
                case 24:
                    emp = _a.sent();
                    employees.push(emp);
                    _a.label = 25;
                case 25:
                    i++;
                    return [3 /*break*/, 23];
                case 26:
                    console.log("Created ".concat(employees.length, " Employees"));
                    i = 0;
                    _a.label = 27;
                case 27:
                    if (!(i < 5)) return [3 /*break*/, 30];
                    santri = santris[i];
                    return [4 /*yield*/, prisma.tahfidz.create({
                            data: {
                                tenantId: tenant.id,
                                santriId: santri.id,
                                surah: 'Al-Baqarah',
                                ayat: "".concat(i * 10 + 1, "-").concat(i * 10 + 10),
                                type: i % 2 === 0 ? 'SABAK' : 'SABQI',
                                grade: 'LANCAR',
                                date: new Date(),
                                recordedBy: musyrif.id,
                                notes: 'Alhamdulillah lancar',
                            }
                        })];
                case 28:
                    _a.sent();
                    _a.label = 29;
                case 29:
                    i++;
                    return [3 /*break*/, 27];
                case 30:
                    console.log('Created Tahfidz Records');
                    _i = 0, santris_1 = santris;
                    _a.label = 31;
                case 31:
                    if (!(_i < santris_1.length)) return [3 /*break*/, 36];
                    santri = santris_1[_i];
                    balance = Math.floor(Math.random() * 1000000) + 50000;
                    return [4 /*yield*/, prisma.wallet.create({
                            data: {
                                tenantId: tenant.id,
                                santriId: santri.id,
                                balance: balance,
                                isActive: true,
                            }
                        })];
                case 32:
                    wallet = _a.sent();
                    return [4 /*yield*/, prisma.walletTransaction.create({
                            data: {
                                walletId: wallet.id,
                                type: 'DEPOSIT',
                                method: 'TRANSFER',
                                amount: balance + 50000, // Deposit awal lebih besar dari saldo akhir
                                description: 'Setoran Tunai Wali',
                                handledBy: 'Admin TU',
                                status: 'SUCCESS'
                            }
                        })];
                case 33:
                    _a.sent();
                    return [4 /*yield*/, prisma.walletTransaction.create({
                            data: {
                                walletId: wallet.id,
                                type: 'PAYMENT',
                                method: 'CASH',
                                amount: 50000, // Jajan
                                description: 'Jajan Kantin',
                                handledBy: 'Kasir Koperasi',
                                status: 'SUCCESS'
                            }
                        })];
                case 34:
                    _a.sent();
                    _a.label = 35;
                case 35:
                    _i++;
                    return [3 /*break*/, 31];
                case 36:
                    console.log("Created Wallets for ".concat(santris.length, " Santris"));
                    return [4 /*yield*/, prisma.supplier.create({
                            data: {
                                tenantId: tenant.id,
                                name: 'CV Berkah',
                                contact: '08122334455',
                            }
                        })];
                case 37:
                    supplier = _a.sent();
                    categories = ['SERAGAM', 'BUKU', 'ATRIBUT'];
                    i = 1;
                    _a.label = 38;
                case 38:
                    if (!(i <= 5)) return [3 /*break*/, 42];
                    return [4 /*yield*/, prisma.item.create({
                            data: {
                                tenantId: tenant.id,
                                sku: "BRG-00".concat(i),
                                name: "Barang Koperasi ".concat(i),
                                category: categories[i % 3],
                                description: 'Barang berkualitas',
                                price: 25000 * i,
                                costPrice: 15000 * i,
                                stock: Math.floor(Math.random() * 50) + 5,
                                minStock: 10,
                            }
                        })];
                case 39:
                    item = _a.sent();
                    return [4 /*yield*/, prisma.inventoryTransaction.create({
                            data: {
                                tenantId: tenant.id,
                                itemId: item.id,
                                type: 'IN',
                                quantity: item.stock,
                                reference: "INV-IN-00".concat(i),
                                notes: 'Stok awal',
                                handledBy: 'Admin Gudang'
                            }
                        })];
                case 40:
                    _a.sent();
                    _a.label = 41;
                case 41:
                    i++;
                    return [3 /*break*/, 38];
                case 42:
                    console.log('Created Inventory Items & Transactions');
                    console.log('Seed completed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
