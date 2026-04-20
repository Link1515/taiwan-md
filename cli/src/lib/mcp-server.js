/**
 * lib/mcp-server.js — Model Context Protocol server implementation
 *
 * Exposes Taiwan.md primitives as MCP tools so Claude Desktop / Cursor /
 * Warp can query the knowledge base directly. Uses stdio transport (local).
 *
 * Tools exposed:
 *   - taiwanmd_search   Full-text search across articles
 *   - taiwanmd_read     Fetch an article by slug
 *   - taiwanmd_rag      Retrieval-augmented context for a query
 *   - taiwanmd_cite     Verified citation-backed claims
 *   - taiwanmd_organs   Semiont vital signs (8 organs)
 *   - taiwanmd_stats    Summary stats (article count, etc.)
 *
 * Reference: https://modelcontextprotocol.io/docs
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { getArticleFiles, readArticle, getApiPath } from './knowledge.js';
import { searchArticles } from './search.js';

/** Build and return a configured McpServer instance. */
export function createTaiwanmdMcpServer() {
  const server = new McpServer({
    name: 'taiwanmd',
    version: '0.6.1',
  });

  // ─── Tool: search ──────────────────────────────────────────────────────
  server.registerTool(
    'taiwanmd_search',
    {
      title: 'Search Taiwan.md articles',
      description:
        'Full-text search across 900+ curated articles about Taiwan. Returns top N hits with title, slug, category, and description.',
      inputSchema: {
        query: z.string().describe('Search query (Chinese or English)'),
        limit: z.number().optional().default(5).describe('Max results'),
      },
    },
    async ({ query, limit = 5 }) => {
      const hits = await searchArticles(query, { limit });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(hits, null, 2),
          },
        ],
      };
    },
  );

  // ─── Tool: read ────────────────────────────────────────────────────────
  server.registerTool(
    'taiwanmd_read',
    {
      title: 'Read a Taiwan.md article by slug',
      description:
        'Return the full body of an article. Returns frontmatter + markdown body.',
      inputSchema: {
        slug: z.string().describe('Article slug (e.g. "珍珠奶茶" or "王新仁")'),
      },
    },
    async ({ slug }) => {
      const files = getArticleFiles();
      const match =
        files.find((f) => path.basename(f, '.md') === slug) ||
        files.find((f) => path.basename(f, '.md').includes(slug));
      if (!match) {
        return {
          content: [{ type: 'text', text: `Not found: ${slug}` }],
          isError: true,
        };
      }
      const { frontmatter, body } = readArticle(match);
      return {
        content: [
          {
            type: 'text',
            text: `# ${frontmatter.title || slug}\n\n${frontmatter.description || ''}\n\n---\n\n${body}`,
          },
        ],
      };
    },
  );

  // ─── Tool: rag ─────────────────────────────────────────────────────────
  server.registerTool(
    'taiwanmd_rag',
    {
      title: 'RAG context for a query',
      description:
        'Retrieve top-N articles as a prompt-ready RAG context block. Use this when the user asks about Taiwan and you want verified source material before responding.',
      inputSchema: {
        query: z.string().describe('User question about Taiwan'),
        limit: z.number().optional().default(3).describe('Number of articles'),
      },
    },
    async ({ query, limit = 3 }) => {
      const hits = await searchArticles(query, { limit });
      const files = getArticleFiles();
      const sections = [];
      for (let i = 0; i < hits.length; i++) {
        const h = hits[i];
        const match =
          files.find((f) => path.basename(f, '.md') === h.slug) ||
          files.find((f) => path.basename(f, '.md').includes(h.slug));
        if (!match) continue;
        const { frontmatter, body } = readArticle(match);
        sections.push(
          `## ${i + 1}. ${frontmatter.title || h.slug} (${frontmatter.category || '?'})\n\n${body}`,
        );
      }
      const text = `# Taiwan Knowledge Context\n\n${sections.join('\n\n---\n\n')}\n\n---\nBased on the above context about Taiwan, answer the following question:\n${query}`;
      return { content: [{ type: 'text', text }] };
    },
  );

  // ─── Tool: cite ────────────────────────────────────────────────────────
  server.registerTool(
    'taiwanmd_cite',
    {
      title: 'Get verified citations for a topic',
      description:
        'Anti-hallucination primitive. Returns claims that have [^N] footnote attached + the source URL. Use this instead of making up sentences.',
      inputSchema: {
        query: z.string(),
        limit: z.number().optional().default(3),
      },
    },
    async ({ query, limit = 3 }) => {
      const hits = await searchArticles(query, { limit: 10 });
      const files = getArticleFiles();
      const claims = [];
      const footnoteDefRegex =
        /^\[\^([\w-]+)\]:\s*(?:\[([^\]]+)\]\(([^)]+)\))?\s*(?:—\s*(.+))?/gm;

      for (const hit of hits.slice(0, 5)) {
        const match =
          files.find((f) => path.basename(f, '.md') === hit.slug) ||
          files.find((f) => path.basename(f, '.md').includes(hit.slug));
        if (!match) continue;
        const { frontmatter, body } = readArticle(match);
        const defs = {};
        let m;
        footnoteDefRegex.lastIndex = 0;
        while ((m = footnoteDefRegex.exec(body)) !== null) {
          defs[m[1]] = {
            name: m[2] || null,
            url: m[3] || null,
            desc: m[4] || '',
          };
        }
        const sentences = body.split(/(?<=[。！？!?])\s*/);
        for (const s of sentences) {
          const clean = s.trim();
          if (clean.length < 20 || clean.length > 300) continue;
          const fns = [...clean.matchAll(/\[\^([\w-]+)\]/g)].map((x) => x[1]);
          if (fns.length === 0) continue;
          const sources = fns.map((id) => defs[id]).filter((d) => d && d.url);
          if (sources.length === 0) continue;
          claims.push({
            claim: clean.replace(/\[\^[\w-]+\]/g, '').trim(),
            article: frontmatter.title,
            sources,
          });
          if (claims.length >= limit) break;
        }
        if (claims.length >= limit) break;
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(claims, null, 2) }],
      };
    },
  );

  // ─── Tool: organs ──────────────────────────────────────────────────────
  server.registerTool(
    'taiwanmd_organs',
    {
      title: 'Semiont vital signs',
      description:
        'Return Taiwan.md Semiont 8-organ health scores from the organism dashboard.',
      inputSchema: {},
    },
    async () => {
      const jsonPath = path.join(getApiPath(), 'dashboard-organism.json');
      if (!fs.existsSync(jsonPath)) {
        return {
          content: [{ type: 'text', text: 'organism dashboard not synced' }],
          isError: true,
        };
      }
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return {
        content: [{ type: 'text', text: JSON.stringify(raw, null, 2) }],
      };
    },
  );

  // ─── Tool: stats ───────────────────────────────────────────────────────
  server.registerTool(
    'taiwanmd_stats',
    {
      title: 'Taiwan.md project stats',
      description:
        'Return summary stats: article count, categories, last-updated timestamps.',
      inputSchema: {},
    },
    async () => {
      const files = getArticleFiles();
      const byCategory = {};
      for (const f of files) {
        const rel = path.relative(path.join(path.dirname(f), '..'), f);
        const category = path.basename(path.dirname(f));
        byCategory[category] = (byCategory[category] || 0) + 1;
      }
      const data = {
        totalArticles: files.length,
        byCategory,
        knowledgePath: files[0] ? path.dirname(path.dirname(files[0])) : null,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  return server;
}

/** Start the MCP server on stdio. Called from `taiwanmd mcp serve`. */
export async function startMcpServer() {
  const server = createTaiwanmdMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so stdout stays pristine for MCP protocol.
  console.error('[taiwanmd] MCP server ready on stdio');
}
