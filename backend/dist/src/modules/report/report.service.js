"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = require("exceljs");
const PdfPrinter = require("pdfmake");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ReportService = class ReportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateExcelReport(tenantId, module) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistem Manajemen Pesantren';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet(`${module.toUpperCase()} Report`);
        if (module === 'santri') {
            sheet.columns = [
                { header: 'No', key: 'id', width: 5 },
                { header: 'NISN', key: 'nisn', width: 15 },
                { header: 'Nama Lengkap', key: 'name', width: 30 },
                { header: 'Gender', key: 'gender', width: 10 },
            ];
            const data = await this.prisma.santri.findMany({ where: { tenantId } });
            data.forEach((row, index) => {
                sheet.addRow({ id: index + 1, nisn: row.nisn, name: row.name, gender: row.gender });
            });
        }
        else {
            sheet.addRow([`Report module '${module}' is under construction`]);
        }
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
    async generatePdfReport(tenantId, title, contentData) {
        const fonts = {
            Roboto: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        const printer = new PdfPrinter(fonts);
        const docDefinition = {
            content: [
                { text: title, style: 'header' },
                { text: `Generated on: ${new Date().toLocaleDateString('id-ID')}`, margin: [0, 0, 0, 20] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto'],
                        body: [
                            ['No', 'Description', 'Value'],
                            ...contentData.map((item, index) => [
                                index + 1,
                                item.description || '-',
                                item.value || '-'
                            ])
                        ]
                    }
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 10]
                }
            },
            defaultStyle: {
                font: 'Roboto'
            }
        };
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        return new Promise((resolve, reject) => {
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));
            pdfDoc.end();
        });
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportService);
//# sourceMappingURL=report.service.js.map