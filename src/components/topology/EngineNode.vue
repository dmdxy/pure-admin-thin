<script setup lang="ts">
/**
 * 引擎图标节点（卡片槽位内容）：服务器图标 + 名称 + IP，按状态着色。
 * 尺寸 120×76 由布局常量 ENGINE_NODE_WIDTH/HEIGHT 约定。
 *
 * fresh=true 表示该引擎数据刚更新：图标外圈播放一次涟漪脉冲，
 * 右上角蓝点标记持续整个新鲜期，过期后随类名移除自动淡出。
 */
import { computed } from "vue";
import ServerIcon from "@/components/icons/ServerIcon.vue";
import { STATUS_META, type EngineInfo } from "@/types/topology";

const props = defineProps<{ engine: EngineInfo; fresh?: boolean }>();
const emit = defineEmits<{ open: [] }>();
const openNode = () => emit("open");

const statusColor = computed(() => STATUS_META[props.engine.status].color);
</script>

<template>
  <div
    class="engine-node"
    role="button"
    tabindex="0"
    :class="{ 'is-fresh': fresh }"
    @click.stop="openNode"
    @keydown.enter.stop="openNode"
  >
    <span class="icon-wrap">
      <ServerIcon :size="38" :color="statusColor" />
      <i class="fresh-dot" />
    </span>
    <span class="name">{{ engine.name }}</span>
    <span v-if="engine.ip" class="ip">{{ engine.ip }}</span>
  </div>
</template>

<style scoped>
.engine-node {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-top: 2px;
}

.icon-wrap {
  position: relative;
  display: block;
  padding: 2px;
  line-height: 0;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.name {
  font-size: 12px;
  line-height: 17px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.ip {
  font-size: 10px;
  line-height: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* —— 数据更新指示：新鲜期内的背景染色、右上角蓝点与一次性涟漪脉冲 —— */
.engine-node.is-fresh .icon-wrap {
  background: color-mix(in srgb, var(--app-accent-container) 72%, transparent);
}

.fresh-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  pointer-events: none;
  background: var(--app-accent-foreground);
  border: 1.5px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 0 4px
    color-mix(in srgb, var(--app-accent-foreground) 60%, transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.engine-node.is-fresh .fresh-dot {
  opacity: 1;
}

.engine-node.is-fresh .icon-wrap::after {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  content: "";
  border: 2px solid
    color-mix(in srgb, var(--app-accent-foreground) 55%, transparent);
  border-radius: 10px;
  animation: fresh-ripple 0.9s ease-out 1 both;
}

@keyframes fresh-ripple {
  from {
    opacity: 1;
    transform: scale(0.9);
  }

  to {
    opacity: 0;
    transform: scale(1.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .engine-node.is-fresh .icon-wrap::after {
    animation: none;
  }
}
</style>
