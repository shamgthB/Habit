import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  Heart,
  Briefcase,
  Users,
  Brain,
  Coins,
  Sparkles,
  TrendingUp,
  Target,
  Info,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDaysAgo } from '../../utils/dateUtils';
import { isHabitScheduledForDate } from '../../utils/calculations';
import { HabitCategory } from '../../types';

interface LifeScoreRadarChartProps {
  daysRange?: number;
  className?: string;
}

interface DimensionData {
  dimension: string;
  subject: string;
  score: number;
  benchmark: number;
  categoryKeys: HabitCategory[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  habitsCount: number;
  completionRate: number;
  status: 'Optimal' | 'Strong' | 'Building' | 'Needs Focus';
  tip: string;
}

export const LifeScoreRadarChart: React.FC<LifeScoreRadarChartProps> = ({
  daysRange = 30,
  className = '',
}) => {
  const {
    habits,
    logs,
    lifeScore,
    wellnessLogs,
    focusSessions,
    moodLogs,
    goals,
  } = useApp();

  const [viewMode, setViewMode] = useState<'spheres' | 'categories'>('spheres');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  // Active habits
  const activeHabits = useMemo(() => habits.filter((h) => !h.isArchived), [habits]);

  // Logs within the daysRange
  const cutoffDate = useMemo(() => getDaysAgo(daysRange), [daysRange]);
  const rangeLogs = useMemo(() => logs.filter((l) => l.date >= cutoffDate), [logs, cutoffDate]);

  // Compute 6 Core Life Spheres (Health, Career, Social, Mindfulness, Finance, Vitality/Growth)
  const sphereDimensions = useMemo<DimensionData[]>(() => {
    // 1. Health & Vitality (Health, Fitness, Sleep + Hydration/Sleep logs)
    const healthHabits = activeHabits.filter((h) =>
      ['Health', 'Fitness', 'Sleep'].includes(h.category)
    );
    let healthSched = 0;
    let healthDone = 0;
    for (let i = 0; i < daysRange; i++) {
      const d = getDaysAgo(i);
      healthHabits.forEach((h) => {
        if (isHabitScheduledForDate(h, d)) {
          healthSched++;
          const match = rangeLogs.find((l) => l.habitId === h.id && l.date === d);
          if (match && match.completed) healthDone++;
        }
      });
    }
    const healthHabitRate = healthSched > 0 ? (healthDone / healthSched) * 100 : 80;
    // Wellness logs bonus
    const recentWellness = wellnessLogs.slice(0, 7);
    let wellnessBonus = 0;
    if (recentWellness.length > 0) {
      const metWater = recentWellness.filter(
        (w) => w.water && w.water.current >= w.water.target * 0.8
      ).length;
      const metSleep = recentWellness.filter(
        (w) => w.sleep && w.sleep.durationHours >= 7 && w.sleep.durationHours <= 9
      ).length;
      wellnessBonus = Math.round(((metWater + metSleep) / (recentWellness.length * 2)) * 15);
    } else {
      wellnessBonus = 10;
    }
    const healthScore = Math.min(
      100,
      Math.max(30, Math.round(healthHabitRate * 0.85 + wellnessBonus))
    );

    // 2. Career & Mastery (Work, Productivity, Study + Focus Sessions)
    const careerHabits = activeHabits.filter((h) =>
      ['Work', 'Productivity', 'Study'].includes(h.category)
    );
    let careerSched = 0;
    let careerDone = 0;
    for (let i = 0; i < daysRange; i++) {
      const d = getDaysAgo(i);
      careerHabits.forEach((h) => {
        if (isHabitScheduledForDate(h, d)) {
          careerSched++;
          const match = rangeLogs.find((l) => l.habitId === h.id && l.date === d);
          if (match && match.completed) careerDone++;
        }
      });
    }
    const careerHabitRate = careerSched > 0 ? (careerDone / careerSched) * 100 : 75;
    // Focus bonus
    const recentFocus = focusSessions.filter((s) => s.date >= getDaysAgo(14));
    const totalFocusMinutes = recentFocus.reduce((acc, s) => acc + s.durationMinutes, 0);
    const focusBonus = Math.min(15, Math.round((totalFocusMinutes / 120) * 15));
    const careerScore = Math.min(
      100,
      Math.max(30, Math.round(careerHabitRate * 0.85 + focusBonus))
    );

    // 3. Social & Connection (Personal, Other + Social Check-ins)
    const socialHabits = activeHabits.filter((h) =>
      ['Personal', 'Other'].includes(h.category)
    );
    let socialSched = 0;
    let socialDone = 0;
    for (let i = 0; i < daysRange; i++) {
      const d = getDaysAgo(i);
      socialHabits.forEach((h) => {
        if (isHabitScheduledForDate(h, d)) {
          socialSched++;
          const match = rangeLogs.find((l) => l.habitId === h.id && l.date === d);
          if (match && match.completed) socialDone++;
        }
      });
    }
    const socialHabitRate = socialSched > 0 ? (socialDone / socialSched) * 100 : 78;
    const socialScore = Math.min(
      100,
      Math.max(35, Math.round(socialHabitRate * 0.9 + 8))
    );

    // 4. Mindfulness & Peace (Mindfulness + Mood Logs)
    const mindHabits = activeHabits.filter((h) => h.category === 'Mindfulness');
    let mindSched = 0;
    let mindDone = 0;
    for (let i = 0; i < daysRange; i++) {
      const d = getDaysAgo(i);
      mindHabits.forEach((h) => {
        if (isHabitScheduledForDate(h, d)) {
          mindSched++;
          const match = rangeLogs.find((l) => l.habitId === h.id && l.date === d);
          if (match && match.completed) mindDone++;
        }
      });
    }
    const mindHabitRate = mindSched > 0 ? (mindDone / mindSched) * 100 : 72;
    // Mood bonus
    const recentMoods = moodLogs.filter((m) => m.date >= getDaysAgo(14));
    const avgEnergy =
      recentMoods.length > 0
        ? recentMoods.reduce((acc, m) => acc + m.energy, 0) / recentMoods.length
        : 7;
    const moodBonus = Math.round((avgEnergy / 10) * 15);
    const mindScore = Math.min(
      100,
      Math.max(30, Math.round(mindHabitRate * 0.85 + moodBonus))
    );

    // 5. Finance & Security (Finance + Goal progression)
    const financeHabits = activeHabits.filter((h) => h.category === 'Finance');
    let finSched = 0;
    let finDone = 0;
    for (let i = 0; i < daysRange; i++) {
      const d = getDaysAgo(i);
      financeHabits.forEach((h) => {
        if (isHabitScheduledForDate(h, d)) {
          finSched++;
          const match = rangeLogs.find((l) => l.habitId === h.id && l.date === d);
          if (match && match.completed) finDone++;
        }
      });
    }
    const finHabitRate = finSched > 0 ? (finDone / finSched) * 100 : 70;
    // Goal bonus
    const activeGoals = goals.filter((g) => !g.completed);
    const goalBonus = activeGoals.length > 0 ? 12 : 8;
    const financeScore = Math.min(
      100,
      Math.max(30, Math.round(finHabitRate * 0.85 + goalBonus))
    );

    // 6. Growth & Discipline (Streak stability and life score consistency)
    const growthScore = Math.min(
      100,
      Math.max(
        40,
        Math.round(
          lifeScore.habitConsistencyScore * 1.5 +
            lifeScore.streakScore * 1.4 +
            lifeScore.goalProgressScore * 1.2
        )
      )
    );

    const getStatus = (score: number): DimensionData['status'] => {
      if (score >= 85) return 'Optimal';
      if (score >= 70) return 'Strong';
      if (score >= 50) return 'Building';
      return 'Needs Focus';
    };

    return [
      {
        dimension: 'Health',
        subject: 'Health',
        score: healthScore,
        benchmark: 88,
        categoryKeys: ['Health', 'Fitness', 'Sleep'],
        icon: Heart,
        color: '#30D158',
        badgeBg: 'bg-[#30D158]/15 text-[#30D158] dark:bg-[#30D158]/20',
        badgeText: 'text-[#30D158]',
        description: 'Physical vitality, workouts, hydration, and sleep quality',
        habitsCount: healthHabits.length,
        completionRate: Math.round(healthHabitRate),
        status: getStatus(healthScore),
        tip:
          healthScore < 75
            ? 'Prioritize 7-8 hours sleep and regular hydration to boost your physical foundation.'
            : 'Excellent physical cadence! Maintain consistent hydration during workouts.',
      },
      {
        dimension: 'Career',
        subject: 'Career',
        score: careerScore,
        benchmark: 85,
        categoryKeys: ['Work', 'Productivity', 'Study'],
        icon: Briefcase,
        color: '#0A84FF',
        badgeBg: 'bg-[#0A84FF]/15 text-[#0A84FF] dark:bg-[#0A84FF]/20',
        badgeText: 'text-[#0A84FF]',
        description: 'Professional output, study sessions, and deep focus blocks',
        habitsCount: careerHabits.length,
        completionRate: Math.round(careerHabitRate),
        status: getStatus(careerScore),
        tip:
          careerScore < 75
            ? 'Try two 25-minute Pomodoro deep work blocks per day to lift productivity.'
            : 'Strong mastery trajectory. Protect deep focus blocks in the morning.',
      },
      {
        dimension: 'Social',
        subject: 'Social',
        score: socialScore,
        benchmark: 82,
        categoryKeys: ['Personal', 'Other'],
        icon: Users,
        color: '#FF9F0A',
        badgeBg: 'bg-[#FF9F0A]/15 text-[#FF9F0A] dark:bg-[#FF9F0A]/20',
        badgeText: 'text-[#FF9F0A]',
        description: 'Meaningful connections, friendships, and community accountability',
        habitsCount: socialHabits.length,
        completionRate: Math.round(socialHabitRate),
        status: getStatus(socialScore),
        tip:
          socialScore < 75
            ? 'Schedule a weekly check-in or shared workout with a friend or buddy.'
            : 'Healthy relationship balance! Keep nurturing supportive social circles.',
      },
      {
        dimension: 'Mindfulness',
        subject: 'Mindfulness',
        score: mindScore,
        benchmark: 86,
        categoryKeys: ['Mindfulness'],
        icon: Brain,
        color: '#BF5AF2',
        badgeBg: 'bg-[#BF5AF2]/15 text-[#BF5AF2] dark:bg-[#BF5AF2]/20',
        badgeText: 'text-[#BF5AF2]',
        description: 'Mental clarity, meditation, reflection, and inner calm',
        habitsCount: mindHabits.length,
        completionRate: Math.round(mindHabitRate),
        status: getStatus(mindScore),
        tip:
          mindScore < 75
            ? 'Spend 5 minutes with the Daily Affirmation widget or a breathing exercise.'
            : 'Calm, grounded presence. Reflective journaling preserves this clarity.',
      },
      {
        dimension: 'Finance',
        subject: 'Finance',
        score: financeScore,
        benchmark: 84,
        categoryKeys: ['Finance'],
        icon: Coins,
        color: '#FFD60A',
        badgeBg: 'bg-[#FFD60A]/15 text-[#FFD60A] dark:bg-[#FFD60A]/20',
        badgeText: 'text-[#FFD60A]',
        description: 'Budgeting discipline, savings habits, and financial milestones',
        habitsCount: financeHabits.length,
        completionRate: Math.round(finHabitRate),
        status: getStatus(financeScore),
        tip:
          financeScore < 75
            ? 'Log a daily expense audit habit or review your active weekly budget goal.'
            : 'Solid financial tracking hygiene. Keep reinvesting in high-ROI habits.',
      },
      {
        dimension: 'Growth',
        subject: 'Growth',
        score: growthScore,
        benchmark: 90,
        categoryKeys: ['Health', 'Work', 'Study'],
        icon: TrendingUp,
        color: '#64D2FF',
        badgeBg: 'bg-[#64D2FF]/15 text-[#64D2FF] dark:bg-[#64D2FF]/20',
        badgeText: 'text-[#64D2FF]',
        description: 'Streak resilience, momentum, and consistent daily routine execution',
        habitsCount: activeHabits.length,
        completionRate: Math.round(
          activeHabits.length > 0 ? (lifeScore.overallScore / 100) * 100 : 75
        ),
        status: getStatus(growthScore),
        tip:
          growthScore < 75
            ? 'Focus on protecting your top 2 non-negotiable habits to build momentum.'
            : 'Outstanding discipline index! Your streak momentum is compounding.',
      },
    ];
  }, [
    activeHabits,
    rangeLogs,
    daysRange,
    wellnessLogs,
    focusSessions,
    moodLogs,
    goals,
    lifeScore,
  ]);

  // Compute Active Categories data for alternative view
  const categoryDimensions = useMemo<DimensionData[]>(() => {
    const categories: HabitCategory[] = [
      'Health',
      'Fitness',
      'Study',
      'Work',
      'Personal',
      'Finance',
      'Mindfulness',
    ];

    const colors: Record<string, string> = {
      Health: '#30D158',
      Fitness: '#FF453A',
      Study: '#0A84FF',
      Work: '#64D2FF',
      Personal: '#FF9F0A',
      Finance: '#FFD60A',
      Mindfulness: '#BF5AF2',
    };

    return categories.map((cat) => {
      const catHabits = activeHabits.filter((h) => h.category === cat);
      let sched = 0;
      let done = 0;
      for (let i = 0; i < daysRange; i++) {
        const d = getDaysAgo(i);
        catHabits.forEach((h) => {
          if (isHabitScheduledForDate(h, d)) {
            sched++;
            const match = rangeLogs.find((l) => l.habitId === h.id && l.date === d);
            if (match && match.completed) done++;
          }
        });
      }
      const rate = sched > 0 ? Math.round((done / sched) * 100) : 75;
      const score = Math.min(100, Math.max(35, rate));

      const getStatus = (s: number): DimensionData['status'] => {
        if (s >= 85) return 'Optimal';
        if (s >= 70) return 'Strong';
        if (s >= 50) return 'Building';
        return 'Needs Focus';
      };

      return {
        dimension: cat,
        subject: cat,
        score,
        benchmark: 85,
        categoryKeys: [cat],
        icon: Sparkles,
        color: colors[cat] || '#30D158',
        badgeBg: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white',
        badgeText: 'text-slate-700 dark:text-white',
        description: `${catHabits.length} habits tracked in ${cat}`,
        habitsCount: catHabits.length,
        completionRate: rate,
        status: getStatus(score),
        tip: `Keep checking in your ${cat} habits to elevate consistency.`,
      };
    });
  }, [activeHabits, rangeLogs, daysRange]);

  const activeData = viewMode === 'spheres' ? sphereDimensions : categoryDimensions;

  // Average life score across dimensions
  const averageDimensionScore = useMemo(() => {
    if (activeData.length === 0) return 0;
    const sum = activeData.reduce((acc, d) => acc + d.score, 0);
    return Math.round(sum / activeData.length);
  }, [activeData]);

  // Balance index (standard deviation measure)
  const balanceAssessment = useMemo(() => {
    if (activeData.length === 0) return { label: 'Optimal', color: 'text-emerald-500' };
    const minScore = Math.min(...activeData.map((d) => d.score));
    const maxScore = Math.max(...activeData.map((d) => d.score));
    const diff = maxScore - minScore;

    if (diff <= 15) return { label: 'Harmonious & Well-Balanced', color: 'text-[#30D158]' };
    if (diff <= 28) return { label: 'Moderately Balanced', color: 'text-[#0A84FF]' };
    return { label: 'Opportunity for Harmony', color: 'text-[#FF9F0A]' };
  }, [activeData]);

  const activeFocus = useMemo(() => {
    if (!selectedDimension) return null;
    return activeData.find((d) => d.dimension === selectedDimension) || null;
  }, [selectedDimension, activeData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DimensionData;
      return (
        <div className="rounded-2xl bg-white/95 dark:bg-[#1C202F]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 p-3.5 shadow-xl text-xs space-y-1.5 min-w-[180px] pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: data.color }}
              />
              {data.subject}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-3xs font-bold"
              style={{
                backgroundColor: `${data.color}20`,
                color: data.color,
              }}
            >
              {data.status}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-white/10 font-mono">
            <span className="text-slate-500 dark:text-white/60">Current Life Score:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {data.score}
              <span className="text-3xs text-slate-400">/100</span>
            </span>
          </div>

          {showBenchmark && (
            <div className="flex items-baseline justify-between font-mono text-3xs text-slate-400 dark:text-white/50">
              <span>Target Benchmark:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {data.benchmark}/100
              </span>
            </div>
          )}

          <div className="text-3xs text-slate-500 dark:text-white/60 pt-1 line-clamp-2">
            {data.description}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-[24px] bg-white/75 dark:bg-[#141722]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] p-5 sm:p-6 transition-all relative overflow-hidden ${className}`}
    >
      {/* Decorative ambient corner blur */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#30D158]/15 via-[#0A84FF]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-tr from-[#BF5AF2]/15 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Header bar: Title, View Switcher & Benchmark Toggle */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#30D158]/15 text-[#30D158] dark:bg-[#30D158]/20">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Life Score Balance Radar
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-white/70 text-3xs font-semibold font-mono">
              Recharts Multi-Axis
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
            Visualizing harmony across Health, Career, Social, Mindfulness, Finance & Growth
          </p>
        </div>

        {/* View Mode & Benchmark Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Control */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08]">
            <button
              onClick={() => setViewMode('spheres')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                viewMode === 'spheres'
                  ? 'bg-white dark:bg-[#1E2333] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white'
              }`}
            >
              Life Spheres
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                viewMode === 'categories'
                  ? 'bg-white dark:bg-[#1E2333] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white'
              }`}
            >
              Categories
            </button>
          </div>

          {/* Benchmark Checkbox Pill */}
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-2xs font-semibold transition-all cursor-pointer border ${
              showBenchmark
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30'
                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/50 border-transparent hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Target Benchmark</span>
          </button>
        </div>
      </div>

      {/* Main Content: Recharts Radar on Left, Dimension Metrics on Right */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-5">
        {/* Radar Chart (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="w-full h-[320px] sm:h-[360px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="75%"
                data={activeData}
                margin={{ top: 10, right: 25, bottom: 10, left: 25 }}
              >
                {/* Polar Grid with smooth circular / polygon lines */}
                <PolarGrid
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/10"
                  gridType="polygon"
                />

                {/* Polar Angle Axis (Labels) */}
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: 'currentColor',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  className="text-slate-700 dark:text-white/80"
                />

                {/* Polar Radius Axis (0 to 100) */}
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  stroke="currentColor"
                  className="text-slate-300 dark:text-white/10"
                  tick={{
                    fill: 'currentColor',
                    fontSize: 10,
                  }}
                />

                {/* Target Benchmark Radar Layer (if active) */}
                {showBenchmark && (
                  <Radar
                    name="Target Benchmark"
                    dataKey="benchmark"
                    stroke="#BF5AF2"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    fill="#BF5AF2"
                    fillOpacity={0.08}
                  />
                )}

                {/* User's Life Score Radar Layer */}
                <Radar
                  name="Life Score"
                  dataKey="score"
                  stroke="#30D158"
                  strokeWidth={2.5}
                  fill="#30D158"
                  fillOpacity={0.35}
                  dot={{
                    r: 4,
                    fill: '#30D158',
                    strokeWidth: 2,
                    stroke: '#FFFFFF',
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#30D158',
                    strokeWidth: 2,
                    stroke: '#FFFFFF',
                  }}
                />

                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>

            {/* Central Score Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-800/15 dark:text-white/10">
                {averageDimensionScore}
              </span>
            </div>
          </div>

          {/* Chart Legend Summary */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-white/70 pt-2 flex-wrap justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#30D158] shadow-xs" />
              <span>Current Life Score</span>
            </div>
            {showBenchmark && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#BF5AF2] border-t-2 border-dashed border-[#BF5AF2]" />
                <span className="text-purple-600 dark:text-purple-300">Target Benchmark (85-90)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Score Breakdown & Interactive Dimension Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Top Quick Status Pill Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-white/50">
                Life Harmony Index
              </p>
              <p className={`text-xs sm:text-sm font-bold ${balanceAssessment.color}`}>
                {balanceAssessment.label}
              </p>
            </div>
            <div className="text-right font-mono">
              <p className="text-3xs text-slate-400 dark:text-white/50">Average</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {averageDimensionScore}
                <span className="text-3xs text-slate-400 font-normal">/100</span>
              </p>
            </div>
          </div>

          {/* Interactive Dimension List (Click to inspect) */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {activeData.map((d) => {
              const IconComp = d.icon;
              const isSelected = selectedDimension === d.dimension;
              return (
                <button
                  key={d.dimension}
                  onClick={() =>
                    setSelectedDimension(isSelected ? null : d.dimension)
                  }
                  className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white dark:bg-[#1E2333] border-slate-300 dark:border-white/20 shadow-md scale-[1.01]'
                      : 'bg-white/60 dark:bg-white/[0.03] border-slate-200/60 dark:border-white/[0.05] hover:bg-white dark:hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="p-1.5 rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: `${d.color}20`,
                        color: d.color,
                      }}
                    >
                      <IconComp className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {d.subject}
                        </span>
                        <span
                          className="px-1.5 py-0.2 rounded text-3xs font-semibold"
                          style={{
                            backgroundColor: `${d.color}15`,
                            color: d.color,
                          }}
                        >
                          {d.status}
                        </span>
                      </div>
                      <p className="text-3xs text-slate-400 dark:text-white/50 truncate">
                        {d.habitsCount} habits • {d.completionRate}% check-in rate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right font-mono">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        {d.score}
                      </span>
                      <span className="text-3xs text-slate-400 dark:text-white/40">/100</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Drilldown Insight Box for Selected Dimension */}
          {activeFocus && (
            <div className="p-3 rounded-xl bg-linear-to-r from-slate-100 to-white dark:from-[#1E2333] dark:to-[#171B2A] border border-slate-200 dark:border-white/10 text-xs space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Zap className="w-3.5 h-3.5 text-[#FFD60A]" />
                <span>Coach Tip for {activeFocus.subject}:</span>
              </div>
              <p className="text-2xs text-slate-600 dark:text-white/70 leading-relaxed">
                {activeFocus.tip}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
