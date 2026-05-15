import { Router, type IRouter } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";

const router: IRouter = Router();
const specPath = path.resolve(process.cwd(), "lib/api-spec/openapi.yaml");

async function readSpec() {
  return readFile(specPath, "utf8");
}

router.get("/openapi.yaml", async (_req, res): Promise<void> => {
  try {
    const spec = await readSpec();
    res.type("text/yaml").send(spec);
  } catch {
    res.status(404).json({ error: "OpenAPI spec not found" });
  }
});

router.get("/openapi.json", (_req, res): void => {
  res.redirect(307, "/api/openapi.yaml");
});

router.get("/docs", (_req, res): void => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SA School Management API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f8fafc; }
      .topbar {
        align-items: center;
        background: #172b55;
        color: white;
        display: flex;
        gap: 16px;
        justify-content: space-between;
        padding: 14px 22px;
      }
      .topbar a { color: #f5b700; font-weight: 700; text-decoration: none; }
      .swagger-ui .topbar { display: none; }
      #fallback { color: #475569; font-family: system-ui, sans-serif; padding: 16px 22px; }
    </style>
  </head>
  <body>
    <header class="topbar">
      <strong>SA School Management API</strong>
      <a href="/api/openapi.yaml">OpenAPI YAML</a>
    </header>
    <div id="swagger-ui"></div>
    <p id="fallback">Loading Swagger UI. If it does not load, open the OpenAPI YAML link above.</p>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        if (!window.SwaggerUIBundle) return;
        document.getElementById("fallback").style.display = "none";
        window.SwaggerUIBundle({
          url: "/api/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          persistAuthorization: true,
          tryItOutEnabled: true,
        });
      };
    </script>
  </body>
</html>`);
});

export default router;
