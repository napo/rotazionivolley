import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { APP_VERSION } from '../version';
import { isInstalledPwa, isIosDevice, isWebPlatform } from '../platform';
import { usePwaUpdate } from './pwaUpdates';
import { ExternalLink } from '../ExternalLink';
import { PAYPAL_DONATION_URL } from '../links';
import {
  checkForUpdate,
  compareVersions,
  installUpdate,
  isNativeBuild,
  swapLastVersion,
  updateChecksEnabled,
  type UpdateInfo,
} from './updates';
import './update.css';

const INSTALL_HINT_DISMISSED = 'rv-install-hint-dismissed';

function installHintDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_HINT_DISMISSED) === '1';
  } catch {
    return false;
  }
}

function dismissInstallHint(): void {
  try {
    localStorage.setItem(INSTALL_HINT_DISMISSED, '1');
  } catch {
    // not persisted: shown again at the next start
  }
}

/**
 * Banner shown only in the installed apps (desktop/Android/iOS — see
 * isNativeBuild): tells the user a newer release exists — on desktop, with a
 * button that downloads, verifies and installs it in place (Tauri's
 * updater); on Android/iOS, with a link to get it by hand, since neither
 * Capacitor nor Tauri auto-updates mobile. Right after an update, it also
 * thanks the user once. The web build is always the latest already, so it
 * never shows the native check — but its service worker (see
 * update/pwaUpdates.ts) does find new versions, and then this offers to
 * reload into them. On iPhone/iPad in Safari it also explains, once, how to
 * install the app from the home screen.
 *
 * Donations: every update banner (available, or just installed) carries the
 * donation link — the only times the app brings it up on its own; otherwise
 * it's just in the Info page (SupportSection), never pushed.
 */
export function UpdateNotice() {
  const { t } = useI18n();
  const native = isNativeBuild();
  const installedPwa = isWebPlatform() && isInstalledPwa();
  const applyPwaUpdate = usePwaUpdate();
  const [pwaUpdating, setPwaUpdating] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(
    () => isWebPlatform() && isIosDevice() && !isInstalledPwa() && !installHintDismissed(),
  );
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState<number | null>(null);
  const [justUpdated, setJustUpdated] = useState(() => {
    if (!native && !installedPwa) return false;
    const previous = swapLastVersion(APP_VERSION);
    return previous !== null && compareVersions(APP_VERSION, previous) > 0;
  });

  useEffect(() => {
    if (!native || !updateChecksEnabled()) return;
    let active = true;
    // Offline or GitHub unreachable: silently nothing, same as no update found.
    checkForUpdate(APP_VERSION)
      .then((found) => active && setUpdate(found))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [native]);

  const donateLink = (
    <ExternalLink className="update-notice__btn update-notice__btn--secondary" href={PAYPAL_DONATION_URL}>
      {t('update.donate')}
    </ExternalLink>
  );

  if (justUpdated) {
    return (
      <div className="update-notice" role="status" aria-live="polite">
        <p>
          <strong>{t('update.updated', { version: APP_VERSION })}</strong> {t('update.support')}
        </p>
        <div className="update-notice__actions">
          {donateLink}
          <button type="button" className="update-notice__btn update-notice__btn--secondary" onClick={() => setJustUpdated(false)}>
            {t('update.close')}
          </button>
        </div>
      </div>
    );
  }

  if (applyPwaUpdate && !dismissed) {
    return (
      <div className="update-notice" role="status" aria-live="polite">
        <p>{t('update.pwaAvailable')}</p>
        <div className="update-notice__actions">
          <button
            type="button"
            className="update-notice__btn"
            disabled={pwaUpdating}
            onClick={() => {
              setPwaUpdating(true);
              // Activates the new version and reloads the page into it.
              void applyPwaUpdate().catch(() => setPwaUpdating(false));
            }}
          >
            {t('update.updateNow')}
          </button>
          {donateLink}
          <button type="button" className="update-notice__btn update-notice__btn--secondary" onClick={() => setDismissed(true)}>
            {t('update.later')}
          </button>
        </div>
      </div>
    );
  }

  if (showInstallHint) {
    return (
      <div className="update-notice" role="status">
        <p>{t('update.iosInstallHint')}</p>
        <div className="update-notice__actions">
          <button
            type="button"
            className="update-notice__btn update-notice__btn--secondary"
            onClick={() => {
              dismissInstallHint();
              setShowInstallHint(false);
            }}
          >
            {t('update.close')}
          </button>
        </div>
      </div>
    );
  }

  if (!update || dismissed) return null;

  const install = async () => {
    if (update.kind === 'mobile') return; // handled by the <a href> below instead
    setInstallState('installing');
    try {
      await installUpdate(update, setProgress);
      // installUpdate relaunches the app on success — nothing left to render.
    } catch {
      setInstallState('error');
    }
  };

  const installing = installState === 'installing';
  const progressLabel =
    installing && (progress === null ? t('update.downloading') : progress < 1 ? t('update.progress', { percent: Math.round(progress * 100) }) : t('update.installing'));

  return (
    <div className="update-notice" role="status" aria-live="polite">
      <p>
        {t('update.available', { version: update.version, current: APP_VERSION })}
        {progressLabel && ` ${progressLabel}`}
        {installState === 'error' && ` ${t('update.failed')}`}
      </p>
      <div className="update-notice__actions">
        {update.kind === 'desktop' ? (
          <button type="button" className="update-notice__btn" disabled={installing} onClick={install}>
            {t('update.updateNow')}
          </button>
        ) : (
          <ExternalLink className="update-notice__btn" href={update.url}>
            {t('update.download')}
          </ExternalLink>
        )}
        {donateLink}
        <button
          type="button"
          className="update-notice__btn update-notice__btn--secondary"
          disabled={installing}
          onClick={() => setDismissed(true)}
        >
          {t('update.later')}
        </button>
      </div>
    </div>
  );
}
