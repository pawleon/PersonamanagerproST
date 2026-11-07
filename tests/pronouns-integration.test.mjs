// Run: node --experimental-vm-modules --no-warnings tests/pronouns-integration.test.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(resolve(root, 'pronouns/src/pronouns.js'), 'utf8');
const ctx = vm.createContext({ console });
const extension_settings = { 'sillytavern-pronouns': { enableShorthands: true, enableJanitorCompat: true } };
const power_user = {
  personas: { 'matilda.png': 'Matilda', 'winona.png': 'Winona', 'no-name.png': '' },
  persona_descriptions: {
    'matilda.png': { description: 'Matilda', pronoun: { subjective: 'she', objective: 'her', posDet: 'her', posPro: 'hers', reflexive: 'herself' } },
    'winona.png': { description: 'Winona' },
    'no-name.png': { description: 'Blank' },
  },
};
let saves = 0;
const dummyEvents = { on() {} };
const exportsByPath = {
  '../index.js': { EXTENSION_KEY: 'aevPersonaManagerPronouns' },
  '../../../../../extensions.js': { extension_settings },
  '../../../../../../script.js': { user_avatar: 'matilda.png', saveSettingsDebounced: () => saves++, eventSource: dummyEvents, event_types: { PERSONA_CREATED: 'PERSONA_CREATED' } },
  '../../../../../../scripts/power-user.js': { power_user },
};
const module = new vm.SourceTextModule(code, { context: ctx });
await module.link(async (specifier) => {
  const exports = exportsByPath[specifier];
  assert.ok(exports, `Unmapped dependency: ${specifier}`);
  const names = Object.keys(exports);
  return new vm.SyntheticModule(names, function() {
    for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
  }, { context: ctx });
});
await module.evaluate();
const fn = module.namespace;
assert.equal(fn.ensureSettings().enableShorthands, true, 'migrates shorthand settings');
assert.equal(fn.ensureSettings().enableJanitorCompat, true, 'migrates compatibility settings');
fn.restoreArchivedPronouns();
assert.equal(fn.ensureSettings().personaPronounArchive['matilda.png'].subjective, 'she', 'archives existing pronouns');
fn.setPersonaPronounValues('winona.png', { subjective:'they', objective:'them', posDet:'their', posPro:'theirs', reflexive:'themselves' });
assert.equal(fn.getPersonaPronounValues('winona.png').subjective, 'they', 'writes inactive persona');
assert.equal(fn.getPersonaPronounValues('matilda.png').subjective, 'she', 'does not touch other persona');
assert.notEqual(power_user.persona_descriptions['matilda.png'].pronoun, power_user.persona_descriptions['winona.png'].pronoun, 'independent persona descriptors');
fn.setPersonaPronounValues('no-name.png', { subjective:'he' });
assert.equal(fn.getPersonaPronounValues('no-name.png').subjective, 'he', 'supports unnamed persona');
// Simulate the old plugin uninstalling and clearing fields.
for (const d of Object.values(power_user.persona_descriptions)) delete d.pronoun;
fn.restoreArchivedPronouns();
assert.equal(power_user.persona_descriptions['matilda.png'].pronoun.subjective, 'she', 'recovers old pronouns after standalone cleanup');
assert.equal(power_user.persona_descriptions['winona.png'].pronoun.subjective, 'they', 'recovers new pronouns after standalone cleanup');
await fn.cleanAllPronounData();
assert.equal(power_user.persona_descriptions['matilda.png'].pronoun.subjective, 'she', 'merged cleanup is nondestructive');
assert.ok(saves > 0, 'changes scheduled for persistence');

const html = readFileSync(resolve(root, 'manager.html'), 'utf8');
for (const field of ['subjective', 'objective', 'posDet', 'posPro', 'reflexive']) {
  assert.match(html, new RegExp(`data-pm-pronoun="${field}"`));
}
for (const preset of ['she','he','they','it']) {
  assert.match(html, new RegExp(`data-pm-pronoun-preset="${preset}"`));
}
const manager = readFileSync(resolve(root, 'index.js'), 'utf8');
assert.match(manager, /renderEditorPronouns\(id\)/, 'editor renders per-persona pronouns');
assert.match(manager, /setPersonaPronounValues\(id, values\)/, 'editor saves edited persona');
assert.match(manager, /await initPronouns\(\)/, 'pronoun macros initialize automatically');
const settingsTemplate = readFileSync(resolve(root, 'pronouns/templates/settings.html'), 'utf8');
assert.match(settingsTemplate, /pronouns_enable_janitor_shorthands/);
console.log('Passed: legacy migration, identity isolation, active/inactive edits, recovery, retained macros/settings UI and 5 fields + presets.');
