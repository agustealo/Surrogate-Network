// Tests for StatusBadge component

import { render, screen } from '@testing-library/react'
import { StatusBadge, StatusDot, getStatusColor, getStatusBgColor } from '@/components/shared/StatusBadge'

describe('StatusBadge', () => {
  it('should render status badge with correct label', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should handle different status cases', () => {
    render(<StatusBadge status="IN_PROGRESS" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('should handle snake_case statuses', () => {
    render(<StatusBadge status="email_verified" />)
    expect(screen.getByText('Email Verified')).toBeInTheDocument()
  })

  it('should apply size classes', () => {
    const { container } = render(<StatusBadge status="pending" size="sm" />)
    const badge = container.querySelector('.text-xs')
    expect(badge).toBeInTheDocument()
  })

  it('should hide label when showLabel is false', () => {
    render(<StatusBadge status="completed" showLabel={false} />)
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })

  it('should handle unknown statuses', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('Unknown Status')).toBeInTheDocument()
  })
})

describe('StatusDot', () => {
  it('should render status dot', () => {
    const { container } = render(<StatusDot status="active" />)
    const dot = container.querySelector('.h-2.w-2.rounded-full')
    expect(dot).toBeInTheDocument()
  })

  it('should show label when showLabel is true', () => {
    render(<StatusDot status="pending" showLabel={true} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('should not show label when showLabel is false', () => {
    render(<StatusDot status="completed" showLabel={false} />)
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })
})

describe('getStatusColor', () => {
  it('should return correct color for success status', () => {
    expect(getStatusColor('active')).toBe('text-green-600')
    expect(getStatusColor('completed')).toBe('text-green-600')
  })

  it('should return correct color for error status', () => {
    expect(getStatusColor('failed')).toBe('text-red-600')
    expect(getStatusColor('declined')).toBe('text-red-600')
  })

  it('should return correct color for warning status', () => {
    expect(getStatusColor('pending')).toBe('text-yellow-600')
    expect(getStatusColor('paused')).toBe('text-yellow-600')
  })

  it('should return correct color for info status', () => {
    expect(getStatusColor('in_progress')).toBe('text-blue-600')
  })

  it('should handle unknown statuses', () => {
    expect(getStatusColor('unknown')).toBe('text-gray-600')
  })
})

describe('getStatusBgColor', () => {
  it('should return correct background color for success status', () => {
    expect(getStatusBgColor('active')).toBe('bg-green-100')
    expect(getStatusBgColor('completed')).toBe('bg-green-100')
  })

  it('should return correct background color for error status', () => {
    expect(getStatusBgColor('failed')).toBe('bg-red-100')
    expect(getStatusBgColor('declined')).toBe('bg-red-100')
  })

  it('should return correct background color for warning status', () => {
    expect(getStatusBgColor('pending')).toBe('bg-yellow-100')
  })

  it('should handle unknown statuses', () => {
    expect(getStatusBgColor('unknown')).toBe('bg-gray-100')
  })
})