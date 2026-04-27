/**
 * Loads boot profiles from `boot-profiles/profiles.yml`.
 *
 * Profiles are declarative (per strategy report §8.7). MANIFESTO.md is
 * mandatory in every profile — we enforce that here, not just by convention.
 */

import { readFileSync, statSync } from 'node:fs';
import yaml from 'js-yaml';
import { config } from '../config.ts';
import { child } from '../logger.ts';

const log = child({ module: 'spawner/boot-profiles' });

export interface BootProfile {
  description: string;
  must_read: string[];
  optional_read: string[];
  typical_tasks: string[];
  estimated_tokens: number;
}

interface ProfilesYaml {
  profiles: Record<string, BootProfile>;
}

let _profiles: Record<string, BootProfile> | null = null;
let _profilesMtime = 0;

const MANIFESTO_PATH = 'docs/semiont/MANIFESTO.md';
const BECOME_PATH = 'BECOME_TAIWANMD.md';

/** Reads (or re-reads) profiles.yml. Re-reads when the file changes on disk. */
export function loadProfiles(): Record<string, BootProfile> {
  const path = config.paths.bootProfiles;
  // Tiny mtime check to allow hot-reload while server is running.
  let mtime = 0;
  try {
    mtime = statSync(path).mtimeMs;
  } catch {
    // file missing — fall through and let readFileSync raise a clear error
  }
  if (_profiles && mtime === _profilesMtime) return _profiles;

  const raw = readFileSync(path, 'utf8');
  const parsed = yaml.load(raw) as ProfilesYaml;
  if (!parsed?.profiles || typeof parsed.profiles !== 'object') {
    throw new Error(
      `profiles.yml malformed: missing top-level "profiles" key (path=${path})`,
    );
  }
  // Hard rule 1: MANIFESTO must be in every profile's must_read (cheyu's
  // identity rule — strategy §8.7).
  // Hard rule 2: BECOME_TAIWANMD must also be in every profile (added 2026-04-27
  // γ after first live spawn — every spawned session must at minimum know
  // who they are, even if they don't load today's memory). Yaml has it explicit
  // for human readability; this code is the safety net.
  for (const [name, profile] of Object.entries(parsed.profiles)) {
    if (!profile.must_read.includes(MANIFESTO_PATH)) {
      log.warn(
        { profile: name },
        `profile missing ${MANIFESTO_PATH} — auto-injecting`,
      );
      profile.must_read = [MANIFESTO_PATH, ...profile.must_read];
    }
    if (!profile.must_read.includes(BECOME_PATH)) {
      log.warn(
        { profile: name },
        `profile missing ${BECOME_PATH} — auto-injecting`,
      );
      profile.must_read = [BECOME_PATH, ...profile.must_read];
    }
  }
  _profiles = parsed.profiles;
  _profilesMtime = mtime;
  log.info(
    { count: Object.keys(_profiles).length, path },
    'loaded boot profiles',
  );
  return _profiles;
}

export function getProfile(name: string): BootProfile {
  const profiles = loadProfiles();
  const profile = profiles[name];
  if (!profile) {
    throw new Error(
      `Unknown boot profile: ${name}. Available: ${Object.keys(profiles).join(', ')}`,
    );
  }
  return profile;
}
