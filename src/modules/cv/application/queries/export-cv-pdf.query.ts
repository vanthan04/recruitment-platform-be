import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import PDFDocument from 'pdfkit';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvNotFoundException } from '@/modules/cv/domain/exceptions/cv.exceptions';

export interface ExportCvPdfResult {
  buffer: Buffer;
  fileName: string;
}

export class ExportCvPdfQuery {
  constructor(public readonly cvId: string) {}
}

@Injectable()
@QueryHandler(ExportCvPdfQuery)
export class ExportCvPdfHandler implements IQueryHandler<
  ExportCvPdfQuery,
  ExportCvPdfResult
> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({ cvId }: ExportCvPdfQuery): Promise<ExportCvPdfResult> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    const buffer = await this.renderPdf(cv);
    const fileName = `${cv.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;

    return { buffer, fileName };
  }

  private renderPdf(cv: Cv): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).text(cv.title, { underline: true });
      doc.moveDown();

      if (cv.summary) {
        doc.fontSize(12).text(cv.summary);
        doc.moveDown();
      }

      if (cv.experiences.length > 0) {
        doc.fontSize(16).text('Experience');
        doc.moveDown(0.5);
        for (const exp of cv.experiences) {
          const period = `${exp.dateRange.startDate.toDateString()} - ${
            exp.dateRange.isCurrent
              ? 'Present'
              : exp.dateRange.endDate?.toDateString()
          }`;
          doc.fontSize(13).text(`${exp.position} at ${exp.company}`);
          doc.fontSize(10).text(period);
          if (exp.description) doc.fontSize(11).text(exp.description);
          doc.moveDown();
        }
      }

      if (cv.educations.length > 0) {
        doc.fontSize(16).text('Education');
        doc.moveDown(0.5);
        for (const edu of cv.educations) {
          const period = `${edu.dateRange.startDate.toDateString()} - ${
            edu.dateRange.endDate?.toDateString() ?? 'Present'
          }`;
          doc.fontSize(13).text(`${edu.degree}, ${edu.school}`);
          doc.fontSize(10).text(period);
          if (edu.description) doc.fontSize(11).text(edu.description);
          doc.moveDown();
        }
      }

      if (cv.skills.length > 0) {
        doc.fontSize(16).text('Skills');
        doc.moveDown(0.5);
        doc
          .fontSize(11)
          .text(
            cv.skills
              .map((s) => (s.level ? `${s.name} (${s.level})` : s.name))
              .join(', '),
          );
      }

      doc.end();
    });
  }
}
