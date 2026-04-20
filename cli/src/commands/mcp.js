/**
 * Taiwan.md MCP Command — Model Context Protocol server scaffold (v0.7 preview)
 *
 * Exposes CLI commands as MCP tools so Claude Desktop / Cursor / Warp can
 * query Taiwan.md directly without shelling out.
 *
 * This is a v0.7 preview scaffold; actual MCP server implementation requires
 * @modelcontextprotocol/sdk as a dependency.
 *
 * Usage:
 *   taiwanmd mcp serve           # start MCP server on stdio
 *   taiwanmd mcp install         # print Claude Desktop config snippet
 */

import chalk from 'chalk';
import { getKnowledgePath } from '../lib/knowledge.js';

export function mcpCommand(program) {
  const mcp = program
    .command('mcp')
    .description(
      '[v0.7 preview] Model Context Protocol server — Claude Desktop integration',
    )
    .action(() => {
      console.log('');
      console.log(chalk.bold('🔌 taiwanmd MCP — v0.7 preview'));
      console.log('');
      console.log(chalk.gray('  Subcommands:'));
      console.log(
        chalk.gray('    taiwanmd mcp serve     Start MCP server (stdio)'),
      );
      console.log(
        chalk.gray('    taiwanmd mcp install   Print Claude Desktop config'),
      );
      console.log('');
      console.log(
        chalk.yellow(
          '  ⚠ MCP server scaffold — @modelcontextprotocol/sdk integration pending.',
        ),
      );
      console.log(
        chalk.gray(
          '  Reference: reports/cli-evolution-roadmap-2026-04-20.md §v0.7',
        ),
      );
      console.log('');
    });

  mcp
    .command('serve')
    .description('Start MCP server on stdio (scaffold — not yet functional)')
    .action(() => {
      console.log(
        chalk.yellow('\n⚠ MCP server not yet implemented (v0.7 preview).'),
      );
      console.log('');
      console.log(chalk.gray('  Planned tool surface:'));
      console.log(chalk.gray('    - search(query, limit)'));
      console.log(chalk.gray('    - read(slug, lang?)'));
      console.log(chalk.gray('    - rag(query, limit)'));
      console.log(chalk.gray('    - cite(topic)'));
      console.log(chalk.gray('    - stats() / organs() / sense()'));
      console.log('');
      console.log(chalk.gray('  Dependency to add: @modelcontextprotocol/sdk'));
      console.log(
        chalk.gray('  Transport: stdio (local) → later SSE/HTTP (remote).'),
      );
      console.log('');
      process.exit(2);
    });

  mcp
    .command('install')
    .description(
      'Print Claude Desktop / Cursor MCP config snippet for copy-paste',
    )
    .option(
      '--client <client>',
      'claude-desktop | cursor | warp',
      'claude-desktop',
    )
    .action((opts) => {
      const binPath = 'taiwanmd'; // after npm install -g, taiwanmd is on PATH
      console.log('');
      console.log(chalk.bold(`🔌 MCP config snippet — ${opts.client}`));
      console.log('');
      if (opts.client === 'claude-desktop') {
        console.log(
          chalk.gray(
            '  Add to ~/Library/Application Support/Claude/claude_desktop_config.json:',
          ),
        );
        console.log('');
        const snippet = JSON.stringify(
          {
            mcpServers: {
              taiwanmd: {
                command: binPath,
                args: ['mcp', 'serve'],
              },
            },
          },
          null,
          2,
        );
        console.log(chalk.cyan(snippet));
      } else if (opts.client === 'cursor') {
        console.log(chalk.gray('  Cursor MCP config (via Settings → MCP):'));
        console.log('');
        console.log(chalk.cyan(`command: ${binPath}`));
        console.log(chalk.cyan(`args: ["mcp", "serve"]`));
      } else {
        console.log(
          chalk.yellow(`  Client "${opts.client}" not yet documented.`),
        );
      }
      console.log('');
      console.log(
        chalk.gray(`  Knowledge base location: ${getKnowledgePath()}`),
      );
      console.log('');
      console.log(
        chalk.yellow(
          '  ⚠ Server implementation is v0.7 preview — config works, but `mcp serve` will print a not-implemented notice.',
        ),
      );
      console.log('');
    });
}
