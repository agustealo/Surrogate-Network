import { fireEvent, render, screen } from '@testing-library/react';
import { MobileNavigation } from '@/components/member/MobileNavigation';
import { getMemberActionHref } from '@/navigation';

jest.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));

describe('MobileNavigation', () => {
  it('opens the create menu and points to canonical create routes', () => {
    render(<MobileNavigation />);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(screen.getByRole('link', { name: /need/i })).toHaveAttribute('href', '/needs/create');
    expect(screen.getByRole('link', { name: /offer/i })).toHaveAttribute('href', '/offers/create');
  });

  it('keeps member create actions free of placeholder hrefs', () => {
    expect(getMemberActionHref('create-need')).toBe('/needs/create');
    expect(getMemberActionHref('create-offer')).toBe('/offers/create');
    expect(getMemberActionHref('create')).toBeNull();
  });
});
