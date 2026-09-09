import type LogicFlow from "@logicflow/core";
import type { PortDef, WorkflowNodeProperties } from "../../types";
import ControlNode from "../view/ControlNode.vue";
import { controlAnchorId, END_NODE_TYPE, START_NODE_TYPE } from "../nodeTypes";
import { ANCHOR_OUTSET, CONTROL_NODE_SIZE } from "../geometry";
import { registerVueNodeType, WorkflowVueNodeModel } from "./base";

export { controlAnchorId };

function controlTone(type: string) {
  return type === END_NODE_TYPE ? "var(--wf-danger)" : "var(--wf-ok)";
}

class ControlVueNodeModel extends WorkflowVueNodeModel {
  protected nodeSizeHeight(_properties: WorkflowNodeProperties): number {
    return CONTROL_NODE_SIZE;
  }

  protected anchorOffsetY(_index: number, _side: PortDef["side"]): number {
    return CONTROL_NODE_SIZE / 2;
  }

  setAttributes() {
    this.width = CONTROL_NODE_SIZE;
    this.height = CONTROL_NODE_SIZE;
    this.text.editable = false;
    this.text.draggable = false;
    this.text.value = "";
  }

  getDefaultAnchor() {
    const { x, y, width, id } = this;
    const anchorId = controlAnchorId(String(id));
    if (String(this.type) === END_NODE_TYPE) {
      return [
        {
          id: anchorId,
          x: x - width / 2 - ANCHOR_OUTSET,
          y,
          edgeAddable: false
        }
      ];
    }
    return [
      {
        id: anchorId,
        x: x + width / 2 + ANCHOR_OUTSET,
        y
      }
    ];
  }

  getNodeStyle() {
    const style = super.getNodeStyle();
    const tone = controlTone(String(this.type));
    if (this.graphModel.isMiniMap) {
      return {
        ...style,
        fill: `color-mix(in srgb, ${tone} 24%, var(--wf-card))`,
        stroke: tone,
        strokeWidth: 2
      };
    }
    return style;
  }

  getConnectedSourceRules() {
    const rules = super.getConnectedSourceRules();
    if (String(this.type) === END_NODE_TYPE) {
      rules.push({
        message: "结束节点不能连出",
        validate: () => false
      });
    }
    return rules;
  }

  getConnectedTargetRules() {
    const rules = super.getConnectedTargetRules();
    if (String(this.type) === START_NODE_TYPE) {
      rules.push({
        message: "开始节点不能连入",
        validate: () => false
      });
    }
    return rules;
  }
}

export function registerControlNode(lf: LogicFlow, type: string) {
  registerVueNodeType(lf, type, ControlNode, ControlVueNodeModel);
}
