/**
 * Core pronoun data, persona state management, and settings for the Pronouns extension.
 */

import { saveSettingsDebounced, user_avatar, eventSource, event_types } from '../../../../../../script.js';
import { power_user } from '../../../../../../scripts/power-user.js';
import { extension_settings } from '../../../../../extensions.js';
import { EXTENSION_KEY } from '../index.js';

const LEGACY_SETTINGS_KEY = 'sillytavern-pronouns';
const PRONOUN_FIELDS = Object.freeze(['subjective', 'objective', 'posDet', 'posPro', 'reflexive']);

/**
 * @typedef {Object} Pronouns
 * @property {string} subjective - Subjective pronoun (she/he/they)
 * @property {string} objective - Objective pronoun (her/him/them)
 * @property {string} posDet - Possessive determiner (her/his/their)
 * @property {string} posPro - Possessive pronoun (hers/his/theirs)
 * @property {string} reflexive - Reflexive pronoun (herself/himself/themselves)
 */

/** @type {Pronouns} */
export const defaultPronoun = Object.freeze({
    subjective: '',
    objective: '',
    posDet: '',
    posPro: '',
    reflexive: '',
});

/** @type {{[presetName: string]: Pronouns}} */
export const pronounPresets = {
    she: { subjective: 'she', objective: 'her', posDet: 'her', posPro: 'hers', reflexive: 'herself' },
    he: { subjective: 'he', objective: 'him', posDet: 'his', posPro: 'his', reflexive: 'himself' },
    they: { subjective: 'they', objective: 'them', posDet: 'their', posPro: 'theirs', reflexive: 'themselves' },
    it: { subjective: 'it', objective: 'it', posDet: 'its', posPro: 'its', reflexive: 'itself' },
};

/** @typedef {{ pronounKey: 'subjective'|'objective'|'posDet'|'posPro'|'reflexive'; names: string[] }} PronounShorthandAlias */

/** Readability shorthands (she/her/his_ etc.) — language-neutral names for common English pronouns. */
/** @type {ReadonlyArray<PronounShorthandAlias>} */
export const shorthandAliases = Object.freeze([
    { pronounKey: 'subjective', names: ['she', 'he', 'they'] },
    { pronounKey: 'objective', names: ['her', 'him', 'them'] },
    { pronounKey: 'posDet', names: ['her_', 'his_', 'their_'] },
    { pronounKey: 'posPro', names: ['hers', 'his', 'theirs'] },
    { pronounKey: 'reflexive', names: ['herself', 'himself', 'themself'] },
]);

/**
 * WyvernChat capitalized macro variants.
 * These are aliases that return the same value as the primary macros but capitalized.
 * WyvernChat exposes these as {{pronounSubjectiveCap}} etc.
 * We implement them as separate handlers (not aliases) since they transform the value.
 */
/** @type {ReadonlyArray<{pronounKey: 'subjective'|'objective'|'posDet'|'posPro'|'reflexive', name: string}>} */
export const wyvernChatAliases = Object.freeze([
    { pronounKey: 'subjective', name: 'pronounSubjectiveCap' },
    { pronounKey: 'objective', name: 'pronounObjectiveCap' },
    { pronounKey: 'posDet', name: 'pronounPosDetCap' },
    { pronounKey: 'posPro', name: 'pronounPosProCap' },
    { pronounKey: 'reflexive', name: 'pronounReflexiveCap' },
]);

/**
 * JanitorAI compatibility aliases.
 * Names confirmed from JanitorAI UI: sub, obj, poss, poss_p, ref.
 */
/** @type {ReadonlyArray<PronounShorthandAlias>} */
export const JanitorAIAliases = Object.freeze([
    { pronounKey: 'subjective', names: ['sub'] },
    { pronounKey: 'objective', names: ['obj'] },
    { pronounKey: 'posDet', names: ['poss'] },
    { pronounKey: 'posPro', names: ['poss_p'] },
    { pronounKey: 'reflexive', names: ['ref'] },
]);

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settingKeys = Object.freeze({
    CUR_VERSION: '_curVersion',
    ENABLE_SHORTHANDS: 'enableShorthands',
    ENABLE_WYVERN_COMPAT: 'enableWyvernCompat',
    ENABLE_JANITOR_COMPAT: 'enableJanitorCompat',
});

