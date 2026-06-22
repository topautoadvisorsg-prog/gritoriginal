import express from "express";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isGroupMember = vi.fn();
const findMany = vi.fn();
const insertValues = vi.fn();

vi.mock("../../server/auth/guards", () => ({
  isAuthenticated: (req: any, _res: any, next: any) => {
    req.user = { id: "user-1", username: "Cody", role: "user", tier: "free" };
    next();
  },
}));

vi.mock("../../server/services/groupService", () => ({
  isGroupMember,
}));

vi.mock("../../server/db", () => ({
  db: {
    query: {
      groupChat: {
        findMany,
      },
    },
    insert: () => ({
      values: insertValues,
    }),
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

async function startGroupsTestServer() {
  const { default: groupsRoutes } = await import("../../server/user/routes/groupsRoutes");
  const app = express();

  app.use(express.json());
  app.use("/api/groups", groupsRoutes);

  const server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start test server");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

describe("groups routes", () => {
  let closeServer: (() => Promise<void>) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    isGroupMember.mockResolvedValue(true);
    insertValues.mockReturnValue({
      returning: () => Promise.resolve([{
        id: "message-1",
        groupId: "group-1",
        userId: "user-1",
        content: "Lets go",
        createdAt: new Date("2026-05-23T00:00:00.000Z"),
      }]),
    });
  });

  afterEach(async () => {
    if (closeServer) {
      await closeServer();
      closeServer = undefined;
    }
  });

  it("loads group chat messages for group members", async () => {
    findMany.mockResolvedValue([
      { id: "newer", content: "second", user: { username: "Cody" } },
      { id: "older", content: "first", user: { username: "Jordan" } },
    ]);

    const server = await startGroupsTestServer();
    closeServer = server.close;

    const response = await fetch(`${server.baseUrl}/api/groups/group-1/chat`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(isGroupMember).toHaveBeenCalledWith("group-1", "user-1");
    expect(findMany).toHaveBeenCalledOnce();
    expect(body.map((message: { id: string }) => message.id)).toEqual(["older", "newer"]);
    expect(body.map((message: { username: string }) => message.username)).toEqual(["Jordan", "Cody"]);
  });

  it("saves trimmed group chat messages for group members", async () => {
    const server = await startGroupsTestServer();
    closeServer = server.close;

    const response = await fetch(`${server.baseUrl}/api/groups/group-1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "  Lets go  " }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(isGroupMember).toHaveBeenCalledWith("group-1", "user-1");
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      groupId: "group-1",
      userId: "user-1",
      content: "Lets go",
    }));
    expect(body).toMatchObject({
      id: "message-1",
      groupId: "group-1",
      userId: "user-1",
      content: "Lets go",
    });
  });

  it("rejects group chat access for non-members", async () => {
    isGroupMember.mockResolvedValue(false);

    const server = await startGroupsTestServer();
    closeServer = server.close;

    const response = await fetch(`${server.baseUrl}/api/groups/group-1/chat`);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: "Access denied" });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns an error when chat history cannot be loaded", async () => {
    findMany.mockRejectedValue(new Error("database unavailable"));

    const server = await startGroupsTestServer();
    closeServer = server.close;

    const response = await fetch(`${server.baseUrl}/api/groups/group-1/chat`);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: "Failed to fetch chat" });
  });

  it("returns an error instead of fabricating a message when persistence fails", async () => {
    insertValues.mockReturnValue({ returning: () => Promise.reject(new Error("write failed")) });

    const server = await startGroupsTestServer();
    closeServer = server.close;

    const response = await fetch(`${server.baseUrl}/api/groups/group-1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "This must persist" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: "Failed to send message" });
  });
});
