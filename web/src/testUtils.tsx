import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nProvider } from './i18n/I18nContext';

/** Wraps `render` with the providers components under test expect (currently just i18n). */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(<I18nProvider>{ui}</I18nProvider>, options);
}
