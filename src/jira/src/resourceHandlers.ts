import { RequestParams, ResourceResponse } from './mcp-types';

private setupResourceHandlers(): void {
  this.server.setRequestHandler(
    ListResourcesRequestSchema,
    async () => {
      try {
        const projects = await this.jiraClient?.projects.getAllProjects();
        if (!projects) {
          throw new McpError(ErrorCode.InternalError, "Failed to fetch projects");
        }
        
        return {
          resources: projects.map((project: any) => ({
            uri: `jira://${project.key}/issues`,
            name: `Issues in ${project.name}`,
            mimeType: "application/json",
            description: `All issues in the ${project.name} project`
          }))
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list Jira projects: ${error}`
        );
      }
    }
  );

  this.server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: RequestParams): Promise<ResourceResponse> => {
      try {
        const uri = request.params.uri;
        const match = uri?.match(/^jira:\/\/([^/]+)\/issues$/);
        
        if (!match) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Invalid Jira resource URI: ${uri}`
          );
        }

        const projectKey = match[1];
        const issues = await this.jiraClient?.issueSearch.searchForIssuesUsingJql({
          jql: `project = ${projectKey} ORDER BY created DESC`,
          maxResults: 50
        });

        if (!issues) {
          throw new McpError(ErrorCode.InternalError, "Failed to fetch issues");
        }

        return {
          contents: [{
            uri: request.params.uri || "",
            mimeType: "application/json",
            text: JSON.stringify(issues.issues, null, 2)
          }]
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read Jira resource: ${error}`
        );
      }
    }
  );
} 