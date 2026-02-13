import type { LinearUser, LinearIssue, MemberMetrics } from './types';

function uniqueIssues(issues: LinearIssue[]): LinearIssue[] {
  const seen = new Set<string>();
  return issues.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

export function computeMetrics(
  members: LinearUser[],
  updatedIssues: LinearIssue[],
  createdIssues: LinearIssue[],
  completedIssues: LinearIssue[],
): MemberMetrics[] {
  return members.map(user => {
    const workedOn = uniqueIssues(
      updatedIssues.filter(i => i.assignee?.id === user.id)
    );

    const created = uniqueIssues(
      createdIssues.filter(i => i.creator?.id === user.id)
    );

    const completed = uniqueIssues(
      completedIssues.filter(i => i.assignee?.id === user.id)
    );

    const allTouched = uniqueIssues([
      ...updatedIssues.filter(i => i.assignee?.id === user.id || i.creator?.id === user.id),
      ...createdIssues.filter(i => i.creator?.id === user.id),
      ...completedIssues.filter(i => i.assignee?.id === user.id),
    ]);

    return { user, workedOn, created, completed, interacted: allTouched };
  }).sort((a, b) => {
    const scoreA = a.workedOn.length + a.created.length + a.completed.length + a.interacted.length;
    const scoreB = b.workedOn.length + b.created.length + b.completed.length + b.interacted.length;
    return scoreB - scoreA;
  });
}
