import type { LinearTeam, LinearUser, LinearIssue, LinearHistoryEntry, LinearComment, PageInfo } from './types';
import { getCached, setCache } from './cache';

const API_URL = 'https://api.linear.app/graphql';

async function gql<T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(', '));
  }
  return json.data as T;
}

async function fetchAllPages<TNode>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
  extractConnection: (data: Record<string, unknown>) => { nodes: TNode[]; pageInfo: PageInfo },
): Promise<TNode[]> {
  const all: TNode[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const vars = { ...variables, after: cursor };
    const data = await gql<Record<string, unknown>>(token, query, vars);
    const connection = extractConnection(data);
    all.push(...connection.nodes);
    hasNext = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return all;
}

export async function fetchTeams(token: string): Promise<LinearTeam[]> {
  const cacheKey = 'teams';
  const cached = getCached<LinearTeam[]>(cacheKey);
  if (cached) return cached;

  const query = `
    query Teams($after: String) {
      teams(first: 50, after: $after) {
        nodes { id name key }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const teams = await fetchAllPages<LinearTeam>(token, query, {}, (d) => {
    const t = d as { teams: { nodes: LinearTeam[]; pageInfo: PageInfo } };
    return t.teams;
  });

  setCache(cacheKey, teams);
  return teams;
}

export async function fetchTeamMembers(token: string, teamId: string): Promise<LinearUser[]> {
  const cacheKey = `members_${teamId}`;
  const cached = getCached<LinearUser[]>(cacheKey);
  if (cached) return cached;

  const query = `
    query TeamMembers($teamId: String!, $after: String) {
      team(id: $teamId) {
        members(first: 50, after: $after) {
          nodes { id name displayName email avatarUrl active }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  `;

  const members = await fetchAllPages<LinearUser>(token, query, { teamId }, (d) => {
    const t = d as { team: { members: { nodes: LinearUser[]; pageInfo: PageInfo } } };
    return t.team.members;
  });

  setCache(cacheKey, members.filter(m => m.active));
  return members.filter(m => m.active);
}

export async function fetchTeamIssuesUpdatedOn(
  token: string,
  teamId: string,
  dateStart: string,
  dateEnd: string,
): Promise<LinearIssue[]> {
  const cacheKey = `issues_updated_${teamId}_${dateStart}`;
  const cached = getCached<LinearIssue[]>(cacheKey);
  if (cached) return cached;

  const query = `
    query UpdatedIssues($teamId: ID, $gte: DateTimeOrDuration!, $lt: DateTimeOrDuration!, $after: String) {
      issues(
        filter: {
          team: { id: { eq: $teamId } }
          updatedAt: { gte: $gte, lt: $lt }
        }
        first: 100
        after: $after
      ) {
        nodes {
          id identifier title url createdAt updatedAt completedAt
          assignee { id name }
          creator { id name }
          state { name type }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const issues = await fetchAllPages<LinearIssue>(token, query, { teamId, gte: dateStart, lt: dateEnd }, (d) => {
    const t = d as { issues: { nodes: LinearIssue[]; pageInfo: PageInfo } };
    return t.issues;
  });

  setCache(cacheKey, issues);
  return issues;
}

export async function fetchTeamIssuesCreatedOn(
  token: string,
  teamId: string,
  dateStart: string,
  dateEnd: string,
): Promise<LinearIssue[]> {
  const cacheKey = `issues_created_${teamId}_${dateStart}`;
  const cached = getCached<LinearIssue[]>(cacheKey);
  if (cached) return cached;

  const query = `
    query CreatedIssues($teamId: ID, $gte: DateTimeOrDuration!, $lt: DateTimeOrDuration!, $after: String) {
      issues(
        filter: {
          team: { id: { eq: $teamId } }
          createdAt: { gte: $gte, lt: $lt }
        }
        first: 100
        after: $after
      ) {
        nodes {
          id identifier title url createdAt updatedAt completedAt
          assignee { id name }
          creator { id name }
          state { name type }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const issues = await fetchAllPages<LinearIssue>(token, query, { teamId, gte: dateStart, lt: dateEnd }, (d) => {
    const t = d as { issues: { nodes: LinearIssue[]; pageInfo: PageInfo } };
    return t.issues;
  });

  setCache(cacheKey, issues);
  return issues;
}

export async function fetchTeamIssuesCompletedOn(
  token: string,
  teamId: string,
  dateStart: string,
  dateEnd: string,
): Promise<LinearIssue[]> {
  const cacheKey = `issues_completed_${teamId}_${dateStart}`;
  const cached = getCached<LinearIssue[]>(cacheKey);
  if (cached) return cached;

  const query = `
    query CompletedIssues($teamId: ID, $gte: DateTimeOrDuration!, $lt: DateTimeOrDuration!, $after: String) {
      issues(
        filter: {
          team: { id: { eq: $teamId } }
          completedAt: { gte: $gte, lt: $lt }
        }
        first: 100
        after: $after
      ) {
        nodes {
          id identifier title url createdAt updatedAt completedAt
          assignee { id name }
          creator { id name }
          state { name type }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const issues = await fetchAllPages<LinearIssue>(token, query, { teamId, gte: dateStart, lt: dateEnd }, (d) => {
    const t = d as { issues: { nodes: LinearIssue[]; pageInfo: PageInfo } };
    return t.issues;
  });

  setCache(cacheKey, issues);
  return issues;
}

export async function fetchTeamIssueComments(
  token: string,
  teamId: string,
  since: string,
): Promise<LinearComment[]> {
  const cacheKey = `comments_${teamId}_${since}`;
  const cached = getCached<LinearComment[]>(cacheKey);
  if (cached) return cached;

  const query = `
    query TeamIssueComments($teamId: ID, $since: DateTimeOrDuration!, $after: String) {
      issues(
        filter: {
          team: { id: { eq: $teamId } }
          updatedAt: { gte: $since }
        }
        first: 100
        after: $after
      ) {
        nodes {
          id identifier title url
          comments {
            nodes {
              id body createdAt
              user { id name }
              reactions { user { id } }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  interface RawIssueWithComments {
    id: string;
    identifier: string;
    title: string;
    url: string;
    comments: {
      nodes: { id: string; body: string; createdAt: string; user: { id: string; name: string } | null; reactions: { user: { id: string } }[] }[];
    };
  }

  const issues = await fetchAllPages<RawIssueWithComments>(token, query, { teamId, since }, (d) => {
    const t = d as { issues: { nodes: RawIssueWithComments[]; pageInfo: PageInfo } };
    return t.issues;
  });

  const comments: LinearComment[] = [];
  for (const issue of issues) {
    for (const c of issue.comments.nodes) {
      comments.push({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        user: c.user,
        reactorIds: (c.reactions || []).map(r => r.user.id),
        issue: { id: issue.id, identifier: issue.identifier, title: issue.title, url: issue.url },
      });
    }
  }

  setCache(cacheKey, comments);
  return comments;
}

export async function fetchIssueHistory(
  token: string,
  issueId: string,
): Promise<LinearHistoryEntry[]> {
  const query = `
    query IssueHistory($issueId: String!, $after: String) {
      issue(id: $issueId) {
        history(first: 50, after: $after) {
          nodes {
            id createdAt
            actor { id name }
            fromState { name }
            toState { name }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  `;

  return fetchAllPages<LinearHistoryEntry>(token, query, { issueId }, (d) => {
    const t = d as { issue: { history: { nodes: LinearHistoryEntry[]; pageInfo: PageInfo } } };
    return t.issue.history;
  });
}
