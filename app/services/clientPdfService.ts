/**
 * 🚨 CANONICAL FILE — DO NOT MODIFY 🚨
 *
 * This file is production-locked.
 * Any changes will cause regressions.
 *
 * Allowed actions:
 *  - Read only
 *  - Import only
 *
 * DO NOT:
 *  - Refactor
 *  - Reformat
 *  - Rename
 *  - "Improve"
 *
 * Changes require explicit human approval.
 */
import { base64ToBlob } from '../utils/base64';
import { StructuredSummary } from '../types/pdf';

export interface PdfGenerationOptions {
  watermark?: boolean;
  confidential?: boolean;
  includeSignature?: boolean;
  includeTimestamps?: boolean;
  includeFooter?: boolean;
}

function formatSummary(summary: StructuredSummary): string {
  if (!summary || typeof summary !== 'object' || typeof summary.summary !== 'string') {
    return 'Summary not available. Please re-upload your recording.';
  }

  const header = [
    'PROOF AI INCIDENT REPORT',
    `Case ID: ${summary.caseId || 'N/A'}`,
    `Report Date: ${summary.reportDate ? new Date(summary.reportDate).toLocaleString() : 'N/A'}`,
    `Location: ${summary.location || 'N/A'}`,
    'Reviewed By: ProofAI Whisper Bot',
    ''
  ];

  const body: string[] = [];

  body.push('Summary:');
  body.push(summary.summary.trim() ? `  ${summary.summary}` : '  (No summary content)');
  body.push('');

  if (Array.isArray(summary.participants) && summary.participants.length > 0) {
    body.push('Participants:');
    summary.participants.forEach(p => body.push(`  • ${p}`));
    body.push('');
  }

  if (Array.isArray(summary.timestampedLog) && summary.timestampedLog.length > 0) {
    body.push('Timestamped Log:');
    summary.timestampedLog.forEach(log => body.push(`  • ${log}`));
    body.push('');
  }

  if (Array.isArray(summary.actionItems) && summary.actionItems.length > 0) {
    body.push('Action Items:');
    summary.actionItems.forEach(item => body.push(`  • ${item}`));
    body.push('');
  }

  if (summary.reportRelevance && typeof summary.reportRelevance === 'object') {
    const tags = Object.entries(summary.reportRelevance)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(', ');
    if (tags) {
      body.push(`Report Relevance: ${tags}`);
      body.push('');
    }
  }

  if (summary.incidentDetails) {
    body.push('Incident Details:');
    body.push(`  ${summary.incidentDetails}`);
    body.push('');
  }

  const result = [...header, ...body].join('\n');
  return !result.trim() || result.includes('[object Object]')
    ? 'Summary not available. Please re-upload your recording.'
    : result;
}


export class ClientPDFService {
  public static async generatePDFReport(
    summary: StructuredSummary,
    options: PdfGenerationOptions = {
      watermark: false,
      confidential: true,
      includeSignature: true,
      includeTimestamps: true,
      includeFooter: true
    }
  ): Promise<string> {
    const formattedSummary = formatSummary(summary);

    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary,
        formattedSummary,
        options
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Failed to generate PDF');
      } catch {
        throw new Error(`PDF generation failed with status ${response.status}`);
      }
    }

    // Handle direct PDF response instead of JSON
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/pdf')) {
      // For direct PDF response, create an object URL and return it
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      return pdfUrl;
    } else {
      // Fallback to previous behavior for backward compatibility
      try {
        const result = await response.json();
        const cleanUrl = result.url?.replace(/([^:])\/\{2,\}/g, '$1/');
        return cleanUrl;
      } catch (error) {
        console.error('Failed to parse response as JSON:', error);
        throw new Error('Invalid response format from PDF generation service');
      }
    }
  }
}
