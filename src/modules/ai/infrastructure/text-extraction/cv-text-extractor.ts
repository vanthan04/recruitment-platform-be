import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

const MIN_USABLE_TEXT_LENGTH = 20;

/**
 * Best-effort plain-text extraction for CV analysis only — never used to
 * reconstruct or render the original document. Legacy binary `.doc` has no
 * good pure-JS parser (unlike PDF/DOCX) and is deliberately unsupported
 * rather than half-implemented; see CLAUDE.md-style docs in README once
 * this ships. A scanned/image-only PDF with no extractable text also fails
 * here — OCR is out of scope for this feature.
 */
@Injectable()
export class CvTextExtractor {
  async extractText(buffer: Buffer, fileType: string): Promise<string> {
    let text: string;

    switch (fileType) {
      case 'PDF':
        text = await this.extractFromPdf(buffer);
        break;
      case 'DOCX':
        text = await this.extractFromDocx(buffer);
        break;
      case 'DOC':
        throw new Error(
          'Legacy .doc files are not supported for CV analysis — re-upload as PDF or DOCX',
        );
      default:
        throw new Error(`Unsupported CV file type for analysis: ${fileType}`);
    }

    if (text.trim().length < MIN_USABLE_TEXT_LENGTH) {
      throw new Error(
        'No extractable text found in CV file (possibly a scanned/image-only document)',
      );
    }

    return text;
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
