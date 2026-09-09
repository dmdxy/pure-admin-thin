import type { GraphModel } from "@logicflow/core";
import type { NodeAction } from "../types";

const RUN_MS = 900;
const runTimers = new Map<string, number>();

function clearRunTimer(id: string) {
  const timer = runTimers.get(id);
  if (timer == null) return;
  window.clearTimeout(timer);
  runTimers.delete(id);
}

export function operateWorkflowNode(
  graph: GraphModel,
  id: string,
  action: NodeAction
) {
  const model = graph.getNodeModelById(id);
  if (!model) return;

  if (action === "copy") {
    graph.cloneNode(id);
    return;
  }
  if (action === "delete") {
    clearRunTimer(id);
    graph.deleteNode(id);
    return;
  }
  if (action === "pause") {
    clearRunTimer(id);
    model.setProperty("runStatus", "paused");
    return;
  }

  clearRunTimer(id);
  model.setProperty("runStatus", "running");
  runTimers.set(
    id,
    window.setTimeout(() => {
      runTimers.delete(id);
      const current = graph.getNodeModelById(id);
      if (!current) return;
      current.setProperty("runStatus", "ok");
    }, RUN_MS)
  );
}
