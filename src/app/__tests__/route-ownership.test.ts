import fs from 'node:fs';
import path from 'node:path';

function appPath(...segments: string[]) {
  return path.join(process.cwd(), 'src', 'app', ...segments);
}

describe('member route ownership', () => {
  it('keeps canonical member pages inside the member route group', () => {
    expect(fs.existsSync(appPath('(member)', 'layout.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'home', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'discover', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'messages', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'needs', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'offers', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'profile', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'rewards', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'settings', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(appPath('(member)', 'surrogacies', 'page.tsx'))).toBe(true);
  });

  it('does not define top-level canonical member pages outside the member route group', () => {
    expect(fs.existsSync(appPath('needs', 'page.tsx'))).toBe(false);
    expect(fs.existsSync(appPath('offers', 'page.tsx'))).toBe(false);
    expect(fs.existsSync(appPath('profile', 'page.tsx'))).toBe(false);
    expect(fs.existsSync(appPath('settings', 'page.tsx'))).toBe(false);
    expect(fs.existsSync(appPath('surrogacies', 'page.tsx'))).toBe(false);
  });
});
