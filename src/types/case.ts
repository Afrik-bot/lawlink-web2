export type CaseStatus = 'new' | 'in_progress' | 'review' | 'completed';
export type CaseOutcome = 'success' | 'partial' | 'unsuccessful' | 'pending';

export interface Case {
  _id: string;
  title: string;
  description: string;
  status: CaseStatus;
  outcome?: CaseOutcome;
  clientId: string;
  consultantId: string;
  createdAt: string;
  updatedAt: string;
  documents: string[];
  notes: string[];
}

export interface CaseStats {
  active: number;
  completed: number;
  successRate: number;
}
