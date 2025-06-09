type SummaryData = {
  caseId: string;
  reportDate: string;
  location?: string;
  participants?: string[];
  reportRelevance?: {
    legal?: boolean;
    hr?: boolean;
    safety?: boolean;
  };
};

export function formatSummary(summary: SummaryData): string {
  if (!summary || typeof summary !== 'object') {
    return 'Invalid summary data.';
  }

  const {
    caseId,
    reportDate,
    location = 'Not specified',
    participants = [],
    reportRelevance = {}
  } = summary;

  const relevanceTags = Object.entries(reportRelevance)
    .filter(([_, v]) => v)
    .map(([k]) => k.toUpperCase())
    .join(', ') || 'None';

  const formattedParticipants = participants.length
    ? participants.join(', ')
    : 'None listed';

  const result = `
  📄 REPORT SUMMARY
  --------------------------
  🆔 Case ID: ${caseId}
  📅 Report Date: ${new Date(reportDate).toLocaleString()}
  📍 Location: ${location}
  👥 Participants: ${formattedParticipants}
  🏷️ Relevance: ${relevanceTags}
  `.trim();

  // Fallback check
  if (!result || result.replace(/\s+/g, '').length === 0) {
    return 'No summary data available.';
  }

  return result;
}
