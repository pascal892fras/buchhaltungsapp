/**
 * Settings Tabs Management
 * Verwaltet die Tab-Navigation in den Einstellungen
 */

/**
 * Initialisiert die Settings-Tab-Navigation
 * Bindet Event-Listener an alle Tab-Buttons
 */
export function initializeSettingsTabs() {
  const tabs = document.querySelectorAll('.settings-tab');
  const contents = document.querySelectorAll('.settings-tab-content');

  if (tabs.length === 0 || contents.length === 0) {
    console.warn('Settings tabs not found in DOM');
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      if (!tabName) {
        console.error('Tab missing data-tab attribute');
        return;
      }

      // Deaktiviere alle Tabs und verstecke alle Contents
      tabs.forEach((t) => t.classList.remove('active'));
      contents.forEach((c) => c.classList.remove('active'));

      // Aktiviere gewählten Tab
      tab.classList.add('active');
      const contentElement = document.getElementById(`tab-${tabName}`);
      if (contentElement) {
        contentElement.classList.add('active');
      }

      // Speichere Preference im localStorage
      localStorage.setItem('lastSettingsTab', tabName);
    });
  });

  // Stelle letzten Tab wieder her
  const lastTab = localStorage.getItem('lastSettingsTab') || 'branding';
  const lastTabButton = document.querySelector(`[data-tab="${lastTab}"]`);
  if (lastTabButton) {
    lastTabButton.click();
  } else {
    // Fallback auf ersten Tab
    tabs[0]?.click();
  }
}

/**
 * Wechselt zu einem spezifischen Tab (programmatisch)
 * @param {string} tabName - Name des Tabs (branding, kontakt, rechnungen)
 */
export function switchSettingsTab(tabName) {
  const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (tabButton) {
    tabButton.click();
  } else {
    console.error(`Settings tab "${tabName}" not found`);
  }
}

/**
 * Gibt den aktuell aktiven Tab zurück
 * @returns {string|null} Name des aktiven Tabs oder null
 */
export function getActiveSettingsTab() {
  const activeTab = document.querySelector('.settings-tab.active');
  return activeTab?.getAttribute('data-tab') || null;
}
