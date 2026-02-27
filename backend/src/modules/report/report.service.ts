import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates an Excel File Buffer mapping data to sheets
   */
  async generateExcelReport(tenantId: string, module: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Manajemen Pesantren';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`${module.toUpperCase()} Report`);

    // --- Mock Logic per Module (Can be expanded with real Prisma querying) ---
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
    } else {
      sheet.addRow([`Report module '${module}' is under construction`]);
    }

    // Styling Header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  /**
   * Generates a PDF Document using PdfMake JSON Definition
   */
  async generatePdfReport(tenantId: string, title: string, contentData: any[]): Promise<Buffer> {
    // Fonts are required for PDFMake Server-Side.
    // Usually mapped to local TTF files. Using standard fonts (Roboto) built-in fallback.
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new (PdfPrinter as any)(fonts);

    const docDefinition: TDocumentDefinitions = {
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
                item.value || '-',
              ]),
            ],
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
      defaultStyle: {
        font: 'Roboto',
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err: any) => reject(err));
      pdfDoc.end();
    });
  }
}
