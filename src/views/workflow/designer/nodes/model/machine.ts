import type LogicFlow from "@logicflow/core";
import type { PortDef, WorkflowNodeProperties } from "../../types";
import MachineNode from "../view/MachineNode.vue";
import { headerAnchorY, machineNodeHeight } from "../geometry";
import { registerVueNodeType, WorkflowVueNodeModel } from "./base";

class MachineVueNodeModel extends WorkflowVueNodeModel {
  protected nodeSizeHeight(properties: WorkflowNodeProperties): number {
    return machineNodeHeight(properties);
  }

  protected anchorOffsetY(_index: number, _side: PortDef["side"]): number {
    return headerAnchorY();
  }
}

export function registerMachineNodeType(lf: LogicFlow, type: string) {
  registerVueNodeType(lf, type, MachineNode, MachineVueNodeModel);
}
