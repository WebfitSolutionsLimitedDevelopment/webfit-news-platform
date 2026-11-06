export const assignmentStatuses = ['draft', 'offered', 'accepted', 'declined', 'reported', 'complete'] as const;
export type AssignmentStatus = typeof assignmentStatuses[number];

export type Assignment = {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  issuer_name: string;
  title: string;
  venue: string;
  event_date: string;
  event_time: string | null;
  contact: string | null;
  instructions: string;
  status: AssignmentStatus;
  response_note: string | null;
  accepted_at: string | null;
  report_text: string | null;
  reported_at: string | null;
  completed_at: string | null;
  photos_purged_at: string | null;
};

export type AssignmentFile = {
  id: string;
  kind: 'briefing' | 'report';
  filename: string;
  content_type: string;
};

export const assignmentLabels: Record<AssignmentStatus, string> = {
  draft: 'Draft',
  offered: 'Awaiting response',
  accepted: 'Accepted',
  declined: 'Declined',
  reported: 'Report submitted',
  complete: 'Complete',
};
