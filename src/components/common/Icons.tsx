import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  // @ts-ignore
  const IconComponent = LucideIcons[name] || LucideIcons.Sparkles;
  return <IconComponent className={className} size={size} />;
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Health: {
    bg: 'bg-[#30D158]/12 dark:bg-[#30D158]/18',
    text: 'text-[#28B54C] dark:text-[#30D158]',
    border: 'border-[#30D158]/25',
    accent: '#30D158',
  },
  Fitness: {
    bg: 'bg-[#FF453A]/12 dark:bg-[#FF453A]/18',
    text: 'text-[#E0382E] dark:text-[#FF453A]',
    border: 'border-[#FF453A]/25',
    accent: '#FF453A',
  },
  Study: {
    bg: 'bg-[#0A84FF]/12 dark:bg-[#0A84FF]/18',
    text: 'text-[#0071E3] dark:text-[#0A84FF]',
    border: 'border-[#0A84FF]/25',
    accent: '#0A84FF',
  },
  Work: {
    bg: 'bg-[#5E5CE6]/12 dark:bg-[#5E5CE6]/18',
    text: 'text-[#5E5CE6] dark:text-[#7D7AFF]',
    border: 'border-[#5E5CE6]/25',
    accent: '#5E5CE6',
  },
  Personal: {
    bg: 'bg-[#64D2FF]/12 dark:bg-[#64D2FF]/18',
    text: 'text-[#0077A6] dark:text-[#64D2FF]',
    border: 'border-[#64D2FF]/25',
    accent: '#64D2FF',
  },
  Finance: {
    bg: 'bg-[#FFD60A]/12 dark:bg-[#FFD60A]/18',
    text: 'text-[#B29200] dark:text-[#FFD60A]',
    border: 'border-[#FFD60A]/25',
    accent: '#FFD60A',
  },
  Mindfulness: {
    bg: 'bg-[#BF5AF2]/12 dark:bg-[#BF5AF2]/18',
    text: 'text-[#9A3EC8] dark:text-[#BF5AF2]',
    border: 'border-[#BF5AF2]/25',
    accent: '#BF5AF2',
  },
  Sleep: {
    bg: 'bg-[#5E5CE6]/12 dark:bg-[#5E5CE6]/18',
    text: 'text-[#4845D2] dark:text-[#7D7AFF]',
    border: 'border-[#5E5CE6]/25',
    accent: '#5E5CE6',
  },
  Productivity: {
    bg: 'bg-[#FF9F0A]/12 dark:bg-[#FF9F0A]/18',
    text: 'text-[#D48200] dark:text-[#FF9F0A]',
    border: 'border-[#FF9F0A]/25',
    accent: '#FF9F0A',
  },
  Other: {
    bg: 'bg-white/[0.08] dark:bg-white/[0.08]',
    text: 'text-slate-600 dark:text-white/70',
    border: 'border-white/[0.12]',
    accent: '#8E8E93',
  },
};