const defaultSettings = Object.freeze({
    [settingKeys.CUR_VERSION]: null,
    [settingKeys.ENABLE_SHORTHANDS]: false,
    [settingKeys.ENABLE_WYVERN_COMPAT]: false,
    [settingKeys.ENABLE_JANITOR_COMPAT]: false,
});

/**
 * Migrates settings from older versions if needed.
 * Uses `_curVersion` if present to guard future version-specific migrations.
 * @param {Record<string, unknown>} settings
 */
function migrateSettings(settings) {
    // v1: single enablePersonaShorthands key
    if ('enablePersonaShorthands' in settings && !(settingKeys.ENABLE_SHORTHANDS in settings)) {
        settings[settingKeys.ENABLE_SHORTHANDS] = settings['enablePersonaShorthands'];
        delete settings['enablePersonaShorthands'];
    }
    // v2.0: enableWyvernShorthands key
    if ('enableWyvernShorthands' in settings && !(settingKeys.ENABLE_SHORTHANDS in settings)) {
        settings[settingKeys.ENABLE_SHORTHANDS] = settings['enableWyvernShorthands'];
        delete settings['enableWyvernShorthands'];
    }
    // v2.0: enableJanitorShorthands renamed to enableJanitorCompat
    if ('enableJanitorShorthands' in settings && !(settingKeys.ENABLE_JANITOR_COMPAT in settings)) {
        settings[settingKeys.ENABLE_JANITOR_COMPAT] = settings['enableJanitorShorthands'];
        delete settings['enableJanitorShorthands'];
    }
}

/**
 * Ensures extension settings exist with defaults, running any needed migrations.
 * Stamps `_curVersion` with the running extension version so future migrations can gate on it.
 * @param {string|null} [version=null] - Current extension version from manifest.json
 * @returns {Record<string, unknown>}
 */
export function ensureSettings(version = null) {
    // Migrate preferences without deleting the old extension's settings.
    // That prevents a future uninstall/cleanup from erasing the merged copy.
    if (!extension_settings[EXTENSION_KEY]) {
        extension_settings[EXTENSION_KEY] = { ...(extension_settings[LEGACY_SETTINGS_KEY] || {}) };
    }
    const settings = extension_settings[EXTENSION_KEY];
    migrateSettings(settings);
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (!(key in settings)) settings[key] = value;
    }
    if (version !== null) settings[settingKeys.CUR_VERSION] = version;
    return settings;
}

export const pronounsSettings = {
    get shorthands() {
        return Boolean(ensureSettings()[settingKeys.ENABLE_SHORTHANDS]);
    },
    get wyvernCompat() {
        return Boolean(ensureSettings()[settingKeys.ENABLE_WYVERN_COMPAT]);
    },
    get janitorCompat() {
        return Boolean(ensureSettings()[settingKeys.ENABLE_JANITOR_COMPAT]);
    },
};

/**
 * Persists a setting value and triggers a settings save.
 * @param {string} key
 * @param {unknown} value
 */
export function saveSetting(key, value) {
    ensureSettings()[key] = value;
    saveSettingsDebounced();
}

// ---------------------------------------------------------------------------
// Persona pronoun data access
// ---------------------------------------------------------------------------

/**
 * Gets the current persona ID.
 * @returns {string}
 */
export function getCurrentPersonaId() {
    return user_avatar || '';
}

/**
 * Ensures the persona descriptor exists and has a pronoun object.
 * @returns {{ pronoun: Pronouns } | null}
 */
export function ensurePersonaContainer() {
    const personaId = getCurrentPersonaId();
    if (!personaId) return null;
    return ensurePersonaContainerForId(personaId);
}

/** Return normalized values without leaking a mutable descriptor reference. */
export function getPersonaPronounValues(personaId) {
    if (!personaId) return { ...defaultPronoun };
    const descriptor = power_user.persona_descriptions?.[personaId];
    const backup = ensureSettings().personaPronounArchive?.[personaId];
    const pronoun = descriptor?.pronoun ?? backup;
    return Object.fromEntries(PRONOUN_FIELDS.map(field => [field, String(pronoun?.[field] ?? '')]));
}

