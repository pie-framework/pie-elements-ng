# MCP Servers Configuration

This project uses Model Context Protocol (MCP) servers to extend Claude's capabilities with project-specific tools and features.

## Configured Servers

### Memory Server

**Package**: `@modelcontextprotocol/server-memory`

**Purpose**: Provides knowledge graph-based persistent memory for tracking project context, decisions, and relationships.

**Use cases**:

- Track upstream migration progress from pie-elements
- Remember which elements have been migrated
- Store architectural decisions and patterns
- Maintain context about package dependencies

### Playwright Server

**Package**: `@playwright/mcp`

**Purpose**: Provides tools for browser automation and E2E testing through Playwright.

**Use cases**:

- Automate test generation for PIE elements
- Debug E2E test failures
- Generate accessibility test scripts
- Create browser automation workflows
- Capture screenshots and visual testing
- Interact with demo applications during testing

## Configuration

MCP servers are configured in separate files for each IDE:

- **Claude Code (VSCode)**: [.mcp.json](../.mcp.json) at project root
- **Cursor**: [.cursor/mcp.json](../.cursor/mcp.json) at project root

Both files are committed to version control so the entire team shares the same MCP server configuration, regardless of which IDE they use.

### Configuration Differences

The configurations are nearly identical, with one small difference:

**Claude Code** includes a `type` field:

```json
{
  "mcpServers": {
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp"],
      "env": {}
    }
  }
}
```

**Cursor** omits the `type` field:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"],
      "env": {}
    }
  }
}
```

## Usage

Once configured, both servers are automatically available in both Claude Code and Cursor. No additional setup is needed - Claude can access these tools directly.

### Memory Server Examples

Ask Claude to remember project-specific information:

- "Remember that hotspot element was migrated on 2025-01-15"
- "What elements have we migrated so far?"
- "Store the decision to use Svelte 5 runes for state management"

### Playwright Server Examples

Ask Claude to help with browser automation and testing:

- "Generate a Playwright test for the multiple-choice element"
- "Debug the failing E2E test for hotspot element"
- "Create an accessibility test script using axe-core"
- "Take screenshots of all element states"
- "Automate the demo application workflow"

## Managing MCP Servers

### Claude Code CLI Commands

```bash
# List configured servers
claude mcp list

# Get details about a server
claude mcp get memory

# Add a new server (project scope)
claude mcp add --transport stdio server-name --scope project -- npx -y @modelcontextprotocol/server-name

# Remove a server
claude mcp remove memory -s project
```

### Cursor Configuration

For Cursor, manually edit [.cursor/mcp.json](../.cursor/mcp.json) to add or remove servers. The format matches Claude Code's `.mcp.json` but without the `type` field.

## Notes on Other Potential Servers

### GitHub/Git Operations

**Not needed as MCP server** - Claude Code has excellent built-in GitHub support via the `gh` CLI tool. Your SSH authentication already works seamlessly:

```bash
# Examples of built-in GitHub operations:
gh repo view
gh pr create
gh issue list
gh pr view 123
```

**Note**: There is an official `mcp-server-git` from ModelContextProtocol, but it's Python-based (requires `uv` or `pip`). Since you have `gh` CLI with SSH configured, the built-in support is more convenient and requires no additional setup.

### NPM Package Registry

**Not needed** - Claude has built-in capabilities to:

- Search for packages via web search
- Query package.json for dependency information
- Use the filesystem server to read package files

### Web Search

**Not needed** - Claude Code includes built-in web search capabilities for searching documentation, Stack Overflow, GitHub issues, etc.

## Troubleshooting

### Server not connecting

1. Check server status: `claude mcp list`
2. Try manually running the server: `npx -y @modelcontextprotocol/server-memory`
3. Restart VSCode to reload the configuration

### Configuration not working

- Ensure [.mcp.json](.mcp.json) is valid JSON
- Check that the package name is correct
- Verify Node.js and npx are installed: `node --version && npx --version`

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Claude Code MCP Guide](https://code.claude.com/docs/en/mcp.md)
