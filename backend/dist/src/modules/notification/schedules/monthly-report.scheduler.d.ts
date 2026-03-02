import { PrismaService } from '../../../common/prisma/prisma.service';
import { ReportGeneratorService } from '../report-generator.service';
import { WhatsappGatewayService } from '../whatsapp-gateway.service';
export declare class MonthlyReportScheduler {
    private readonly prisma;
    private readonly reportGenerator;
    private readonly waGateway;
    private readonly logger;
    constructor(prisma: PrismaService, reportGenerator: ReportGeneratorService, waGateway: WhatsappGatewayService);
    handleMonthlyExecutiveReport(): Promise<void>;
}
