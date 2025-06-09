import React from 'react';
import type { SummaryResult } from '../types';

interface SummaryCardProps {
  result: SummaryResult;
  isLoading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ result, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Summary</h3>
        <p className="text-gray-600">{result.summary}</p>
      </div>

      {result.participants && result.participants.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Participants</h3>
          <ul className="list-disc list-inside space-y-1">
            {result.participants.map((participant, index) => (
              <li key={index} className="text-gray-600">{participant}</li>
            ))}
          </ul>
        </div>
      )}

      {result.keyEvents && result.keyEvents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Key Events</h3>
          <ul className="list-disc list-inside space-y-1">
            {result.keyEvents.map((event, index) => (
              <li key={index} className="text-gray-600">{event}</li>
            ))}
          </ul>
        </div>
      )}

      {result.context && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Context</h3>
          <div className="text-gray-600">
            {result.context.location && <p><strong>Location:</strong> {result.context.location}</p>}
            {result.context.time && <p><strong>Time:</strong> {result.context.time}</p>}
            {result.context.environmentalFactors && (
              <p><strong>Environmental Factors:</strong> {result.context.environmentalFactors}</p>
            )}
          </div>
        </div>
      )}

      {result.notableQuotes && result.notableQuotes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Notable Quotes</h3>
          <ul className="list-disc list-inside space-y-1">
            {result.notableQuotes.map((quote, index) => (
              <li key={index} className="text-gray-600 italic">"{quote}"</li>
            ))}
          </ul>
        </div>
      )}

      {result.legallyRelevantDetails && result.legallyRelevantDetails.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Legally Relevant Details</h3>
          <ul className="list-disc list-inside space-y-1">
            {result.legallyRelevantDetails.map((detail, index) => (
              <li key={index} className="text-gray-600">{detail}</li>
            ))}
          </ul>
        </div>
      )}

      {result.reportRelevance && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Report Relevance</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {result.reportRelevance.legal && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Legal</span>
            )}
            {result.reportRelevance.hr && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">HR</span>
            )}
            {result.reportRelevance.safety && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Safety</span>
            )}
          </div>
          <p className="text-gray-600 text-sm">{result.reportRelevance.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
