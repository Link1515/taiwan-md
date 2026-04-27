/**
 * `bun run build-prompt <task-id>` — print the spawn prompt for an existing task.
 *
 * Used for verifying the prompt-builder works correctly without actually
 * invoking the `claude` CLI. Per cheyu's verification spec (§Verification),
 * this is the substitute for live spawning during MVP testing.
 */

import { getTask } from '../tasks/manager.ts';
import { buildSpawnPrompt } from '../spawner/prompt-builder.ts';
import { closeDb } from '../db/client.ts';

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: bun run build-prompt <task-id>');
  process.exit(1);
}

const task = getTask(taskId);
if (!task) {
  console.error(`Task not found: ${taskId}`);
  process.exit(2);
}

const prompt = buildSpawnPrompt(task);
console.log(prompt);
closeDb();
