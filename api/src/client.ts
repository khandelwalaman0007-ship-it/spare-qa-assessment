
const DEFAULT_API_URL = "https://api.producthunt.com/v2/api/graphql";

export interface GraphQLError {
  message?: string;
  error?: string;
  error_description?: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLError[];
}

export interface GraphQLRequestOptions {
  token?: string;
  url?: string;
}

export class GraphQLClient {
  private readonly url: string;
  private readonly token: string;

  constructor(options: GraphQLRequestOptions = {}) {
    this.url =
      options.url ??
      process.env.PRODUCTHUNT_API_URL ??
      DEFAULT_API_URL;

    this.token =
      options.token ??
      process.env.PRODUCTHUNT_ACCESS_TOKEN ??
      "";

    if (!this.url.trim()) {
      throw new Error("GraphQL API URL must not be empty");
    }
  }

  async request<T>(
    query: string,
    variables?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<{
    status: number;
    body: GraphQLResponse<T>;
    headers: Headers;
  }> {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      signal,
    });

    const text = await response.text();

    let body: GraphQLResponse<T>;

    try {
      body = JSON.parse(text) as GraphQLResponse<T>;
    } catch {
      throw new Error(
        `GraphQL API returned non-JSON content (HTTP ${response.status})`,
      );
    }

    return {
      status: response.status,
      body,
      headers: response.headers,
    };
  }
}
