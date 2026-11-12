import { fireEvent, render, screen } from '@testing-library/react';
import { MobileNavigation } from '@/components/member/MobileNavigation';
import { getMemberActionHref } from '@/navigation';

// Inspect real icon SVGs: the shared Jest setup stubs Lucide icons to null.
jest.mock('lucide-react', () => jest.requireActual('lucide-react'));

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

  it('uses distinct, truthful icons for Proposals and Connections', () => {
    render(<MobileNavigation />);

    const proposals = screen.getByRole('link', { name: 'Proposals' });
    const connections = screen.getByRole('link', { name: 'Connections' });

    expect(proposals).toHaveAttribute('href', '/proposals');
    expect(connections).toHaveAttribute('href', '/surrogacies');
    expect(proposals.querySelector('svg.lucide-clipboard-list')).toBeInTheDocument();
    expect(connections.querySelector('svg.lucide-handshake')).toBeInTheDocument();
    expect(proposals.querySelector('svg.lucide-house')).not.toBeInTheDocument();
    expect(connections.querySelector('svg.lucide-message-square')).not.toBeInTheDocument();
  });

  it('keeps member create actions free of placeholder hrefs', () => {
    expect(getMemberActionHref('create-need')).toBe('/needs/create');
    expect(getMemberActionHref('create-offer')).toBe('/offers/create');
    expect(getMemberActionHref('create')).toBeNull();
  });
});
