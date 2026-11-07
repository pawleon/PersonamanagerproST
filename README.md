# Persona Manager + Pronouns — combined extension

**One extension for persona management and per-persona pronouns.** This integration preserves the original Persona Manager editor, themes, folders, favorites, backups, and sorting, and incorporates SillyTavern Pronouns (macros, presets, slash commands, native fallback UI, and text replacer).

## Installing safely

1. **Back up your SillyTavern settings and personas first.**
2. **Disable (do not uninstall yet)** the separate `⊹ PERSONA MANAGER ⊹` and `Pronouns` extensions in SillyTavern. This avoids two panels, two competing macro registrars, and conflicting shortcuts.
3. Install this ZIP as a third-party SillyTavern extension folder named `persona-manager-pronouns` or install the folder's contents through your extension installation workflow. Reload SillyTavern.
4. Open Persona Management → choose any persona → Edit. **Pronouns** is directly under Description, including the four presets and five individually editable fields.
5. Existing pronouns are read from each persona's `power_user.persona_descriptions[avatarId].pronoun`. Previous Pronouns settings are copied into a separate combined extension namespace; changes are also archived there to protect against the original plugin's destructive uninstall cleanup.
6. Once you have confirmed that your existing pronouns and preferences appeared in the combined extension, you may remove the old extensions. **Important:** The original standalone Pronouns extension's uninstall hook deletes `.pronoun` data from *all* persona descriptors. Make a fresh backup before uninstalling it; if removed while this merged version is enabled, the merged version can restore archived pronouns on the next reload.

## Pronoun editor

You can edit pronouns on **any** persona, even if the persona is not active in the current chat. Editing Winona will not accidentally change Matilda's pronouns. Values are stored in the original SillyTavern persona descriptor field, not in a separate per-chat configuration.

- Subjective: `she`
- Objective: `her`
- Possessive determiner: `her`
- Possessive pronoun: `hers`
- Reflexive: `herself`

Presets: She/Her, He/Him, They/Them, It/Its; manual edits remain supported. The integrated editor supports English and Russian UI labels, including mobile layout and all original Persona Manager themes.

## Pronouns functionality retained

- Primary macros: `{{pronounSubjective}}`, `{{pronounObjective}}`, `{{pronounPosDet}}`, `{{pronounPosPro}}`, `{{pronounReflexive}}`, `{{pronounVerbBe}}`.
- Optional shorthand aliases and WyvernChat / JanitorAI compatibility settings.
- Dot-notation preprocessing, `/pronouns-set`, `/pronouns-set-preset`, `/pronouns-replace`, `/pronouns-open-replacer`.
- The Pronouns extension settings section remains available for the text replacer and macro toggles.
- Native persona editor pronoun UI stays available when the Persona Manager drawer takeover is disabled.

**Requirement:** SillyTavern's Experimental Macro Engine must be enabled for pronoun macro substitution. Source is based on Persona Manager v1.2.0 and SillyTavern-Pronouns v2.1.0. This is an integrated release candidate tested by code checks; live SillyTavern runtime testing is still recommended before deleting old copies.

## Credits & licenses

Persona Manager: aceenvw, AGPL-3.0-or-later (`LICENSE`). SillyTavern-Pronouns: Wolfsblvt, AGPL-3.0 (`LICENSE-PRONOUNS`). The original source modules and UI features are retained with the modifications documented above.

---

## Original Persona Manager README

# ⊹ PERSONA MANAGER ⊹

A prettier, mobile-first replacement for SillyTavern's native Persona Management
panel. Clicking the Persona Management drawer button opens a clean, themed modal
for browsing, organizing and editing your personas.

## Features

- **Drawer takeover** — replaces the native Persona Management panel with a themed
  modal (toggle off in settings to restore the default panel).
- **Card grid** with centered names and smaller titles over the avatars, an active indicator, lock /
  default badges, favorites, and per-card actions (edit / move / remove / delete).
- **Quick filters** for active, default, locked, favorite, and unsorted personas,
  plus **Recently used** sorting.
- **Active-persona spotlight** at the bottom: click its name or avatar to edit, with
  separate native lock controls for the current chat, character or group, and default persona.
- **Folders** (virtual), **favorites**, drag-and-drop assignment, and bulk-select
  actions (move / favorite / export / delete).
- **Full editor** — title, description with a plain token count, position / depth /
  role, connections (active-persona locks + connection avatars), lorebook binding
  (open in the World Info editor), and private notes (never sent to the model).
- **Quiet autosave feedback** shows pending changes and handoff to SillyTavern;
  native notifications report save failures.
- **Rename / duplicate / change image / set default / delete** per persona.
- **Two focused editing modes** — a true full-viewport persona editor on any screen,
  plus CodeMirror Pro's independent full-screen description editor.
- **Cards per row** (Auto / 3–10, default 6), with two columns on mobile, and
  **pagination** (10 / 30 / 60 / 100).
- **Image ratio** (1:1 / 3:4 / 4:5 / 5:4 / 4:3), saved across sessions; defaults to 4:5.
- **Backup / Restore** the whole library as a ZIP (personas + photos), and
  **Export** a selected subset from the bulk-select bar.
- **Convert a character into a persona** from the toolbar.
- **Override themes** — Native (follows your SillyTavern theme), GitHub Dark, Light,
  Dracula, Solarized Dark, and Nord. Pick from the extension settings or the in-modal
  palette button.
- **Mobile-first** — full-screen takeover, an overlay folder sidebar, a full-screen
  editor that opens automatically with a back button, responsive card density,
  touch-friendly targets, and a compact More menu for secondary actions.
- **Bilingual UI** — English and Russian.

## Installation

Install via SillyTavern's extension installer using this repository URL, or clone it
into `data/<user>/extensions/` (third-party). Then reload SillyTavern.

## Usage

Click the **Persona Management** drawer button to open the manager. Use the toolbar
to search, sort, create folders and enter bulk-select mode. Click a card to switch
to that persona; use the pencil to open the editor. Backup / Restore / Convert and
the theme picker live in the same toolbar (under More on mobile).

## Credits

Author: **aceenvw**. Licensed AGPL-3.0-or-later.
