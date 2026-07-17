/**
 * Static Tailwind class maps per category — Tailwind's JIT can only extract
 * class names that appear as complete strings in source, so we can't build
 * them by interpolation.
 */
import type { CATEGORIES } from '@/content/config';

type Category = (typeof CATEGORIES)[number];

export const CATEGORY_BADGE: Record<Category, string> = {
  ci:        'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  iac:       'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  container: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  k8s:       'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  security:  'bg-red-500/10 text-red-700 dark:text-red-300',
  obs:       'bg-green-500/10 text-green-700 dark:text-green-300',
  release:   'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  ir:        'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  finops:    'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
};

export const CATEGORY_ACCENT_BORDER: Record<Category, string> = {
  ci:        'border-teal-500',
  iac:       'border-indigo-500',
  container: 'border-amber-500',
  k8s:       'border-blue-500',
  security:  'border-red-500',
  obs:       'border-green-500',
  release:   'border-violet-500',
  ir:        'border-rose-500',
  finops:    'border-yellow-500',
};
