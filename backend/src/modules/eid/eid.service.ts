import { Injectable, NotFoundException } from '@nestjs/common';
import * as PdfPrinter from 'pdfmake';
import * as QRCode from 'qrcode';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EidService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Generate E-ID Card PDF for a santri.
   * Requirements: 17.1, 17.2, 17.3, 17.4
   */
  async generateEidPdf(santriId: string, tenantId: string): Promise<Buffer> {
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId, deletedAt: null },
    });

    if (!santri) {
      throw new NotFoundException(`Santri dengan ID ${santriId} tidak ditemukan`);
    }

    const baseUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    // Req 17.3 — QR code berisi URL verifikasi yang dapat dipindai
    const verificationUrl = `${baseUrl}/api/v1/public/verify-eid/${santriId}`;

    // Generate QR code as base64 data URL — Req 17.3
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    const namaLengkap = santri.namaLengkap || santri.name;
    const nis = santri.nis || '-';
    const kelas = santri.kelas || '-';
    const status = santri.status || 'AKTIF';
    const generatedAt = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new (PdfPrinter as any)(fonts);

    // E-ID Card layout — Req 17.1, 17.2
    const docDefinition: TDocumentDefinitions = {
      pageSize: { width: 242, height: 153 }, // CR80 card size in points (85.6mm x 54mm)
      pageMargins: [10, 10, 10, 10],
      content: [
        // Header bar
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: 222,
              h: 28,
              color: '#1a5276',
            },
          ],
          absolutePosition: { x: 10, y: 10 },
        },
        {
          text: 'KARTU IDENTITAS SANTRI',
          style: 'cardTitle',
          absolutePosition: { x: 10, y: 17 },
        },
        // Photo placeholder (if no photo, show initials box)
        ...(santri.fotoUrl || santri.photo
          ? [
              {
                image: santri.fotoUrl || santri.photo,
                width: 55,
                height: 65,
                absolutePosition: { x: 10, y: 45 },
              } as any,
            ]
          : [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 55, h: 65, color: '#d5d8dc' },
                ],
                absolutePosition: { x: 10, y: 45 },
              } as any,
              {
                text: namaLengkap.charAt(0).toUpperCase(),
                style: 'photoInitial',
                absolutePosition: { x: 30, y: 70 },
              } as any,
            ]),
        // Santri info
        {
          stack: [
            { text: namaLengkap, style: 'santriName' },
            { text: `NIS: ${nis}`, style: 'infoText' },
            { text: `Kelas: ${kelas}`, style: 'infoText' },
            { text: `Status: ${status}`, style: 'infoText' },
          ],
          absolutePosition: { x: 75, y: 45 },
        },
        // QR Code — Req 17.3
        {
          image: qrDataUrl,
          width: 55,
          height: 55,
          absolutePosition: { x: 177, y: 45 },
        },
        // Footer
        {
          text: `Diterbitkan: ${generatedAt}`,
          style: 'footerText',
          absolutePosition: { x: 10, y: 130 },
        },
      ],
      styles: {
        cardTitle: {
          fontSize: 9,
          bold: true,
          color: '#ffffff',
        },
        santriName: {
          fontSize: 9,
          bold: true,
          color: '#1a5276',
          margin: [0, 0, 0, 3],
        },
        infoText: {
          fontSize: 7.5,
          color: '#2c3e50',
          margin: [0, 1, 0, 1],
        },
        photoInitial: {
          fontSize: 22,
          bold: true,
          color: '#7f8c8d',
          alignment: 'center',
        },
        footerText: {
          fontSize: 6.5,
          color: '#7f8c8d',
          italics: true,
        },
      },
      defaultStyle: {
        font: 'Roboto',
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err: Error) => reject(err));
      pdfDoc.end();
    });
  }

  /**
   * Verify santri identity via QR code scan.
   * Returns basic public info for verification — Req 17.3
   */
  async verifySantri(santriId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, deletedAt: null },
      select: {
        id: true,
        nis: true,
        namaLengkap: true,
        name: true,
        kelas: true,
        status: true,
        fotoUrl: true,
      },
    });

    if (!santri) {
      throw new NotFoundException('Santri tidak ditemukan atau tidak aktif');
    }

    return {
      id: santri.id,
      nis: santri.nis,
      namaLengkap: santri.namaLengkap || santri.name,
      kelas: santri.kelas,
      status: santri.status,
      verified: true,
      verifiedAt: new Date(),
    };
  }
}
