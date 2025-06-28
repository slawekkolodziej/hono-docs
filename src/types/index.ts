import type { Project } from "ts-morph";
import { OpenAPIV3 } from "openapi-types";

export type OpenAPIConfig = Omit<
  OpenAPIV3.Document,
  "paths" | "components" | "tags"
>;

export type Api = {
  api: string; // /devices/d/{deviceId} (do not include prefix)
  summary?: string;
  description?: string;
  tag?: string[];
  method: "get" | "post" | "put" | "patch" | "delete";
};

export type ApiGroup = {
  apiPrefix: string;
  appTypePath: string;
  name: string;
  api?: Api[];
};

export type HonoDocsConfig = {
  tsConfigPath: string;

  openApi: OpenAPIConfig;
  outputs: {
    // apisTypesDir: string;
    // apisOpenApiDir: string;
    openApiJson: string;
  };
  apis: ApiGroup[];
  preDefineTypeContent?: string;
};

export type AppTypeSnapshotPath = {
  appTypePath: string;
  name: string;
};

export type OpenApiPath = { openApiPath: string };

export type GenerateParams = {
  config: HonoDocsConfig;
  libDir: string;
  project: Project;
  rootPath: string;
  fileName: string;
  outputRoot: string;
};
