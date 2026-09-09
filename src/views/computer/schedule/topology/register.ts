import { HtmlNodeModel } from "@logicflow/core";
import type LogicFlow from "@logicflow/core";
import { register } from "@logicflow/vue-node-registry";
import TopoNode from "./TopoNode.vue";
import {
  ENGINE_NODE,
  ENGINE_SIZE,
  SCHEDULE_NODE,
  SCHEDULE_SIZE
} from "./types";
import type { TopoNodeProperties } from "./types";

class TopoNodeModel extends HtmlNodeModel {
  setProperties(properties: Record<string, unknown>) {
    const keys = Object.keys(properties);

    // VueNodeView measures with getBoundingClientRect(), whose result includes
    // the graph zoom. Topology cards have fixed model sizes, so accepting that
    // automatic size-only update would repeatedly shrink or enlarge the node.
    if (
      keys.length > 0 &&
      keys.every(key => key === "width" || key === "height")
    ) {
      return;
    }

    const kind = properties.kind ?? this.properties.kind;
    const size = kind === "engine" ? ENGINE_SIZE : SCHEDULE_SIZE;
    super.setProperties({ ...properties, ...size });
  }

  setAttributes() {
    const properties = this.properties as unknown as TopoNodeProperties;
    const fallback = properties.kind === "engine" ? ENGINE_SIZE : SCHEDULE_SIZE;
    this.width = properties.width ?? fallback.width;
    this.height = properties.height ?? fallback.height;
    this.text.editable = false;
    this.text.draggable = false;
    this.text.value = "";
  }

  getDefaultAnchor() {
    const { x, y, width, height, id } = this;
    return [
      { x, y: y - height / 2, id: `${id}_top` },
      { x: x + width / 2, y, id: `${id}_right` },
      { x, y: y + height / 2, id: `${id}_bottom` },
      { x: x - width / 2, y, id: `${id}_left` }
    ];
  }

  getNodeStyle() {
    const style = super.getNodeStyle();
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
    if (style.hover) {
      style.hover.stroke = "transparent";
      style.hover.strokeWidth = 0;
    }
    return style;
  }
}

export function registerTopoNodes(lf: LogicFlow) {
  const config = {
    component: TopoNode,
    model: TopoNodeModel
  };
  register({ type: SCHEDULE_NODE, ...config }, lf);
  register({ type: ENGINE_NODE, ...config }, lf);
}
