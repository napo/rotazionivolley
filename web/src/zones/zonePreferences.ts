const CONFIRM_REMOVE_SETTING = 'rv-zones-confirm-vertex-removal';

/** Whether removing a vertex of a competence map asks first (on unless turned off in the dialog; back on from Info). */
export function vertexRemovalConfirmEnabled(): boolean {
  try {
    return localStorage.getItem(CONFIRM_REMOVE_SETTING) !== 'off';
  } catch {
    return true;
  }
}

export function setVertexRemovalConfirmEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(CONFIRM_REMOVE_SETTING, enabled ? 'on' : 'off');
  } catch {
    // not persisted: default (ask) at the next start
  }
}
