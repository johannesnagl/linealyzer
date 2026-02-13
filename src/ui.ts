import type { MemberMetrics, LinearIssue } from './types';

function issueList(issues: LinearIssue[], id: string): string {
  if (issues.length === 0) return '';
  const items = issues
    .map(i => `<li><a href="${i.url}" target="_blank" rel="noopener">${i.identifier}</a> ${escapeHtml(i.title)}<span class="issue-state">${escapeHtml(i.state.name)}</span></li>`)
    .join('');
  return `
    <details class="issue-details">
      <summary>${issues.length} issue${issues.length !== 1 ? 's' : ''}</summary>
      <ul id="${id}">${items}</ul>
    </details>
  `;
}

function escapeHtml(text: string): string {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function metricCard(label: string, count: number, issues: LinearIssue[], id: string, colorClass: string): string {
  return `
    <div class="metric ${colorClass}">
      <div class="metric-value">${count}</div>
      <div class="metric-label">${label}</div>
      ${issueList(issues, id)}
    </div>
  `;
}

export function renderDashboard(metrics: MemberMetrics[], date: string): void {
  const grid = document.getElementById('members-grid')!;
  const summaryBar = document.getElementById('summary-bar')!;
  const emptyState = document.getElementById('empty-state')!;

  emptyState.classList.add('hidden');

  const totalWorked = metrics.reduce((s, m) => s + m.workedOn.length, 0);
  const totalCreated = metrics.reduce((s, m) => s + m.created.length, 0);
  const totalCompleted = metrics.reduce((s, m) => s + m.completed.length, 0);
  const totalInteracted = metrics.reduce((s, m) => s + m.interacted.length, 0);
  const activeMembers = metrics.filter(m => m.interacted.length > 0).length;

  summaryBar.classList.remove('hidden');
  summaryBar.innerHTML = `
    <div class="summary-item">
      <span class="summary-value">${activeMembers}</span>
      <span class="summary-label">Active Members</span>
    </div>
    <div class="summary-item">
      <span class="summary-value">${totalWorked}</span>
      <span class="summary-label">Issues Worked On</span>
    </div>
    <div class="summary-item">
      <span class="summary-value">${totalCreated}</span>
      <span class="summary-label">Issues Created</span>
    </div>
    <div class="summary-item">
      <span class="summary-value">${totalCompleted}</span>
      <span class="summary-label">Issues Completed</span>
    </div>
    <div class="summary-item">
      <span class="summary-value">${totalInteracted}</span>
      <span class="summary-label">Total Interactions</span>
    </div>
    <div class="summary-date">${date}</div>
  `;

  if (metrics.length === 0) {
    grid.innerHTML = '<p class="no-data">No team members found.</p>';
    return;
  }

  grid.innerHTML = metrics
    .map((m, idx) => {
      const avatar = m.user.avatarUrl
        ? `<img src="${m.user.avatarUrl}" alt="${escapeHtml(m.user.name)}" class="avatar" />`
        : `<div class="avatar avatar-placeholder">${initials(m.user.name)}</div>`;

      const hasActivity = m.interacted.length > 0;

      return `
        <div class="member-card ${hasActivity ? '' : 'inactive'}">
          <div class="member-header">
            ${avatar}
            <div class="member-info">
              <h3>${escapeHtml(m.user.displayName || m.user.name)}</h3>
              ${!hasActivity ? '<span class="badge-inactive">No activity</span>' : ''}
            </div>
          </div>
          <div class="metrics-grid">
            ${metricCard('Worked On', m.workedOn.length, m.workedOn, `worked-${idx}`, 'metric-blue')}
            ${metricCard('Created', m.created.length, m.created, `created-${idx}`, 'metric-green')}
            ${metricCard('Completed', m.completed.length, m.completed, `completed-${idx}`, 'metric-purple')}
            ${metricCard('Interacted', m.interacted.length, m.interacted, `interacted-${idx}`, 'metric-orange')}
          </div>
        </div>
      `;
    })
    .join('');
}

export function showLoading(): void {
  document.getElementById('loading-state')!.classList.remove('hidden');
  document.getElementById('members-grid')!.innerHTML = '';
  document.getElementById('summary-bar')!.classList.add('hidden');
  document.getElementById('empty-state')!.classList.add('hidden');
}

export function hideLoading(): void {
  document.getElementById('loading-state')!.classList.add('hidden');
}

export function showError(message: string): void {
  hideLoading();
  document.getElementById('members-grid')!.innerHTML = `
    <div class="error-message">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
