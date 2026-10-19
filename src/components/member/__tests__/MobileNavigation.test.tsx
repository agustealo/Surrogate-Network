import { fireEvent, render, screen } from '@testing-library/react';
import { MobileNavigation } from '@/components/member/MobileNavigation';
import { getMemberActionHref } from '@/navigation';

jest.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));

describe('MobileNavigation', () => {
  it('opens the create menu and points to canonical create routes', () => {
    render(<MobileNavigation />);

    const trigger = screen.getByRole('button', { name: 'Create' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    expect(screen.getByRole('link', { name: 'Need' })).toHaveAttribute('href', '/needs/create');
    expect(screen.getByRole('link', { name: 'Offer' })).toHaveAttribute('href', '/offers/create');
  });

  it('closes the create menu on Escape and restores focus', () => {
    render(<MobileNavigation />);
    const trigger = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('link', { name: 'Need' })).not.toBeInTheDocument();
  });

  it('closes the menu when clicking outside', () => {
    render(<MobileNavigation />);
    const trigger = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the current mobile destination', () => {
    render(<MobileNavigation />);
    expect(screen.getByRole('navigation', { name: 'Member mobile navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps member create actions free of placeholder hrefs', () => {
    expect(getMemberActionHref('create-need')).toBe('/needs/create');
    expect(getMemberActionHref('create-offer')).toBe('/offers/create');
    expect(getMemberActionHref('create')).toBeNull();
  });
});
