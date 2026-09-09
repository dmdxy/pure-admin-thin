import type LogicFlow from "@logicflow/core";
import type { LibraryCategory } from "../designer/types";
import type {
  WorkflowContext,
  WorkflowDomain,
  WorkflowResource
} from "../utils/workflowRoute";

export interface WorkflowMetadata {
  name: string;
  version: string;
  status: string;
  description: string;
  owner?: string;
  customer?: string;
  priority?: number;
  schedulerIp?: string;
  managerUid?: number;
  personUid?: number;
  projectId?: number;
}

export interface WorkflowCatalogSummary {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface InstanceParameterOverride {
  nodeId: string;
  uniqueKey: string;
  value: unknown;
}

export interface WorkflowDocument {
  id?: string;
  context: WorkflowContext;
  metadata: WorkflowMetadata;
  source?: { id: string; version: string };
  graph: LogicFlow.GraphConfigData;
  parameterOverrides: InstanceParameterOverride[];
}

export interface WorkflowJob {
  id: string;
  nodeId?: string;
  name: string;
  status: string;
  startedAt?: string;
  duration?: string;
}

export interface WorkflowRuntimeLog {
  id: string;
  nodeId?: string;
  time: string;
  level: "INFO" | "OK" | "WARN" | "ERROR";
  message: string;
}

export interface WorkflowRuntimeAction {
  key: string;
  label: string;
  type: "primary" | "success" | "warning" | "danger" | "info";
  visibleStatuses: string[];
  run: (id: number) => Promise<unknown>;
}

export interface WorkflowAdapter {
  domain: WorkflowDomain;
  resource: WorkflowResource;
  load?: (id: string) => Promise<WorkflowDocument | null>;
  create?: (document: WorkflowDocument) => Promise<unknown>;
  update?: (document: WorkflowDocument) => Promise<unknown>;
  listCatalogs?: () => Promise<WorkflowCatalogSummary[]>;
  listLibrary?: () => Promise<LibraryCategory[]>;
  loadJobs?: (id: string) => Promise<WorkflowJob[]>;
  loadLogs?: (id: string) => Promise<WorkflowRuntimeLog[]>;
  runtimeActions?: WorkflowRuntimeAction[];
}
