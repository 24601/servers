#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { Version3Client } from "jira.js";
import { JiraIssue, CreateIssueArgs, UpdateIssueArgs, SearchIssuesArgs } from "./types.js";
import { ResourceHandlers } from "./resourceHandlers.js";
import { ToolHandlers } from "./toolHandlers.js";

class JiraServer {
  private server: Server;
  private jiraClient: Version3Client;
  private resourceHandlers: ResourceHandlers;
  private toolHandlers: ToolHandlers;

  constructor() {
    // Validate environment variables
    const host = process.env.JIRA_HOST;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!host || !email || !apiToken) {
      throw new Error("Missing required environment variables: JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN");
    }

    // Initialize Jira client
    this.jiraClient = new Version3Client({
      host,
      authentication: {
        basic: {
          email,
          apiToken,
        },
      },
    });

    // Initialize MCP server
    this.server = new Server({
      name: "jira-server",
      version: "1.0.0"
    }, {
      capabilities: {
        resources: {},
        tools: {}
      }
    });

    this.resourceHandlers = new ResourceHandlers(this.server, this.jiraClient);
    this.toolHandlers = new ToolHandlers(this.server, this.jiraClient);

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error: Error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.resourceHandlers.setupResourceHandlers();
    this.toolHandlers.setupToolHandlers();
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Jira MCP server running on stdio");
  }
}

// Start the server
const server = new JiraServer();
server.run().catch(console.error);
