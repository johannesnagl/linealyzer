export interface LinearUser {
  id: string;
  name: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  active: boolean;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearIssueState {
  name: string;
  type: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignee: { id: string; name: string } | null;
  creator: { id: string; name: string } | null;
  state: LinearIssueState;
}

export interface LinearHistoryEntry {
  id: string;
  createdAt: string;
  actor: { id: string; name: string } | null;
  fromState: { name: string } | null;
  toState: { name: string } | null;
}

export interface LinearComment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  reactorIds: string[];
  issue: { id: string; identifier: string; title: string; url: string };
}

export interface UnresponsiveMention {
  issueIdentifier: string;
  issueTitle: string;
  issueUrl: string;
  mentionedAt: string;
  commentSnippet: string;
}

export interface MemberMetrics {
  user: LinearUser;
  workedOn: LinearIssue[];
  created: LinearIssue[];
  completed: LinearIssue[];
  interacted: LinearIssue[];
  unresponsiveMentions: UnresponsiveMention[];
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}
