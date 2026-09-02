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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportCvPdfUseCase = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const cv_repository_1 = require("../../domain/repositories/cv.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
let ExportCvPdfUseCase = class ExportCvPdfUseCase {
    cvRepository;
    constructor(cvRepository) {
        this.cvRepository = cvRepository;
    }
    async execute(cvId) {
        const cv = await this.cvRepository.findByIdWithRelations(cvId);
        if (!cv) {
            throw new domain_exception_1.EntityNotFoundException('CV', cvId);
        }
        const buffer = await this.renderPdf(cv);
        const fileName = `${cv.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
        return { buffer, fileName };
    }
    renderPdf(cv) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
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
                    const period = `${exp.dateRange.startDate.toDateString()} - ${exp.dateRange.isCurrent ? 'Present' : exp.dateRange.endDate?.toDateString()}`;
                    doc.fontSize(13).text(`${exp.position} at ${exp.company}`);
                    doc.fontSize(10).text(period);
                    if (exp.description)
                        doc.fontSize(11).text(exp.description);
                    doc.moveDown();
                }
            }
            if (cv.educations.length > 0) {
                doc.fontSize(16).text('Education');
                doc.moveDown(0.5);
                for (const edu of cv.educations) {
                    const period = `${edu.dateRange.startDate.toDateString()} - ${edu.dateRange.endDate?.toDateString() ?? 'Present'}`;
                    doc.fontSize(13).text(`${edu.degree}, ${edu.school}`);
                    doc.fontSize(10).text(period);
                    if (edu.description)
                        doc.fontSize(11).text(edu.description);
                    doc.moveDown();
                }
            }
            if (cv.skills.length > 0) {
                doc.fontSize(16).text('Skills');
                doc.moveDown(0.5);
                doc.fontSize(11).text(cv.skills.map((s) => (s.level ? `${s.name} (${s.level})` : s.name)).join(', '));
            }
            doc.end();
        });
    }
};
exports.ExportCvPdfUseCase = ExportCvPdfUseCase;
exports.ExportCvPdfUseCase = ExportCvPdfUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_repository_1.ICvRepository])
], ExportCvPdfUseCase);
//# sourceMappingURL=export-cv-pdf.use-case.js.map