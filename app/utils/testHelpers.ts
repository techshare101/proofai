import { SummaryResult } from '../types';

interface TestScenario {
  name: string;
  description: string;
  data: Partial<SummaryResult>;
}

const scenarios: TestScenario[] = [
  {
    name: 'safety-protocol-review',
    description: 'Comprehensive safety protocol review meeting',
    data: {
      videoUrl: 'https://proofai-evidence.storage.com/workplace-incident-05312025.mp4',
      summary: 'A comprehensive safety protocol review meeting was conducted with key stakeholders to address recent workplace incidents and implement new safety measures. The discussion covered incident prevention, staff training requirements, and budget allocation for safety improvements. All participants demonstrated strong commitment to enhancing workplace safety standards.',
      participants: [
        'John Smith - Senior Manager, Operations',
        'Sarah Chen - HR Director',
        'Michael Rodriguez - Safety Coordinator'
      ],
      keyEvents: [
        'Workplace safety protocol discussion initiated at 14:30',
        'Review of recent incident reports from manufacturing floor',
        'Implementation strategy for new safety measures presented',
        'Budget allocation for safety equipment upgrades discussed',
        'Training schedule for staff safety certification proposed'
      ],
      context: {
        time: '2025-05-31 14:30 CST',
        location: 'Corporate Headquarters - Conference Room A',
        environmentalFactors: 'Professional office setting, well-lit conference room, all safety protocols observed'
      },
      notableQuotes: [
        '"Our primary focus must be on preventative measures rather than reactive solutions." - Sarah Chen',
        '"The new safety protocols have reduced incident rates by 45% in similar facilities." - Michael Rodriguez',
        '"We need to ensure all shift supervisors are properly trained on the new procedures." - John Smith'
      ],
      reportRelevance: {
        legal: true,
        hr: true,
        safety: true,
        explanation: 'This meeting addresses critical workplace safety compliance requirements under OSHA regulations, involves HR policy updates, and documents formal safety protocol implementations.'
      }
    }
  },
  {
    name: 'workplace-dispute',
    description: 'Standard workplace disagreement scenario',
    data: {
      summary: 'A heated argument occurred between two employees in the hallway regarding project deadlines.',
      participants: ['John Davidson (Engineering Lead)', 'Sarah Chen (Product Manager)'],
      keyEvents: [
        'Initial disagreement over project timeline',
        'Verbal escalation regarding resource constraints',
        'Team lead intervention and de-escalation',
        'Parties agreed to formal meeting with HR'
      ],
      context: {
        location: '3rd Floor, Building A - Tech Hub',
        time: '2:30 PM EST, May 31, 2025',
        environmentalFactors: 'Open office area, multiple witnesses present'
      },
      notableQuotes: [
        '"This timeline is completely unrealistic for our team capacity"',
        '"We need to address this through proper channels"',
        '"Let\'s schedule a meeting with the full team to discuss"'
      ],
      reportRelevance: {
        legal: false,
        hr: true,
        safety: false,
        explanation: 'While no immediate legal action is required, HR involvement is recommended for conflict resolution.'
      }
    }
  },
  {
    name: 'safety-incident',
    description: 'Workplace safety violation scenario',
    data: {
      summary: 'An employee was observed repeatedly violating safety protocols in the laboratory area.',
      participants: ['Michael Torres (Lab Technician)', 'Dr. Emily Wong (Safety Officer)'],
      keyEvents: [
        'Multiple instances of PPE violations documented',
        'Verbal warning issued by safety officer',
        'Employee showed resistance to compliance',
        'Incident reported to department head'
      ],
      context: {
        location: 'R&D Laboratory, Building C',
        time: '11:15 AM EST, May 31, 2025',
        environmentalFactors: 'Chemical storage area, safety equipment present'
      },
      notableQuotes: [
        '"The safety protocols slow down my work"',
        '"This is a serious violation of our safety standards"',
        '"Previous warnings have been ignored"'
      ],
      reportRelevance: {
        legal: true,
        hr: true,
        safety: true,
        explanation: 'Immediate action required due to safety violations and potential liability risks.'
      }
    }
  }
];

export function generateTestSummary(scenarioName: string = 'workplace-dispute'): SummaryResult {
  const scenario = scenarios.find(s => s.name === scenarioName) || scenarios[0];
  return {
    success: true,
    ...scenario.data
  } as SummaryResult;
}

export function listTestScenarios(): { name: string; description: string }[] {
  return scenarios.map(({ name, description }) => ({ name, description }));
}

export async function generateSamplePDF() {
  const { generatePDF } = await import('./generatePDF');
  const sampleData = generateTestSummary('safety-protocol-review');
  
  await generatePDF(sampleData, {
    caseId: 'SAFETY-2025-0531',
    reviewedBy: 'Alex Thompson, Safety Compliance Officer',
    confidential: true
  });
}
