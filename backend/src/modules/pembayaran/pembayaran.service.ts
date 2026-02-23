import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StripeService } from './stripe.service';
import { GenerateInvoiceDto, CreatePaymentIntentDto } from './dto/pembayaran.dto';

@Injectable()
export class PembayaranService {
  private readonly logger = new Logger(PembayaranService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  // --- INVOICES ---

  async findAllInvoices(tenantId: string, filters: { santriId?: string; status?: string }) {
    const whereClause: any = { tenantId };
    if (filters.santriId) whereClause.santriId = filters.santriId;
    if (filters.status) whereClause.status = filters.status;

    return this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        lines: true,
        santri: { select: { name: true, nisn: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async generateInvoice(tenantId: string, dto: GenerateInvoiceDto) {
    // Total amount calculated from lines
    const totalAmount = dto.lines.reduce((sum, line) => sum + line.amount, 0);

    return this.prisma.invoice.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        amountDue: totalAmount,
        dueDate: new Date(dto.dueDate),
        status: 'UNPAID',
        lines: {
          create: dto.lines.map(line => ({
            description: line.description,
            amount: line.amount,
            type: line.type
          }))
        }
      },
      include: { lines: true }
    });
  }

  // --- STRIPE & PAYMENTS ---

  async createPaymentIntent(tenantId: string, dto: CreatePaymentIntentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId },
      include: {
        payments: true
      }
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid fully');
    }

    // Calculate remaining balance
    const paidAmount = invoice.payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const remainingBalance = invoice.amountDue - paidAmount;
    
    // Validate requested amount
    const amountToPay = dto.amount || remainingBalance;
    if (amountToPay > remainingBalance) {
      throw new BadRequestException('Payment amount cannot exceed remaining balance');
    }

    // Call Stripe API
    const intent = await this.stripeService.createPaymentIntent(
      amountToPay,
      'idr', // Indonesian Rupiah
      {
        invoiceId: invoice.id,
        tenantId,
        santriId: invoice.santriId
      }
    );

    // Initial log of pending payment
    await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        method: 'STRIPE',
        amount: amountToPay,
        status: 'PENDING',
        transactionRef: intent.id
      }
    });

    return {
      clientSecret: intent.client_secret,
      amount: amountToPay,
      currency: 'idr'
    };
  }

  async handleSuccessfulPayment(transactionRef: string, invoiceId: string, amount: number, tenantId: string) {
    this.logger.log(`Handling successful payment webhook: ${transactionRef} for invoice ${invoiceId}`);

    return this.prisma.$transaction(async (prisma) => {
      // 1. Update the pending payment record, or create it if not exists yet
      const existingPayment = await prisma.payment.findFirst({
        where: { transactionRef }
      });

      if (existingPayment) {
        if (existingPayment.status === 'SUCCESS') return; // Idempotent 
        
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: 'SUCCESS', paidAt: new Date() }
        });
      } else {
        await prisma.payment.create({
          data: {
            invoiceId,
            method: 'STRIPE_WEBHOOK',
            amount,
            status: 'SUCCESS',
            transactionRef,
            paidAt: new Date()
          }
        });
      }

      // 2. Re-calculate invoice status
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: { where: { status: 'SUCCESS' } } }
      });

      // Recalc based on the updated state + current webhook amount
      // (The payment record should be included above since we updated it in TX, 
      // but just to be safe we sum it)
      const allPayments = await prisma.payment.findMany({
          where: { invoiceId, status: 'SUCCESS' }
      });
      
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      let newStatus = 'PARTIAL';
      if (invoice && totalPaid >= invoice.amountDue) {
        newStatus = 'PAID';
      }

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus }
      });

      // Generate Invoice PDF Job trigger goes here
      this.logger.log(`[Job Trigger] Generate Receipt PDF for invoice: ${invoiceId}`);

    });
  }
}
