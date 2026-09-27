# Meals 2.0 web client (apps/web) container image.
#
# BUILD CONTEXT MUST BE THE WORKSPACE ROOT (the `meals/` directory), not this
# folder and not the meals_client repo root. Reason: apps/web depends on
#   "@elliotJHarding/meals-api": "file:../../../meals_model/build/typescript-package"
# which resolves to meals_model — a SIBLING of meals_client, outside the client
# repo. The build therefore needs both meals_client/ and meals_model/ present.
# It also depends on the workspace package "@meals_client/core" (packages/core),
# which npm links from the monorepo workspaces, so the whole meals_client repo
# must be copied in, not just apps/web.
#
# Build (from the meals/ workspace root):
#   docker build -t grubplanner.co.uk:32000/meals_client_web \
#     -f meals_client/apps/web/Dockerfile .
#
# Unlike the v1 client, NO NPM_TOKEN / GitHub npm registry is needed: the v2
# monorepo consumes the contract via a local file: dependency, not the
# @elliotJHarding npm registry.

# ---- build stage ----
FROM --platform=linux/amd64 node:23.4 AS build
WORKDIR /workspace

# The contract package (prebuilt dist/ is committed under build/). Copied first
# so the file: dependency resolves. Path mirrors the sibling layout on disk.
COPY meals_model/build/typescript-package ./meals_model/build/typescript-package

# The client monorepo: root manifest + lockfile, the shared core package, and
# the web app. node_modules / dist are excluded by .dockerignore.
COPY meals_client/package.json meals_client/package-lock.json ./meals_client/
COPY meals_client/packages/core ./meals_client/packages/core
COPY meals_client/apps/web ./meals_client/apps/web

WORKDIR /workspace/meals_client

# Install the whole workspace so the file: dep and the @meals_client/core
# workspace symlink are both wired up. apps/native is not copied in, so npm
# only resolves the web + core subtree.
#
# --ignore-scripts is REQUIRED: the contract package (@elliotJHarding/meals-api)
# declares "prepare": "npm run build" (= tsc && tsc -p tsconfig.esm.json), which
# npm runs when installing the file: dependency. That install omits the contract's
# own devDependencies, so tsc is not on PATH and the build dies with exit 127.
# The contract's dist/ is already committed
# (built upstream by `gradlew prepareTypeScriptPackage`), so there is nothing to
# rebuild — skipping lifecycle scripts is both correct and necessary.
RUN npm install --workspaces --include-workspace-root --ignore-scripts

# Vite inlines import.meta.env at build time, so the API base and OAuth client
# id are build-time args, not runtime env. Default base is the same-origin /api
# path that the cluster ingress routes to the meals server service.
ARG VITE_REPOSITORY_URL=/api
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_REPOSITORY_URL=$VITE_REPOSITORY_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build -w @meals_client/web

# ---- serve stage ----
# Mirrors the v1 meals_web_client container: `serve -s dist` on port 3000 with
# SPA fallback to index.html (serve -s = single-page-app mode). The cluster
# service/probes target 3000, matching v1.
FROM --platform=linux/amd64 node:23.4 AS serve
WORKDIR /app

RUN npm i -g serve

COPY --from=build /workspace/meals_client/apps/web/dist ./dist

EXPOSE 3000

CMD [ "serve", "-s", "dist", "-l", "3000" ]
