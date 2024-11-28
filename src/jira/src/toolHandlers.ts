import { RequestParams, ToolResponse } from './mcp-types.js';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { McpError, ErrorCode, ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Version3Client } from "jira.js";

interface SearchIssuesArgs {
  jql: string;
  maxResults?: number;
  startAt?: number;
}

interface CreateIssueArgs {
  projectKey: string;
  summary: string;
  description?: string;
  issueType: string;
  priority?: string;
  assignee?: string;
}

interface UpdateIssueArgs {
  issueKey: string;
  summary?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  status?: string;
}

interface IssueTransition {
  id?: string;
  name?: string;
}

export class ToolHandlers {
  constructor(private server: Server, private jiraClient: Version3Client) {}

  setupToolHandlers(): void {
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: [
          {
            name: "search_issues",
            description: "Search for Jira issues using JQL",
            inputSchema: {
              type: "object",
              properties: {
                jql: {
                  type: "string",
                  description: "JQL query string"
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return",
                  default: 50
                },
                startAt: {
                  type: "number",
                  description: "Index of the first result to return",
                  default: 0
                }
              },
              required: ["jql"]
            }
          },
          {
            name: "create_issue",
            description: "Create a new Jira issue",
            inputSchema: {
              type: "object",
              properties: {
                projectKey: {
                  type: "string",
                  description: "Project key (e.g., 'PROJ')"
                },
                summary: {
                  type: "string",
                  description: "Issue summary"
                },
                description: {
                  type: "string",
                  description: "Issue description"
                },
                issueType: {
                  type: "string",
                  description: "Issue type (e.g., 'Bug', 'Task')"
                },
                priority: {
                  type: "string",
                  description: "Issue priority"
                },
                assignee: {
                  type: "string",
                  description: "Email address of assignee"
                }
              },
              required: ["projectKey", "summary", "issueType"]
            }
          },
          {
            name: "update_issue",
            description: "Update an existing Jira issue",
            inputSchema: {
              type: "object",
              properties: {
                issueKey: {
                  type: "string",
                  description: "Issue key (e.g., 'PROJ-123')"
                },
                summary: {
                  type: "string",
                  description: "New summary"
                },
                description: {
                  type: "string",
                  description: "New description"
                },
                priority: {
                  type: "string",
                  description: "New priority"
                },
                assignee: {
                  type: "string",
                  description: "New assignee email"
                },
                status: {
                  type: "string",
                  description: "New status"
                }
              },
              required: ["issueKey"]
            }
          }
        ]
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: RequestParams): Promise<ToolResponse> => {
        try {
          switch (request.params.name) {
            case "search_issues": {
              const args = request.params.arguments as SearchIssuesArgs;
              const { jql, maxResults = 50, startAt = 0 } = args;
              const results = await this.jiraClient.issueSearch.searchForIssuesUsingJql({
                jql,
                maxResults,
                startAt
              });
              return {
                content: {
                  mimeType: "application/json",
                  text: JSON.stringify(results.issues, null, 2)
                }
              };
            }

            case "create_issue": {
              const args = request.params.arguments as CreateIssueArgs;
              const { projectKey, summary, description, issueType, priority, assignee } = args;
              const issue = await this.jiraClient.issues.createIssue({
                fields: {
                  project: { key: projectKey },
                  summary,
                  description,
                  issuetype: { name: issueType },
                  ...(priority && { priority: { name: priority } }),
                  ...(assignee && { assignee: { emailAddress: assignee } })
                }
              });
              return {
                content: {
                  mimeType: "application/json",
                  text: JSON.stringify(issue, null, 2)
                }
              };
            }

            case "update_issue": {
              const args = request.params.arguments as UpdateIssueArgs;
              const { issueKey, summary, description, priority, assignee, status } = args;
              const updates: any = {};
              
              if (summary) updates.summary = summary;
              if (description) updates.description = description;
              if (priority) updates.priority = { name: priority };
              if (assignee) updates.assignee = { emailAddress: assignee };
              
              await this.jiraClient.issues.editIssue({
                issueIdOrKey: issueKey,
                fields: updates
              });

              if (status) {
                const transitions = await this.jiraClient.issues.getTransitions({
                  issueIdOrKey: issueKey
                });
                
                if (transitions?.transitions) {
                  const transition = transitions.transitions.find((t) => 
                    t.name?.toLowerCase() === status.toLowerCase()
                  ) as IssueTransition | undefined;

                  if (transition?.id) {
                    await this.jiraClient.issues.doTransition({
                      issueIdOrKey: issueKey,
                      transition: { id: transition.id }
                    });
                  }
                }
              }

              const updatedIssue = await this.jiraClient.issues.getIssue({
                issueIdOrKey: issueKey
              });

              return {
                content: {
                  mimeType: "application/json",
                  text: JSON.stringify(updatedIssue, null, 2)
                }
              };
            }

            default:
              throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
              );
          }
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Jira API error: ${error}`
          );
        }
      }
    );
  }
} 