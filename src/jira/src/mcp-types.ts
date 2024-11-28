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
  contents: ResourceContent[];
}

export interface ToolResponse {
  content: ToolContent;
} 