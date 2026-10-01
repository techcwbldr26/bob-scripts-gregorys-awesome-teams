/**
 * Facts about the IBM Bob harness and Firecrawl that the installer depends on.
 *
 * Every value here was verified against primary documentation on 2026-10-01.
 * Keep the `source` comments: when Bob or Firecrawl move, these are the pages
 * to re-check before changing a value.
 */

/** Marker name used to delimit the block this kit manages inside shared files. */
export const MANAGED_NAME = 'GREGORYS-AWESOME-TEAMS';

export const MANAGED_BEGIN = `<!-- BEGIN ${MANAGED_NAME} (managed - edits inside this block are overwritten) -->`;
export const MANAGED_END = `<!-- END ${MANAGED_NAME} -->`;

/** Slash command students type in Bob. Filename stem must equal the command. */
export const COMMAND_NAME = 'gregorys-awesome-teams';

/**
 * Bob's project-scoped configuration surface.
 * source: https://bob.ibm.com/docs/ide/features/skills
 * source: https://bob.ibm.com/docs/ide/features/slash-commands
 * source: https://bob.ibm.com/docs/ide/configuration/rules
 * source: https://bob.ibm.com/docs/ide/configuration/mcp/mcp-in-bob
 */
export const BOB_PATHS = {
  dir: '.bob',
  agents: 'AGENTS.md',
  skillsIndex: 'SKILLS.md',
  mcp: '.bob/mcp.json',
  commands: '.bob/commands',
  rules: '.bob/rules',
  skills: '.bob/skills',
  examples: 'examples',
  references: 'references',
};

/**
 * Bob Shell requires Node.js 24 or later.
 * source: https://bob.ibm.com/docs/shell/getting-started/install-and-setup
 */
export const BOB_SHELL_MIN_NODE = 24;

/** Minimum Node the installer itself needs (only stable APIs are used). */
export const INSTALLER_MIN_NODE = 20;

/**
 * Context window economics, used by the context-budget rule we install.
 * source: https://bob.ibm.com/docs/ide/core-concepts/context-window-management
 */
export const CONTEXT = {
  capTokens: 270_000,
  compactionStartsAroundTokens: 190_000,
  reservedForReplyTokens: 20_000,
};

/**
 * Bob tool groups, used by the harness-engineering reference we install.
 * source: https://bob.ibm.com/docs/shell/core-concepts/tools#available-tool-groups
 */
export const TOOL_GROUPS = ['read', 'edit', 'execute', 'mcp', 'skill', 'todo', 'subagent', 'mode'];

/** Hosted Firecrawl MCP endpoint. source: https://docs.firecrawl.dev/mcp-server */
export const FIRECRAWL_HTTP_URL = 'https://mcp.firecrawl.dev/v2/mcp';
/** OAuth variant of the same endpoint. source: https://docs.firecrawl.dev/mcp-server */
export const FIRECRAWL_OAUTH_URL = 'https://mcp.firecrawl.dev/v2/mcp-oauth';
/** Pinned local server release. source: https://docs.firecrawl.dev/mcp-server/local */
export const FIRECRAWL_LOCAL_PACKAGE = 'firecrawl-mcp@3.23.7';
/** Where students mint a free key. */
export const FIRECRAWL_SIGNUP_URL = 'https://www.firecrawl.dev/signup';
export const FIRECRAWL_KEYS_URL = 'https://www.firecrawl.dev/app/api-keys';

export const FIRECRAWL_SERVER_KEY = 'firecrawl';
export const FIRECRAWL_API_KEY_VAR = 'FIRECRAWL_API_KEY';

/**
 * Firecrawl tools that only read. These are safe to auto-approve so students
 * are not click-fatigued into approving everything.
 * source: https://docs.firecrawl.dev/mcp-server/tools
 */
export const FIRECRAWL_READ_ONLY_TOOLS = [
  'firecrawl_search',
  'firecrawl_scrape',
  'firecrawl_map',
  'firecrawl_parse',
  'firecrawl_developer_search',
  'firecrawl_find_tools',
  'firecrawl_research_search_papers',
  'firecrawl_research_read_paper',
  'firecrawl_research_related_papers',
  'firecrawl_research_inspect_paper',
  'firecrawl_check_crawl_status',
  'firecrawl_agent_status',
];

/**
 * Deliberately NOT auto-approved: these spend many credits, mutate remote
 * state, or drive a live browser. Students should see the prompt.
 */
export const FIRECRAWL_GATED_TOOLS = [
  'firecrawl_crawl',
  'firecrawl_agent',
  'firecrawl_interact',
  'firecrawl_interact_stop',
  'firecrawl_monitor_create',
  'firecrawl_monitor_update',
  'firecrawl_monitor_delete',
];

/** The deadline the whole kit is pointed at. */
export const DEMO_DATE = 'December 1st, 2026';
