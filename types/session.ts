export interface Session {
  id: string;
  userId: string;
  title: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionControlsProps {
  sessionId?: string;
  onStartSession: () => void;
  onEndSession: () => void;
  sessionDuration: number;
  status: Session['status'];
}

export interface CreateSessionRequest {
  title: string;
}

export interface UpdateSessionRequest {
  title?: string;
  status?: Session['status'];
  endedAt?: Date;
}