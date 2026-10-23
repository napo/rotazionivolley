import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PAYPAL_DONATION_URL, SOURCE_REPOSITORY_URL } from '../links';
import { APP_VERSION } from '../version';
import { renderWithProviders } from '../testUtils';
import { InfoPanel } from './InfoPanel';

describe('InfoPanel — Sostieni lo sviluppo', () => {
  it('offers the voluntary PayPal donation as a single plain link', () => {
    const { container } = renderWithProviders(<InfoPanel onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Sostieni lo sviluppo' })).toBeInTheDocument();
    const button = screen.getByRole('link', { name: /Sostieni Rotazioni Volley con PayPal/ });
    expect(button).toHaveAttribute('href', PAYPAL_DONATION_URL);
    expect(button).toHaveAttribute('target', '_blank');
    expect(screen.getByText(/completamente facoltativa/)).toBeInTheDocument();

    const paypalLinks = [...container.querySelectorAll('a')].filter((a) => /paypal/i.test(a.href));
    expect(paypalLinks).toHaveLength(1);
    // No PayPal script, widget or remote image: PayPal is contacted only when the link is opened.
    expect(container.querySelector('script, iframe, img[src*="paypal.com"], img[src*="paypalobjects"]')).toBeNull();
  });
});

describe('InfoPanel — downloads', () => {
  it('links each platform installer of the current version on its GitHub Release', () => {
    renderWithProviders(<InfoPanel onClose={() => {}} />);
    const base = `${SOURCE_REPOSITORY_URL}/releases/download/v${APP_VERSION}/`;
    for (const name of ['Windows (.exe)', 'macOS Apple Silicon (.dmg)', 'Linux (.AppImage)', 'Android (.apk)']) {
      expect(screen.getByRole('link', { name }).getAttribute('href')).toMatch(new RegExp(`^${base.replace(/[.?]/g, '\\$&')}Rotazioni\\.Volley[_-]${APP_VERSION.replace(/\./g, '\\.')}`));
    }
    expect(screen.getByRole('link', { name: 'GitHub Releases' })).toHaveAttribute('href', `${SOURCE_REPOSITORY_URL}/releases`);
  });
});
