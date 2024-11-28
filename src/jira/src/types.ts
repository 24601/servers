export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    project: {
      key: string;
      name: string;
    };
  };
}

export interface CreateIssueArgs {
  projectKey: string;
  summary: string;
  description?: string;
  issueType: string;
  priority?: string;
  assignee?: string;
}

export interface SearchIssuesArgs {
  jql: string;
  maxResults?: number;
  startAt?: number;
}

export interface UpdateIssueArgs {
  issueKey: string;
  summary?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  status?: string;
}

export interface ProjectInfo {
  id: string;
  key: string;
  name: string;
  issueTypes: Array<{
    id: string;
    name: string;
    description: string;
  }>;
} 