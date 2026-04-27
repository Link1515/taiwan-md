/**
 * Intake adapter interface — plugin architecture per strategy report §8.8.
 *
 * Future intake sources (GitHub webhook, Telegram, iMessage, self-diagnose)
 * implement this same interface. The MVP ships only one: ARTICLE-INBOX file
 * watch. Adding a new source must NOT require changes outside its own folder.
 */

import type { NewTaskInput } from '../tasks/types.ts';

export interface IntakeAdapter {
  /** Display name used in logs and the daily report. */
  readonly name: string;

  /** Start watching / polling. Resolves once the source is live. */
  start(): Promise<void>;

  /** Cleanly stop. Resolves once handlers are detached. */
  stop(): Promise<void>;

  /**
   * Manually run one detection pass synchronously. Used by CLI scripts and
   * the daily reporter to "catch up" without waiting for the watcher.
   *
   * Returns the list of tasks created during this pass.
   */
  scanOnce(): Promise<DetectedEntry[]>;
}

/**
 * One ARTICLE-INBOX entry (or equivalent from any other source) that the
 * adapter has decided is task-worthy.
 */
export interface DetectedEntry {
  /** Stable hash so the dedupe table can recognise it next scan. */
  entryHash: string;
  /** Source file path or URL the entry came from. */
  sourceFile: string;
  /** Ready-to-create task input (NewTaskInput). */
  draft: NewTaskInput;
}
