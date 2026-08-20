import { render, screen } from '@testing-library/react';
import RootLayout from '@/app/layout';
import PublicLayout from '@/app/(public)/layout';
import MemberLayout from '@/app/(member)/layout';
import AdminLayout from '@/app/admin/layout';

jest.mock('@/components/public/PublicNavigation', () => ({
  PublicNavigation: () => <div>PublicNavigation</div>,
}));

jest.mock('@/components/public/PublicFooter', () => ({
  PublicFooter: () => <div>PublicFooter</div>,
}));

jest.mock('@/components/member/MemberHeader', () => ({
  MemberHeader: () => <div>MemberHeader</div>,
}));

jest.mock('@/components/member/MemberNavigation', () => ({
  MemberNavigation: () => <div>MemberNavigation</div>,
}));

jest.mock('@/components/member/MobileNavigation', () => ({
  MobileNavigation: () => <div>MobileNavigation</div>,
}));

jest.mock('@/components/admin/AdminHeader', () => ({
  AdminHeader: () => <div>AdminHeader</div>,
}));

jest.mock('@/components/admin/AdminNavigation', () => ({
  AdminNavigation: () => <div>AdminNavigation</div>,
}));

jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div>Toaster</div>,
}));

describe('layout ownership', () => {
  it('keeps the root layout global-only', () => {
    const rootLayout = RootLayout({ children: <div>Root Child</div> });
    const body = rootLayout.props.children;

    expect(rootLayout.type).toBe('html');
    expect(body.type).toBe('body');
    expect(body.props.children).toEqual(<div>Root Child</div>);
  });

  it('renders public navigation and footer on the public shell', () => {
    render(PublicLayout({ children: <div>Public Child</div> }));

    expect(screen.getByText('PublicNavigation')).toBeInTheDocument();
    expect(screen.getByText('PublicFooter')).toBeInTheDocument();
    expect(screen.getByText('Public Child')).toBeInTheDocument();
  });

  it('renders the member shell without public navigation', async () => {
    render(await MemberLayout({ children: <div>Member Child</div> }));

    expect(screen.getByText('MemberHeader')).toBeInTheDocument();
    expect(screen.getByText('MemberNavigation')).toBeInTheDocument();
    expect(screen.getByText('MobileNavigation')).toBeInTheDocument();
    expect(screen.getByText('Member Child')).toBeInTheDocument();
    expect(screen.queryByText('PublicNavigation')).not.toBeInTheDocument();
  });

  it('renders the admin shell without public navigation', () => {
    render(AdminLayout({ children: <div>Admin Child</div> }));

    expect(screen.getByText('AdminHeader')).toBeInTheDocument();
    expect(screen.getByText('AdminNavigation')).toBeInTheDocument();
    expect(screen.getByText('Admin Child')).toBeInTheDocument();
    expect(screen.queryByText('PublicNavigation')).not.toBeInTheDocument();
  });
});
