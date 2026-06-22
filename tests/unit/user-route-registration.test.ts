import { describe, expect, it } from "vitest";

import { registerAIRoutes } from "../../server/ai/aiRoutes";
import {
  isSensitivePipelineConfigKey,
  registerAdminDataPipelineRoutes,
  serializePipelineConfigValue,
} from "../../server/admin/routes/adminDataPipelineRoutes";
import { registerAdminNewsRoutes } from "../../server/admin/routes/adminNewsRoutes";
import { registerActivityFeedRoutes } from "../../server/user/routes/activityFeedRoutes";
import { registerFighterRoutes } from "../../server/user/routes/fighterRoutes";
import { registerPicksDistributionRoutes } from "../../server/user/routes/picksDistributionRoutes";

function createAppUseRecorder() {
  const mountedPaths: string[] = [];

  return {
    app: {
      use(path: string) {
        mountedPaths.push(path);
      },
    },
    mountedPaths,
  };
}

function createAppRouteRecorder() {
  const routes: string[] = [];
  const app = {
    get(path: string) {
      routes.push(`GET ${path}`);
    },
    post(path: string) {
      routes.push(`POST ${path}`);
    },
    patch(path: string) {
      routes.push(`PATCH ${path}`);
    },
    put(path: string) {
      routes.push(`PUT ${path}`);
    },
    delete(path: string) {
      routes.push(`DELETE ${path}`);
    },
  };

  return { app, routes };
}

describe("user route registration", () => {
  it("mounts pick distribution routes under /api/picks", () => {
    const { app, mountedPaths } = createAppUseRecorder();

    registerPicksDistributionRoutes(app as never);

    expect(mountedPaths).toContain("/api/picks");
  });

  it("mounts activity feed routes under /api/activity", () => {
    const { app, mountedPaths } = createAppUseRecorder();

    registerActivityFeedRoutes(app as never);

    expect(mountedPaths).toContain("/api/activity");
  });

  it("registers fighter routes including unlinked fights and corrections", () => {
    const { app, routes } = createAppRouteRecorder();

    registerFighterRoutes(app as never);

    expect(routes).toContain("GET /api/fights/unlinked");
    expect(routes).toContain("POST /api/fighters/:id/corrections");
  });

  it("registers admin pipeline health before dynamic status route", () => {
    const { app, routes } = createAppRouteRecorder();

    registerAdminDataPipelineRoutes(app as never);

    expect(routes.indexOf("GET /api/admin/pipeline/health"))
      .toBeLessThan(routes.indexOf("GET /api/admin/pipeline/:status"));
  });

  it("classifies secret pipeline configuration as write-only", () => {
    expect(isSensitivePipelineConfigKey("ANTHROPIC_API_KEY")).toBe(true);
    expect(isSensitivePipelineConfigKey("WEBHOOK_SECRET")).toBe(true);
    expect(isSensitivePipelineConfigKey("ACCESS_TOKEN")).toBe(true);
    expect(isSensitivePipelineConfigKey("SUPABASE_URL")).toBe(false);
    expect(isSensitivePipelineConfigKey("DATA_ENGINE_AUTO_APPLY")).toBe(false);
    expect(serializePipelineConfigValue("ANTHROPIC_API_KEY", "do-not-leak"))
      .toEqual({ key: "ANTHROPIC_API_KEY", value: "", configured: true });
    expect(serializePipelineConfigValue("SUPABASE_URL", "https://example.test"))
      .toEqual({ key: "SUPABASE_URL", value: "https://example.test", configured: true });
  });

  it("registers AI prediction routes", () => {
    const { app, routes } = createAppRouteRecorder();

    registerAIRoutes(app as never);

    expect(routes).toContain("POST /api/ai/predict");
    expect(routes).toContain("GET /api/ai/predictions/:fightId");
    expect(routes).toContain("GET /api/ai/event/:eventId/fights");
    expect(routes).toContain("GET /api/ai/models");
  });

  it("registers admin news CRUD under the admin namespace", () => {
    const { app, routes } = createAppRouteRecorder();
    registerAdminNewsRoutes(app as never);

    expect(routes).toContain("GET /api/admin/news");
    expect(routes).toContain("POST /api/admin/news");
    expect(routes).toContain("PUT /api/admin/news/:id");
    expect(routes).toContain("DELETE /api/admin/news/:id");
  });
});
