import { Habit, HabitLog, WellnessTrackers, LifeScoreBreakdown } from '../types';
import { getAccessToken } from './authService';

export interface SyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedAt: string;
  totalLogsSynced: number;
}

export const createOrSyncHabitSheet = async (
  userName: string,
  habits: Habit[],
  logs: HabitLog[],
  wellnessLogs: WellnessTrackers[],
  lifeScore: LifeScoreBreakdown,
  existingSpreadsheetId?: string
): Promise<SyncResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google first to access Google Sheets.');
  }

  let spreadsheetId = existingSpreadsheetId;
  let spreadsheetUrl = '';

  // 1. If no existing spreadsheet, create one
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `AuraHabit Tracker - ${userName || 'My Progress'}`,
        },
        sheets: [
          { properties: { title: 'Habits_Overview' } },
          { properties: { title: 'Daily_Logs' } },
          { properties: { title: 'Wellness_Metrics' } },
          { properties: { title: 'Life_Score_Summary' } },
        ],
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to create Google Spreadsheet.');
    }

    const createData = await createRes.json();
    spreadsheetId = createData.spreadsheetId;
    spreadsheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 2. Prepare Data for Sheets
  const habitMap = new Map(habits.map((h) => [h.id, h.name]));

  // Sheet 1: Habits_Overview
  const habitsHeader = ['ID', 'Habit Name', 'Category', 'Frequency', 'Target Value', 'Unit', 'Priority', 'Difficulty', 'Status'];
  const habitsRows = habits.map((h) => [
    h.id,
    h.name,
    h.category,
    h.frequency,
    h.targetValue,
    h.unit,
    h.priority,
    h.difficulty,
    h.isArchived ? 'Archived' : 'Active',
  ]);
  const habitsValues = [habitsHeader, ...habitsRows];

  // Sheet 2: Daily_Logs
  const logsHeader = ['Date', 'Habit Name', 'Logged Value', 'Target Value', 'Completed', 'Completed Timestamp', 'Notes'];
  const logsRows = logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((l) => [
      l.date,
      habitMap.get(l.habitId) || l.habitId,
      l.value,
      l.targetValue,
      l.completed ? 'YES' : 'NO',
      l.completedAt || '',
      l.notes || '',
    ]);
  const logsValues = [logsHeader, ...logsRows];

  // Sheet 3: Wellness_Metrics
  const wellnessHeader = ['Date', 'Water (Glasses)', 'Sleep (Hours)', 'Bedtime', 'Wakeup Time', 'Exercise (Mins)', 'Activity', 'Study (Hours)', 'Screen Time (Mins)'];
  const wellnessRows = wellnessLogs.map((w) => [
    w.date,
    w.water ? `${w.water.current}/${w.water.target}` : '',
    w.sleep ? w.sleep.durationHours : '',
    w.sleep ? w.sleep.bedtime : '',
    w.sleep ? w.sleep.wakeupTime : '',
    w.exercise ? w.exercise.durationMins : '',
    w.exercise ? w.exercise.activityType : '',
    w.study ? w.study.hours : '',
    w.screenTime ? w.screenTime.actualMins : '',
  ]);
  const wellnessValues = [wellnessHeader, ...wellnessRows];

  // Sheet 4: Life_Score_Summary
  const lifeScoreHeader = ['Metric', 'Score', 'Max Points', 'Status'];
  const lifeScoreRows = [
    ['Overall Life Score', lifeScore.overallScore, 100, lifeScore.overallScore >= 80 ? 'Optimal' : 'Growing'],
    ['Habit Consistency', lifeScore.habitConsistencyScore, 35, `${Math.round((lifeScore.habitConsistencyScore / 35) * 100)}%`],
    ['Streak Health', lifeScore.streakScore, 20, `${Math.round((lifeScore.streakScore / 20) * 100)}%`],
    ['Goal Progress', lifeScore.goalProgressScore, 15, `${Math.round((lifeScore.goalProgressScore / 15) * 100)}%`],
    ['Wellness Balance', lifeScore.wellnessScore, 15, `${Math.round((lifeScore.wellnessScore / 15) * 100)}%`],
    ['Deep Focus Time', lifeScore.focusScore, 15, `${Math.round((lifeScore.focusScore / 15) * 100)}%`],
  ];
  const lifeScoreValues = [lifeScoreHeader, ...lifeScoreRows];

  // 3. Batch Update Spreadsheet Values
  const batchData = [
    { range: 'Habits_Overview!A1', values: habitsValues },
    { range: 'Daily_Logs!A1', values: logsValues },
    { range: 'Wellness_Metrics!A1', values: wellnessValues },
    { range: 'Life_Score_Summary!A1', values: lifeScoreValues },
  ];

  // Using spreadsheets.values.batchUpdate
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateRes.ok) {
    // If specific tabs didn't exist in an existing sheet, try writing to the first tab
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: logsValues,
        }),
      }
    );

    if (!fallbackRes.ok) {
      const errJson = await updateRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to update Google Sheet data.');
    }
  }

  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID was not generated or found.');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    syncedAt: new Date().toISOString(),
    totalLogsSynced: logs.length,
  };
};
