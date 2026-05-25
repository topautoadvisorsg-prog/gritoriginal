import { describe, expect, it } from "vitest";

import { registerAIRoutes } from "../../server/ai/aiRoutes";
import { registerAdminDataPipelineRoutes } from "../../server/admin/routes/adminDataPipelineRoutes";
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

  it("registers AI prediction routes", () => {
    const { app, routes } = createAppRouteRecorder();

    registerAIRoutes(app as never);

    expect(routes).toContain("POST /api/ai/predict");
    expect(routes).toContain("GET /api/ai/predictions/:fightId");
    expect(routes).toContain("GET /api/ai/event/:eventId/fights");
    expect(routes).toContain("GET /api/ai/models");
  });
});
