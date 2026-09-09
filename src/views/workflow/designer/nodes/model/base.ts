import { HtmlNodeModel, h, type Model } from "@logicflow/core";
import type LogicFlow from "@logicflow/core";
import { register, VueNodeView } from "@logicflow/vue-node-registry";
import type { Component } from "vue";
import type { PortDef, WorkflowNodeProperties } from "../../types";
import {
  ANCHOR_HOVER_R,
  ANCHOR_OUTSET,
  ANCHOR_R,
  NODE_WIDTH,
  nodeStyleSize,
  portsOf,
  typedNodeHeight,
  typedPortY
} from "../geometry";
import { findPortByAnchor, portAnchorId } from "../ports";

export class WorkflowVueNodeView extends VueNodeView {
  getAnchorShape(anchorData?: Model.AnchorConfig) {
    if (!anchorData) return null;
    const style = this.props.model.getAnchorStyle(anchorData);
    const { hover, ...baseStyle } = style;
    return h("g", {}, [
      h("circle", {
        ...baseStyle,
        ...hover,
        className: "lf-basic-shape lf-node-anchor-hover",
        cx: anchorData.x,
        cy: anchorData.y
      }),
      h("circle", {
        ...baseStyle,
        className: "lf-basic-shape lf-node-anchor",
        cx: anchorData.x,
        cy: anchorData.y
      }),
      h(
        "text",
        {
          className: "gc-wf-anchor-plus",
          x: anchorData.x,
          y: anchorData.y,
          "aria-hidden": "true"
        },
        "+"
      )
    ]);
  }

  setHtml(rootEl: SVGForeignObjectElement) {
    if (!this.props.graphModel.isMiniMap) super.setHtml(rootEl);
  }
}

export class WorkflowVueNodeModel extends HtmlNodeModel {
  protected nodeSizeHeight(properties: WorkflowNodeProperties): number {
    return Math.max(
      typedNodeHeight(properties),
      nodeStyleSize(properties).height ?? 0
    );
  }

  protected anchorOffsetY(index: number, _side: PortDef["side"]): number {
    return typedPortY(index);
  }

  getData() {
    return { ...super.getData(), width: this.width, height: this.height };
  }

  setAttributes() {
    const p = this.properties as WorkflowNodeProperties;
    this.width = nodeStyleSize(p).width ?? NODE_WIDTH;
    this.height = this.nodeSizeHeight(p);
    this.text.editable = false;
    this.text.draggable = false;
    this.text.value = "";
  }

  getNodeStyle() {
    const style = super.getNodeStyle();
    if (this.graphModel.isMiniMap) {
      return {
        ...style,
        fill: "color-mix(in srgb, var(--wf-primary) 24%, var(--wf-card))",
        stroke: "var(--wf-primary)",
        strokeWidth: 2
      };
    }
    style.fill = "transparent";
    style.stroke = "transparent";
    style.strokeWidth = 0;
    style.overflow = "visible";
    return style;
  }

  getOutlineStyle() {
    const style = super.getOutlineStyle();
    style.stroke = "transparent";
    style.strokeWidth = 0;
    style.strokeDasharray = "0";
    if (style.hover) {
      style.hover.stroke = "transparent";
      style.hover.strokeWidth = 0;
    }
    return style;
  }

  getDefaultAnchor() {
    const { x, y, width, height } = this;
    const p = this.properties as WorkflowNodeProperties;
    const ins = portsOf(p, "in");
    const outs = portsOf(p, "out");
    const anchors: {
      id: string;
      x: number;
      y: number;
      edgeAddable?: boolean;
    }[] = [];

    ins.forEach((port, index) => {
      anchors.push({
        id: portAnchorId(port),
        x: x - width / 2 - ANCHOR_OUTSET,
        y: y - height / 2 + this.anchorOffsetY(index, "in"),
        edgeAddable: false
      });
    });
    outs.forEach((port, index) => {
      anchors.push({
        id: portAnchorId(port),
        x: x + width / 2 + ANCHOR_OUTSET,
        y: y - height / 2 + this.anchorOffsetY(index, "out")
      });
    });
    return anchors;
  }

  getAnchorStyle() {
    return {
      r: ANCHOR_R,
      fill: "var(--wf-anchor)",
      stroke: "var(--wf-anchor-stroke)",
      strokeWidth: 2,
      cursor: "crosshair",
      hover: {
        r: ANCHOR_HOVER_R,
        fill: "#ffffff",
        stroke: "var(--wf-anchor-hover)",
        strokeWidth: 2
      }
    };
  }

  getConnectedSourceRules() {
    const rules = super.getConnectedSourceRules();
    rules.push({
      message: "端口数据类型不匹配",
      validate: (_source, target, sourceAnchor, targetAnchor) => {
        if (!sourceAnchor?.id || !targetAnchor?.id || !target) return true;
        const srcPort = findPortByAnchor(
          portsOf(this.properties as WorkflowNodeProperties, "out"),
          "out",
          sourceAnchor.id
        );
        const tgtPort = findPortByAnchor(
          ((target.properties as WorkflowNodeProperties).inputs ??
            []) as PortDef[],
          "in",
          targetAnchor.id
        );
        if (!srcPort || !tgtPort) return true;
        if (srcPort.dataType === "any" || tgtPort.dataType === "any")
          return true;
        return srcPort.dataType === tgtPort.dataType;
      }
    });
    return rules;
  }
}

export function registerVueNodeType(
  lf: LogicFlow,
  type: string,
  component: Component,
  model: typeof WorkflowVueNodeModel = WorkflowVueNodeModel
) {
  register(
    {
      type,
      component,
      view: WorkflowVueNodeView,
      model
    },
    lf
  );
}
