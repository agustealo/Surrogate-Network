// Tests for formatting utilities

import {
  formatDate,
  formatRelativeTime,
  formatScheduleTime,
  formatRating,
  formatRatingStars,
  formatTokenAmount,
  formatXP,
  formatRank,
  formatCompatibility,
  truncateText,
} from '@/lib/formatters'

describe('formatDate', () => {
  it('should format a date string', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('2024')
  })

  it('should format a Date object', () => {
    const result = formatDate(new Date('2024-01-15'))
    expect(result).toContain('2024')
  })

  it('should use custom format string', () => {
    const result = formatDate('2024-01-15', 'yyyy-MM-dd')
    expect(result).toBe('2024-01-15')
  })
})

describe('formatRelativeTime', () => {
  it('should format recent dates as relative time', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const result = formatRelativeTime(oneHourAgo)
    expect(result).toContain('ago')
  })

  it('should handle date strings', () => {
    const result = formatRelativeTime(new Date().toISOString())
    expect(result).toContain('ago')
  })
})

describe('formatRating', () => {
  it('should format a rating number with stars', () => {
    const result = formatRating(4.5, 10)
    expect(result).toContain('★')
    expect(result).toContain('(10)')
  })

  it('should handle no rating', () => {
    const result = formatRating(undefined)
    expect(result).toBe('Not rated yet')
  })

  it('should format perfect rating', () => {
    const result = formatRating(5.0)
    expect(result).toContain('★★★★★')
  })

  it('should format zero rating', () => {
    const result = formatRating(0)
    expect(result).toContain('☆☆☆☆☆')
  })
})

describe('formatRatingStars', () => {
  it('should return correct star array', () => {
    const result = formatRatingStars(4.5)
    expect(result).toEqual([1, 1, 1, 1, 0.5])
  })

  it('should handle half stars', () => {
    const result = formatRatingStars(3.5)
    expect(result).toEqual([1, 1, 1, 0.5, 0])
  })

  it('should return empty array for no rating', () => {
    const result = formatRatingStars(undefined)
    expect(result).toEqual([])
  })
})

describe('formatTokenAmount', () => {
  it('should format token amount with commas', () => {
    expect(formatTokenAmount(1000)).toBe('1,000')
    expect(formatTokenAmount(1000000)).toBe('1,000,000')
  })

  it('should format small amounts', () => {
    expect(formatTokenAmount(5)).toBe('5')
    expect(formatTokenAmount(0)).toBe('0')
  })

  it('should handle negative amounts', () => {
    expect(formatTokenAmount(-5)).toBe('-5')
  })
})

describe('formatXP', () => {
  it('should format small XP amounts', () => {
    expect(formatXP(500)).toBe('500 XP')
  })

  it('should format large XP amounts with k notation', () => {
    expect(formatXP(1500)).toBe('1.5k XP')
    expect(formatXP(1000)).toBe('1.0k XP')
    expect(formatXP(999999)).toBe('1000.0k XP')
  })
})

describe('formatRank', () => {
  it('should format rank with title', () => {
    expect(formatRank(5, 'Messenger')).toBe('Rank 5 - Messenger')
  })

  it('should format rank without title', () => {
    expect(formatRank(3)).toBe('Rank 3')
  })
})

describe('formatCompatibility', () => {
  it('should format compatibility as percentage', () => {
    expect(formatCompatibility(87.5)).toBe('88%')
    expect(formatCompatibility(94)).toBe('94%')
  })

  it('should round down', () => {
    expect(formatCompatibility(87.4)).toBe('87%')
  })
})

describe('truncateText', () => {
  it('should truncate long text', () => {
    expect(truncateText('Hello world', 5)).toBe('Hel...')
  })

  it('should not truncate short text', () => {
    expect(truncateText('Hi', 10)).toBe('Hi')
  })

  it('should use custom suffix', () => {
    expect(truncateText('Hello world', 5, '>>')).toBe('Hel>>')
  })

  it('should handle exact length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello')
  })
})