"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.generatePDF = generatePDF;
var jspdf_1 = require("jspdf");
require("jspdf-autotable");
var fs = require("fs");
var path = require("path");
var DEFAULT_OPTIONS = {
    caseId: '',
    reviewedBy: '',
    confidential: false,
};
function generatePDF(data_1) {
    return __awaiter(this, arguments, void 0, function (data, options) {
        var finalOptions, doc_1, pageWidth_1, pageHeight_1, margin_1, lineSpacing_1, y_1, addMetadataField, addSection, title, titleWidth, timestamp, caseId, totalPages, i, pageText, pageTextWidth, pageNumX, filename, reportsDir, savePath;
        var _a;
        if (options === void 0) { options = DEFAULT_OPTIONS; }
        return __generator(this, function (_b) {
            try {
                finalOptions = __assign(__assign({}, DEFAULT_OPTIONS), options);
                doc_1 = new jspdf_1.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
                pageWidth_1 = doc_1.internal.pageSize.width;
                pageHeight_1 = doc_1.internal.pageSize.height;
                margin_1 = 50;
                lineSpacing_1 = 20;
                y_1 = margin_1 + 20;
                addMetadataField = function (label, value) {
                    var fieldHeight = 24;
                    doc_1.setFillColor(247, 250, 252);
                    doc_1.rect(margin_1 - 10, y_1 - 16, pageWidth_1 - (2 * margin_1) + 20, fieldHeight, 'F');
                    doc_1.setTextColor(75, 85, 99);
                    doc_1.setFont('helvetica', 'bold');
                    doc_1.setFontSize(11);
                    doc_1.text(label + ':', margin_1, y_1);
                    var labelWidth = doc_1.getStringUnitWidth(label + ': ') * doc_1.getFontSize();
                    doc_1.setTextColor(30, 41, 59);
                    doc_1.setFont('helvetica', 'normal');
                    doc_1.text(value, margin_1 + labelWidth, y_1);
                    y_1 += lineSpacing_1;
                };
                addSection = function (title, content) {
                    y_1 += 20;
                    if (y_1 > pageHeight_1 - 100) {
                        doc_1.addPage();
                        y_1 = margin_1;
                    }
                    doc_1.setFillColor(44, 62, 80);
                    doc_1.rect(margin_1 - 10, y_1 - 16, pageWidth_1 - (2 * margin_1) + 20, 32, 'F');
                    doc_1.setFont('helvetica', 'bold');
                    doc_1.setFontSize(14);
                    doc_1.setTextColor(255, 255, 255);
                    doc_1.text(title.toUpperCase(), margin_1, y_1);
                    y_1 += 30;
                    doc_1.setFont('helvetica', 'normal');
                    doc_1.setFontSize(11);
                    doc_1.setTextColor(60, 60, 60);
                    if (Array.isArray(content)) {
                        content.forEach(function (item) {
                            if (y_1 > pageHeight_1 - 50) {
                                doc_1.addPage();
                                y_1 = margin_1;
                            }
                            doc_1.setFillColor(247, 250, 252);
                            doc_1.rect(margin_1 - 5, y_1 - 12, pageWidth_1 - (2 * margin_1) + 10, 24, 'F');
                            doc_1.setFont('helvetica', 'bold');
                            doc_1.text('•', margin_1, y_1);
                            doc_1.setFont('helvetica', 'normal');
                            doc_1.text(item, margin_1 + 20, y_1);
                            y_1 += lineSpacing_1;
                        });
                    }
                    else {
                        var maxWidth = pageWidth_1 - (2 * margin_1) - 10;
                        var lines = doc_1.splitTextToSize(content, maxWidth);
                        lines.forEach(function (line) {
                            if (y_1 > pageHeight_1 - 50) {
                                doc_1.addPage();
                                y_1 = margin_1;
                            }
                            doc_1.text(line, margin_1, y_1);
                            y_1 += lineSpacing_1 - 8;
                        });
                    }
                    y_1 += 8;
                };
                doc_1.setFillColor(44, 62, 80);
                doc_1.rect(0, 0, pageWidth_1, 80, 'F');
                doc_1.setFillColor(52, 152, 219);
                doc_1.rect(0, 80, pageWidth_1, 2, 'F');
                doc_1.setFont('helvetica', 'bold');
                doc_1.setFontSize(28);
                doc_1.setTextColor(255, 255, 255);
                title = 'ProofAI Legal Analysis Report';
                titleWidth = doc_1.getStringUnitWidth(title) * doc_1.getFontSize();
                doc_1.text(title, (pageWidth_1 - titleWidth) / 2, margin_1);
                timestamp = new Date().toLocaleString();
                caseId = finalOptions.caseId || "IR-".concat(timestamp.split(',')[0].replace(/\//g, ''));
                addMetadataField('Case ID', caseId);
                addMetadataField('Time', timestamp);
                if ((_a = data.context) === null || _a === void 0 ? void 0 : _a.location)
                    addMetadataField('Location', data.context.location);
                if (data.videoUrl)
                    addMetadataField('Video Reference', data.videoUrl);
                if (finalOptions.confidential) {
                    doc_1.setFillColor(253, 235, 235);
                    doc_1.rect(margin_1 - 5, y_1 - 5, pageWidth_1 - (2 * margin_1) + 10, 22, 'F');
                    doc_1.setTextColor(180, 0, 0);
                    doc_1.setFontSize(10);
                    doc_1.setFont('helvetica', 'bold');
                    doc_1.text('CONFIDENTIAL - For authorized personnel only', margin_1, y_1 + 8);
                    y_1 += lineSpacing_1 + 10;
                }
                y_1 += 2;
                doc_1.setDrawColor(200);
                doc_1.line(margin_1, y_1, pageWidth_1 - margin_1, y_1);
                y_1 += lineSpacing_1;
                addSection('Main Summary', data.summary);
                addSection('Participants', data.participants);
                addSection('Key Events', data.keyEvents);
                addSection('Context', [
                    "Time: ".concat(data.context.time),
                    "Location: ".concat(data.context.location),
                    "Environmental Factors: ".concat(data.context.environmentalFactors || 'N/A')
                ]);
                addSection('Notable Quotes', data.notableQuotes);
                addSection('Legal, HR & Safety Relevance', [
                    "Legal: ".concat(data.reportRelevance.legal ? '✔️ Yes' : '❌ No'),
                    "HR: ".concat(data.reportRelevance.hr ? '✔️ Yes' : '❌ No'),
                    "Safety: ".concat(data.reportRelevance.safety ? '✔️ Yes' : '❌ No'),
                    "Explanation: ".concat(data.reportRelevance.explanation || 'N/A')
                ]);
                y_1 = Math.min(y_1 + 20, pageHeight_1 - 60);
                doc_1.setDrawColor(200);
                doc_1.line(margin_1, y_1, pageWidth_1 - margin_1, y_1);
                y_1 += lineSpacing_1;
                doc_1.setFontSize(10);
                doc_1.setTextColor(100);
                doc_1.text('Prepared by:', margin_1, y_1);
                y_1 += lineSpacing_1;
                doc_1.setTextColor(44, 62, 80);
                doc_1.text(finalOptions.reviewedBy || 'ProofAI Legal Assistant', margin_1, y_1);
                totalPages = doc_1.internal.getNumberOfPages();
                for (i = 1; i <= totalPages; i++) {
                    doc_1.setPage(i);
                    doc_1.setFillColor(44, 62, 80);
                    doc_1.rect(0, pageHeight_1 - 50, pageWidth_1, 50, 'F');
                    doc_1.setFontSize(10);
                    doc_1.setTextColor(255, 255, 255);
                    doc_1.setFont('helvetica', 'bold');
                    doc_1.text('Generated by ProofAI', margin_1, pageHeight_1 - 25);
                    doc_1.setFont('helvetica', 'normal');
                    doc_1.text('www.proofai.app', margin_1, pageHeight_1 - 12);
                    pageText = "Page ".concat(i, " of ").concat(totalPages);
                    pageTextWidth = doc_1.getStringUnitWidth(pageText) * doc_1.getFontSize();
                    pageNumX = pageWidth_1 - margin_1 - pageTextWidth;
                    doc_1.setFillColor(52, 152, 219);
                    doc_1.rect(pageNumX - 10, pageHeight_1 - 35, pageTextWidth + 20, 25, 'F');
                    doc_1.setFont('helvetica', 'bold');
                    doc_1.setTextColor(255, 255, 255);
                    doc_1.text(pageText, pageNumX, pageHeight_1 - 20);
                }
                filename = "".concat(caseId, "_report.pdf");
                reportsDir = path.join(process.cwd(), 'public/reports');
                savePath = path.join(reportsDir, filename);
                if (!fs.existsSync(reportsDir)) {
                    fs.mkdirSync(reportsDir, { recursive: true });
                }
                fs.writeFileSync(savePath, Buffer.from(doc_1.output('arraybuffer')));
                return [2 /*return*/, "/reports/".concat(filename)];
            }
            catch (error) {
                console.error('Error generating PDF:', error);
                throw new Error('Failed to generate PDF report');
            }
            return [2 /*return*/];
        });
    });
}
