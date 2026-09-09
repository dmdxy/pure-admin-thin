import type LogicFlow from "@logicflow/core";
import type { PortDef, WorkflowNodeProperties } from "../../types";
import PluginNode from "../view/PluginNode.vue";
import {
  ANCHOR_OUTSET,
  HEADER_NODE_HEIGHT,
  NODE_WIDTH,
  headerAnchorY,
  nodeHeight,
  nodeStyleSize,
  portY
} from "../geometry";
import {
  applyResolvedPorts,
  findPortByAnchor,
  portAnchorId,
  resolveNodePorts
} from "../ports";
import { registerVueNodeType, WorkflowVueNodeModel } from "./base";

class PluginVueNodeModel extends WorkflowVueNodeModel {
  private resolved() {
    return resolveNodePorts(this.properties as WorkflowNodeProperties, {
      fillMissingSide: true
    });
  }

  protected nodeSizeHeight(properties: WorkflowNodeProperties): number {
    const resolved = resolveNodePorts(properties, { fillMissingSide: true });
    if (resolved.usesDefaultFlowAnchors) {
      return Math.max(
        HEADER_NODE_HEIGHT,
        nodeStyleSize(properties).height ?? 0
      );
    }
    return Math.max(
      nodeHeight(applyResolvedPorts(properties, { fillMissingSide: true })),
      nodeStyleSize(properties).height ?? 0
    );
  }

  protected anchorOffsetY(index: number, side: PortDef["side"]): number {
    const resolved = this.resolved();
    const atHeader = side === "in" ? resolved.inAtHeader : resolved.outAtHeader;
    if (atHeader) return headerAnchorY();
    return portY(index);
  }

  setAttributes() {
    const p = applyResolvedPorts(this.properties as WorkflowNodeProperties, {
      fillMissingSide: true
    });
    this.width = nodeStyleSize(p).width ?? NODE_WIDTH;
    this.height = this.nodeSizeHeight(p);
    this.text.editable = false;
    this.text.draggable = false;
    this.text.value = "";
  }

  getDefaultAnchor() {
    const { x, y, width, height } = this;
    const resolved = this.resolved();
    const anchors: {
      id: string;
      x: number;
      y: number;
      edgeAddable?: boolean;
    }[] = [];

    resolved.inputs.forEach((port, index) => {
      anchors.push({
        id: portAnchorId(port),
        x: x - width / 2 - ANCHOR_OUTSET,
        y: y - height / 2 + this.anchorOffsetY(index, "in"),
        edgeAddable: false
      });
    });
    resolved.outputs.forEach((port, index) => {
      anchors.push({
        id: portAnchorId(port),
        x: x + width / 2 + ANCHOR_OUTSET,
        y: y - height / 2 + this.anchorOffsetY(index, "out")
      });
    });
    return anchors;
  }

  getConnectedSourceRules() {
    const rules = super.getConnectedSourceRules();
    rules.push({
      message: "端口数据类型不匹配",
      validate: (_source, target, sourceAnchor, targetAnchor) => {
        if (!sourceAnchor?.id || !targetAnchor?.id || !target) return true;
        const src = findPortByAnchor(
          resolveNodePorts(this.properties as WorkflowNodeProperties, {
            fillMissingSide: true
          }).outputs,
          "out",
          sourceAnchor.id
        );
        const tgt = findPortByAnchor(
          resolveNodePorts(target.properties as WorkflowNodeProperties, {
            fillMissingSide: true
          }).inputs,
          "in",
          targetAnchor.id
        );
        if (!src || !tgt) return true;
        if (src.dataType === "any" || tgt.dataType === "any") return true;
        return src.dataType === tgt.dataType;
      }
    });
    return rules;
  }
}

export function registerPluginNodeType(lf: LogicFlow, type: string) {
  registerVueNodeType(lf, type, PluginNode, PluginVueNodeModel);
}
