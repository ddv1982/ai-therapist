export type SessionStatus = 'active' | 'completed';

function canTransitionSessionStatus(from: SessionStatus, to: SessionStatus): boolean {
  if (from === to) return true;

  if (from === 'active' && to === 'completed') {
    return true;
  }

  if (from === 'completed' && to === 'active') {
    return true;
  }

  return false;
}

export function assertSessionTransition(from: SessionStatus, to: SessionStatus): void {
  if (!canTransitionSessionStatus(from, to)) {
    throw new Error(`Invalid session status transition: ${from} -> ${to}`);
  }
}
