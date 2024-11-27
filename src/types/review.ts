export interface Review {
  id: string;
  userId: string;
  consultantId: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  helpfulCount: number;
  markedHelpful: boolean;
}

export type ReviewFilter = {
  rating?: number[];
  caseType?: string[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
};

export interface MarkReviewHelpfulPayload {
  userId: string;
  reviewId: string;
}
