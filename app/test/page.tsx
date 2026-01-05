'use client';

import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import LegalSummaryGenerator from '../components/LegalSummaryGenerator';
import { generatePDF } from '../utils/generatePDF';

export default function TestPage() {
  const [error, setError] = useState<string>();
  const [pdfUrl, setPdfUrl] = useState<string>();

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        // Using imported supabase instance
        const { data, error } = await supabase.from('recordings').select('count').single();
        if (error) throw error;
        console.log('✅ Supabase connection successful');
      } catch (err) {
        console.error('❌ Supabase connection error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to Supabase');
      }
    };

    const testPdfGeneration = async () => {
      console.log('🔍 Starting PDF generation test...');
      try {
        // Prepare test data matching PdfRequest interface
        const mockRequest = {
          content: 'This is a test summary content for PDF generation.',
          caseId: 'TEST-001',
          generatedBy: 'Test User',
          options: {
            watermark: false,
            confidential: true,
            includeSignature: true,
            includeTimestamps: true,
            includeFooter: true
          }
        };

        // Log data before generation
        console.log('🧾 Test Request:', JSON.stringify(mockRequest, null, 2));

        // Generate PDF with try-catch
        const resultPath = await generatePDF(mockRequest);
        console.log('✅ PDF generated:', resultPath);
        // resultPath is Uint8Array, create blob URL for display
        const blob = new Blob([resultPath as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('❌ PDF generation error:', err);
        if (err instanceof Error) {
          console.error('❌ Error stack:', err.stack);
        }
        setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      }
    };

    testConnection();
    testPdfGeneration();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Legal Summary Generator Test</h1>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Configuration Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : pdfUrl ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <p className="font-medium">PDF Generated Successfully!</p>
            <p className="text-sm">Path: {pdfUrl}</p>
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View PDF
          </a>
        </div>
      ) : (
        <LegalSummaryGenerator
          caseId="TEST-001"
          userName="Test User"
        />
      )}
    </div>
  );
}