/** Create a descriptor for a specific persona (the PM editor may edit INACTIVE personas). */
export function ensurePersonaContainerForId(personaId) {
    if (!personaId || !Object.prototype.hasOwnProperty.call(power_user.personas || {}, personaId)) return null;
    power_user.persona_descriptions ||= {};
    power_user.persona_descriptions[personaId] ||= {};
    const descriptor = power_user.persona_descriptions[personaId];
    if (!descriptor.pronoun) descriptor.pronoun = getPersonaPronounValues(personaId);
    return descriptor;
}

/** Save the selected persona's pronouns, also archiving them under this extension's settings. */
export function setPersonaPronounValues(personaId, values) {
    const descriptor = ensurePersonaContainerForId(personaId);
    if (!descriptor) return { ...defaultPronoun };
    descriptor.pronoun = Object.fromEntries(PRONOUN_FIELDS.map(field => [field, String(values?.[field] ?? '')]));
    const settings = ensureSettings();
    settings.personaPronounArchive ||= {};
    settings.personaPronounArchive[personaId] = { ...descriptor.pronoun };
    saveSettingsDebounced();
    return { ...descriptor.pronoun };
}

/** Preserve existing persona pronouns before a user disables or removes the old plugin. */
export function restoreArchivedPronouns() {
    const settings = ensureSettings();
    const archive = settings.personaPronounArchive ||= {};
    let changed = false;
    for (const [id, descriptor] of Object.entries(power_user.persona_descriptions || {})) {
        if (!Object.prototype.hasOwnProperty.call(power_user.personas || {}, id)) continue;
        if (descriptor?.pronoun) {
            const existing = getPersonaPronounValues(id);
            if (JSON.stringify(archive[id]) !== JSON.stringify(existing)) {
                archive[id] = existing;
                changed = true;
            }
        } else if (archive[id]) {
            descriptor.pronoun = { ...archive[id] };
            changed = true;
        }
    }
    if (changed) saveSettingsDebounced();
}

/** Current persona is used by macros, slash commands, and the native fallback UI. */
export function getCurrentPronounValues() {
    return getPersonaPronounValues(getCurrentPersonaId());
}

/**
 * Sets all pronoun fields for the current persona and persists.
 * @param {Pronouns} values
 * @returns {Pronouns}
 */
export function setCurrentPronounValues(values) {
    return setPersonaPronounValues(getCurrentPersonaId(), values);
}

/** Sets one pronoun on the active persona. */
export function setCurrentPronounValue(key, value) {
    if (!PRONOUN_FIELDS.includes(key)) return '';
    const id = getCurrentPersonaId();
    if (!id) return '';
    const values = getPersonaPronounValues(id);
    values[key] = String(value ?? '');
    setPersonaPronounValues(id, values);
    return values[key];
}

/**
 * Applies a preset to the current persona.
 * @param {keyof typeof pronounPresets} presetKey
 * @returns {Pronouns}
 */
export function applyPronounPreset(presetKey) {
    const preset = pronounPresets[presetKey];
    if (!preset) return getCurrentPronounValues();
    return setCurrentPronounValues(preset);
}

/**
 * Copies the pronoun data from one persona to another.
 * No-op if the source persona has no pronouns set.
 * @param {string} sourceAvatarId
 * @param {string} targetAvatarId
 */
export function copyPronounData(sourceAvatarId, targetAvatarId) {
    const source = power_user.persona_descriptions?.[sourceAvatarId];
    if (!source?.pronoun) return;
    setPersonaPronounValues(targetAvatarId, getPersonaPronounValues(sourceAvatarId));
}

/**
 * Registers data-layer event listeners for persona lifecycle events.
 * Call once during extension initialization.
 */
export function registerDataEventListeners() {
    // Copy pronouns when a persona is duplicated (requires ST core PR #5448)
    eventSource.on(event_types.PERSONA_CREATED, (/** @type {{ avatarId: string, duplicatedFromAvatarId?: string }} */ data) => {
        if (data?.duplicatedFromAvatarId) {
            copyPronounData(data.duplicatedFromAvatarId, data.avatarId);
        }
    });
}

/**
 * Non-destructive cleanup: pronouns live in user-owned persona descriptors.
 * Never remove those records as an extension uninstall side effect.
 */
export async function cleanAllPronounData() {
    // Intentionally non-destructive: user-owned persona pronouns remain intact.
    // Use the normal SillyTavern persona editor to clear individual values.
}
