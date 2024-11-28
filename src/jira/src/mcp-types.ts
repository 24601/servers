import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface RequestParams<T = unknown> {
  params: {
    uri?: string;
    name?: string;
    arguments?: T;
  };
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

export interface ToolContent {
  mimeType: string;
  text: string;
}

export interface ResourceResponse {
  _meta?: {
    progressToken?: string | number;
  };
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}

export interface ToolResponse {
  _meta?: {
    progressToken?: string | number;
  };
  content: {
    mimeType: string;
    text: string;
  };
} 