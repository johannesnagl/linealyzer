import './style.css';
import { fetchTeams, fetchTeamMembers, fetchTeamIssuesUpdatedOn, fetchTeamIssuesCreatedOn, fetchTeamIssuesCompletedOn, fetchTeamIssueComments } from './api';
import { computeMetrics } from './metrics';
import { renderDashboard, showLoading, hideLoading, showError } from './ui';
import type { LinearTeam } from './types';

const TOKEN_KEY = 'linealyzer_token';
const TEAM_KEY = 'linealyzer_team';

const tokenInput = document.getElementById('token-input') as HTMLInputElement;
const tokenToggle = document.getElementById('token-toggle') as HTMLButtonElement;
const teamSelect = document.getElementById('team-select') as HTMLSelectElement;
const dateInput = document.getElementById('date-input') as HTMLInputElement;
const loadBtn = document.getElementById('load-btn') as HTMLButtonElement;

let teams: LinearTeam[] = [];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localDateToISO(dateStr: string, endOfDay: boolean): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (endOfDay) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function updateLoadBtn(): void {
  loadBtn.disabled = !tokenInput.value.trim() || !teamSelect.value;
}

tokenToggle.addEventListener('click', () => {
  tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
});

tokenInput.addEventListener('change', async () => {
  const token = tokenInput.value.trim();
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  await loadTeams(token);
});

tokenInput.addEventListener('input', updateLoadBtn);
teamSelect.addEventListener('change', () => {
  if (teamSelect.value) {
    localStorage.setItem(TEAM_KEY, teamSelect.value);
  }
  updateLoadBtn();
});

loadBtn.addEventListener('click', loadDashboard);

async function loadTeams(token: string): Promise<void> {
  try {
    teamSelect.disabled = true;
    teamSelect.innerHTML = '<option value="">Loading teams...</option>';
    teams = await fetchTeams(token);
    teamSelect.innerHTML = '<option value="">Select a team</option>' +
      teams.map(t => `<option value="${t.id}">${t.name} (${t.key})</option>`).join('');
    teamSelect.disabled = false;

    const savedTeam = localStorage.getItem(TEAM_KEY);
    if (savedTeam && teams.some(t => t.id === savedTeam)) {
      teamSelect.value = savedTeam;
    }

    updateLoadBtn();
  } catch (err) {
    teamSelect.innerHTML = '<option value="">Failed to load teams</option>';
    showError(err instanceof Error ? err.message : 'Failed to load teams');
  }
}

async function loadDashboard(): Promise<void> {
  const token = tokenInput.value.trim();
  const teamId = teamSelect.value;
  const date = dateInput.value;

  if (!token || !teamId || !date) return;

  showLoading();
  loadBtn.disabled = true;

  try {
    const dateStart = localDateToISO(date, false);
    const dateEnd = localDateToISO(date, true);

    const lookbackDate = new Date(date + 'T00:00:00');
    lookbackDate.setDate(lookbackDate.getDate() - 14);
    const commentsSince = lookbackDate.toISOString();

    const [members, updatedIssues, createdIssues, completedIssues, comments] = await Promise.all([
      fetchTeamMembers(token, teamId),
      fetchTeamIssuesUpdatedOn(token, teamId, dateStart, dateEnd),
      fetchTeamIssuesCreatedOn(token, teamId, dateStart, dateEnd),
      fetchTeamIssuesCompletedOn(token, teamId, dateStart, dateEnd),
      fetchTeamIssueComments(token, teamId, commentsSince),
    ]);

    const metrics = computeMetrics(members, updatedIssues, createdIssues, completedIssues, comments);
    hideLoading();
    renderDashboard(metrics, date);
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Failed to load dashboard data');
  } finally {
    loadBtn.disabled = false;
    updateLoadBtn();
  }
}

function init(): void {
  dateInput.value = today();

  const savedToken = localStorage.getItem(TOKEN_KEY);
  if (savedToken) {
    tokenInput.value = savedToken;
    loadTeams(savedToken);
  }

  updateLoadBtn();
}

init();
