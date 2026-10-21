import { defineRailway, project, service } from "railway/iac";

export const partial = "frontend";

export default defineRailway(() => {
  const frontend = service("frontend", {
    build: "pnpm install --frozen-lockfile && pnpm build",
    start: "node server.js",
    healthcheck: "/health",
  });

  return project("s10-26-equipo-26", { resources: [frontend] });
});
