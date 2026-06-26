export interface DBUser {
  id: string;
  name?: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  issue_type: string;
  severity: 'Low' | 'Medium' | 'Urgent' | 'Critical';
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
  viewed_by_admin: boolean;
  viewed_at?: string;
  rating?: number;
  rating_comment?: string;
  attachments?: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  dataUrl: string; // Base64 string payload
  size: number;
}

export interface DraftComplaint {
  id: string;
  issue_type: string;
  severity: string;
  title: string;
  description: string;
  attachments: SupportAttachment[];
  updated_at: string;
}

export interface DraftTicket {
  id: string;
  issue_type: string;
  severity: string;
  title: string;
  description: string;
  attachments: SupportAttachment[];
  updated_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: 'status_update' | 'new_comment' | 'notice_alert';
  title: string;
  message: string;
  ticket_id?: string;
  created_at: string;
  unread: boolean;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  text: string;
  sender: 'user' | 'admin';
  time: string;
  timestamp: number;
}

export interface StatusHistoryEntry {
  id: string;
  ticket_id: string;
  from_status: string;
  to_status: string;
  changed_at: string;
  operator: 'System' | 'Support Specialist' | 'Client User';
}
