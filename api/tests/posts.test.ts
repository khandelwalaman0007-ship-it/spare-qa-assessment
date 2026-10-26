import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dir, "../../.env") });

import { describe, expect, test } from "bun:test";
import { GraphQLClient } from "../src/client";

const API_URL =
  process.env.PRODUCTHUNT_API_URL ??
  "https://api.producthunt.com/v2/api/graphql";

const token = process.env.PRODUCTHUNT_ACCESS_TOKEN;

const client = new GraphQLClient();

const POSTS_QUERY = `
  query GetPosts($count: Int!) {
    posts(first: $count) {
      edges {
        cursor
        node {
          id
          name
          tagline
          url
          createdAt
          votesCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const POST_BY_ID_QUERY = `
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      name
      tagline
      url
      createdAt
      votesCount
    }
  }
`;

const INVALID_FIELD_QUERY = `
  query {
    posts(first: 1) {
      edges {
        node {
          definitelyNotARealField
        }
      }
    }
  }
`;

type Post = {
  id: string;
  name: string;
  tagline: string | null;
  url: string | null;
  createdAt: string | null;
  votesCount: number;
};

type PostsData = {
  posts: {
    edges: Array<{
      cursor: string;
      node: Post;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type PostData = {
  post: Post | null;
};

function requireToken(): string {
  if (!token) {
    throw new Error(
      "PRODUCTHUNT_ACCESS_TOKEN is required for authenticated API tests",
    );
  }

  return token;
}

describe("Product Hunt GraphQL API", () => {
  test("1. accepts a valid token and returns posts", async () => {
    requireToken();

    const response = await client.request<PostsData>(POSTS_QUERY, {
      count: 2,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data?.posts.edges.length).toBeGreaterThan(0);
  });

  test("2. rejects a request without a token", async () => {
    const unauthenticatedClient = new GraphQLClient({
      url: API_URL,
      token: "",
    });

    const response =
      await unauthenticatedClient.request<PostsData>(POSTS_QUERY, {
        count: 1,
      });

    expect(response.status).toBe(401);
    expect(
      response.body.errors?.some(
        (error) => "error" in error && error.error === "invalid_oauth_token",
      ),
    ).toBe(true);
  });

  test("3. rejects an invalid token", async () => {
    const invalidTokenClient = new GraphQLClient({
      url: API_URL,
      token: "invalid-test-token-12345",
    });

    const response =
      await invalidTokenClient.request<PostsData>(POSTS_QUERY, {
        count: 1,
      });

    expect(response.status).toBe(401);
    expect(
      response.body.errors?.some(
        (error) => "error" in error && error.error === "invalid_oauth_token",
      ),
    ).toBe(true);
  });

  test("4. returns posts with valid field types", async () => {
    requireToken();

    const response = await client.request<PostsData>(POSTS_QUERY, {
      count: 5,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const edges = response.body.data?.posts.edges;
    expect(edges).toBeDefined();
    expect(edges!.length).toBeGreaterThan(0);

    for (const { node } of edges!) {
      expect(node.id).toMatch(/^\d+$/);
      expect(node.name.length).toBeGreaterThan(0);
      expect(
        node.tagline === null || typeof node.tagline === "string",
      ).toBe(true);
      expect(
        node.url === null ||
          (typeof node.url === "string" &&
            URL.canParse(node.url) &&
            new URL(node.url).protocol === "https:"),
      ).toBe(true);
      expect(
        node.createdAt === null ||
          (typeof node.createdAt === "string" &&
            !Number.isNaN(Date.parse(node.createdAt))),
      ).toBe(true);
      expect(Number.isInteger(node.votesCount)).toBe(true);
      expect(node.votesCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("5. single-post lookup matches the list result", async () => {
    requireToken();

    const listResponse = await client.request<PostsData>(POSTS_QUERY, {
      count: 1,
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.errors).toBeUndefined();

    const listedPost = listResponse.body.data?.posts.edges[0]?.node;
    expect(listedPost).toBeDefined();

    const detailResponse = await client.request<PostData>(POST_BY_ID_QUERY, {
      id: listedPost!.id,
    });

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.errors).toBeUndefined();
    expect(detailResponse.body.data?.post).toMatchObject({
      id: listedPost!.id,
      name: listedPost!.name,
      tagline: listedPost!.tagline,
      url: listedPost!.url,
      createdAt: listedPost!.createdAt,
      votesCount: listedPost!.votesCount,
    });
  });

  test("6. returns null for a nonexistent post", async () => {
    requireToken();

    const response = await client.request<PostData>(POST_BY_ID_QUERY, {
      id: "999999999999999999",
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data?.post).toBeNull();
  });

  test("7. paginates with advancing cursors and no overlap", async () => {
    requireToken();

    const firstPage = await client.request<PostsData>(POSTS_QUERY, {
      count: 3,
    });

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.errors).toBeUndefined();

    const firstData = firstPage.body.data!.posts;
    expect(firstData.edges.length).toBeGreaterThan(0);
    expect(firstData.pageInfo.endCursor).toBe(
      firstData.edges[firstData.edges.length - 1]!.cursor,
    );

    if (!firstData.pageInfo.hasNextPage) {
      return;
    }

    const secondPage = await client.request<PostsData>(
      `
        query GetNextPosts($count: Int!, $after: String!) {
          posts(first: $count, after: $after) {
            edges {
              cursor
              node {
                id
                name
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      {
        count: 3,
        after: firstData.pageInfo.endCursor,
      },
    );

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.errors).toBeUndefined();

    const secondData = secondPage.body.data!.posts;
    const firstIds = new Set(
      firstData.edges.map(({ node }) => node.id),
    );

    for (const { node } of secondData.edges) {
      expect(firstIds.has(node.id)).toBe(false);
    }

    if (secondData.edges.length > 0) {
      expect(secondData.pageInfo.endCursor).toBe(
        secondData.edges[secondData.edges.length - 1]!.cursor,
      );
    }
  });

  test("8. rejects an unknown GraphQL field", async () => {
    requireToken();

    const response = await client.request<unknown>(INVALID_FIELD_QUERY);

    expect(response.status).toBe(200);
    expect(response.body.errors?.length).toBeGreaterThan(0);
    expect(
      response.body.errors?.some(
        (error) =>
          error.extensions?.code === "undefinedField" &&
          error.message?.includes("definitelyNotARealField"),
      ),
    ).toBe(true);
  });
});
