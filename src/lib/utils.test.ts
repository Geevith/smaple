// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils'; // Ensure the path is correct

describe('cn utility', () => {
  it('should merge basic class names', () => {
    expect(cn('bg-red-500', 'text-white', 'p-4')).toBe('bg-red-500 text-white p-4');
  });

  it('should handle conditional classes correctly', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled', 'extra')).toBe('base active extra');
    expect(cn('base', !isActive && 'inactive', !isDisabled && 'enabled', 'extra')).toBe('base enabled extra');
  });

  it('should override conflicting Tailwind classes via tailwind-merge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2'); // Last padding wins
    expect(cn('bg-red-500', 'text-lg', 'bg-blue-500')).toBe('text-lg bg-blue-500'); // Last background wins
    expect(cn('m-4', 'mx-2')).toBe('m-4 mx-2'); // Combines margin utilities
    expect(cn('mx-2', 'm-4')).toBe('m-4'); // m-4 overrides mx-2
  });

  it('should filter out falsy values', () => {
    expect(cn('base', null, undefined, false, 0, '', 'another')).toBe('base another');
  });

  it('should handle complex combinations', () => {
     const error = true;
     expect(cn(
         'px-4 py-2 rounded',
         error ? 'bg-red-100 text-red-800 border border-red-400' : 'bg-green-100 text-green-800',
         'hover:opacity-80'
     )).toBe('px-4 py-2 rounded bg-red-100 text-red-800 border border-red-400 hover:opacity-80');
  });
});
