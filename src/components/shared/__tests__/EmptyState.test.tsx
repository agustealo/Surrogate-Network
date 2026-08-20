// Tests for EmptyState component

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Home, UserPlus } from 'lucide-react'

describe('EmptyState', () => {
  it('should render empty state with icon and title', () => {
    render(
      <EmptyState
        icon={Home}
        title="No items found"
        description="There are no items to display at this time"
      />
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('There are no items to display at this time')).toBeInTheDocument()
  })

  it('should render primary action button', () => {
    render(
      <EmptyState
        icon={Home}
        title="Test Title"
        description="Test description"
        primaryAction={{
          label: 'Create Item',
          href: '/create',
        }}
      />
    )

    const button = screen.getByRole('link', { name: 'Create Item' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/create')
  })

  it('should render secondary action button', () => {
    render(
      <EmptyState
        icon={Home}
        title="Test Title"
        description="Test description"
        secondaryAction={{
          label: 'Learn More',
          href: '/learn',
        }}
      />
    )

    const button = screen.getByRole('link', { name: 'Learn More' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/learn')
  })

  it('should render both actions', () => {
    render(
      <EmptyState
        icon={Home}
        title="Test Title"
        description="Test description"
        primaryAction={{
          label: 'Create',
          href: '/create',
        }}
        secondaryAction={{
          label: 'Learn More',
          href: '/learn',
        }}
      />
    )

    expect(screen.getByRole('link', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Learn More' })).toBeInTheDocument()
  })

  it('should call onClick handler for button actions', () => {
    const handleClick = jest.fn()
    render(
      <EmptyState
        icon={Home}
        title="Test Title"
        description="Test description"
        primaryAction={{
          label: 'Click Me',
          onClick: handleClick,
        }}
      />
    )

    const button = screen.getByRole('button', { name: 'Click Me' })
    button.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState
        icon={Home}
        title="Test Title"
        description="Test description"
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should render without icon when not provided', () => {
    render(
      <EmptyState
        title="Test Title"
        description="Test description"
      />
    )

    // Title should still be visible
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should handle large description text', () => {
    const longDescription = 'This is a very long description that spans multiple lines and contains detailed information about why the state is empty and what the user should do next.'
    render(
      <EmptyState
        icon={UserPlus}
        title="No Members"
        description={longDescription}
      />
    )

    expect(screen.getByText('No Members')).toBeInTheDocument()
    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })
})