export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 5
  percentage: number; // 0 to 100
  label: 'Too Short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  colorClass: string;
  barColorClass: string;
  isSecure: boolean;
  criteria: PasswordCriteria;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      percentage: 0,
      label: 'Too Short',
      colorClass: 'text-slate-400',
      barColorClass: 'bg-slate-200 dark:bg-slate-700',
      isSecure: false,
      criteria,
    };
  }

  let passedCount = 0;
  if (criteria.minLength) passedCount++;
  if (criteria.hasUpper) passedCount++;
  if (criteria.hasLower) passedCount++;
  if (criteria.hasNumber) passedCount++;
  if (criteria.hasSpecial) passedCount++;

  if (passedCount <= 1) {
    return {
      score: 1,
      percentage: 20,
      label: 'Too Short',
      colorClass: 'text-rose-500 dark:text-rose-400',
      barColorClass: 'bg-rose-500',
      isSecure: false,
      criteria,
    };
  }

  if (passedCount === 2) {
    return {
      score: 2,
      percentage: 40,
      label: 'Weak',
      colorClass: 'text-orange-500 dark:text-orange-400',
      barColorClass: 'bg-orange-500',
      isSecure: false,
      criteria,
    };
  }

  if (passedCount === 3) {
    return {
      score: 3,
      percentage: 60,
      label: 'Fair',
      colorClass: 'text-amber-500 dark:text-amber-400',
      barColorClass: 'bg-amber-500',
      isSecure: false,
      criteria,
    };
  }

  if (passedCount === 4) {
    return {
      score: 4,
      percentage: 80,
      label: 'Good',
      colorClass: 'text-blue-500 dark:text-blue-400',
      barColorClass: 'bg-blue-500',
      isSecure: criteria.minLength,
      criteria,
    };
  }

  return {
    score: 5,
    percentage: 100,
    label: 'Strong',
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    barColorClass: 'bg-emerald-500',
    isSecure: true,
    criteria,
  };
}
