import type { LinearUser, LinearIssue, LinearComment, MemberMetrics, UnresponsiveMention } from './types';

function uniqueIssues(issues: LinearIssue[]): LinearIssue[] {
  const seen = new Set<string>();
  return issues.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function mentionsUser(body: string, user: LinearUser): boolean {
  const lower = body.toLowerCase();
  if (user.displayName && lower.includes(`@${user.displayName.toLowerCase()}`)) return true;
  if (lower.includes(`@${user.name.toLowerCase()}`)) return true;
  const firstName = user.name.split(' ')[0];
  if (firstName && lower.includes(`@${firstName.toLowerCase()}`)) return true;
  return false;
}

function findUnresponsiveMentions(
  user: LinearUser,
  comments: LinearComment[],
  now: Date,
): UnresponsiveMention[] {
  const byIssue = new Map<string, LinearComment[]>();
  for (const c of comments) {
    const list = byIssue.get(c.issue.id) || [];
    list.push(c);
    byIssue.set(c.issue.id, list);
  }

  const results: UnresponsiveMention[] = [];

  for (const [, issueComments] of byIssue) {
    const sorted = issueComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (let i = 0; i < sorted.length; i++) {
      const comment = sorted[i];
      if (comment.user?.id === user.id) continue;
      if (!mentionsUser(comment.body, user)) continue;

      const mentionTime = new Date(comment.createdAt).getTime();
      const deadline = mentionTime + TWO_DAYS_MS;

      const reacted = (comment.reactorIds || []).includes(user.id);
      const replied = sorted.slice(i + 1).some(
        c => c.user?.id === user.id,
      );

      if (!reacted && !replied && now.getTime() > deadline) {
        results.push({
          issueIdentifier: comment.issue.identifier,
          issueTitle: comment.issue.title,
          issueUrl: comment.issue.url,
          mentionedAt: comment.createdAt,
          commentSnippet: comment.body.slice(0, 120),
        });
      }
    }
  }

  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.issueUrl)) return false;
    seen.add(r.issueUrl);
    return true;
  });
}

export function computeMetrics(
  members: LinearUser[],
  updatedIssues: LinearIssue[],
  createdIssues: LinearIssue[],
  completedIssues: LinearIssue[],
  comments: LinearComment[] = [],
): MemberMetrics[] {
  const now = new Date();

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

    const unresponsiveMentions = findUnresponsiveMentions(user, comments, now);

    return { user, workedOn, created, completed, interacted: allTouched, unresponsiveMentions };
  }).sort((a, b) => {
    const scoreA = a.workedOn.length + a.created.length + a.completed.length + a.interacted.length;
    const scoreB = b.workedOn.length + b.created.length + b.completed.length + b.interacted.length;
    return scoreB - scoreA;
  });
}
