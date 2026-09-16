<script setup lang="ts">
import { PureTag } from "@/components/RePureTag";
import { computed } from "vue";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "PermissionPage"
});

const userStore = useUserStoreHook();
const username = computed(() => userStore.username);
const roles = computed(() => userStore.roles ?? []);
</script>

<template>
  <div
    class="flex flex-col h-full min-h-0 min-w-0 overflow-auto"
    style="gap: var(--pure-page-gap)"
  >
    <p class="mb-0 text-[var(--el-text-color-secondary)]">
      当前角色和权限由后台返回，切换账号请退出后重新登录。
    </p>
    <el-card shadow="never" class="permission-demo-card">
      <template #header>
        <div class="card-header">当前用户：{{ username }}</div>
      </template>
      <el-space>
        <PureTag v-for="role in roles" :key="role">{{ role }}</PureTag>
        <span v-if="!roles.length">暂无角色</span>
      </el-space>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.permission-demo-card {
  width: min(85vw, 100%);
  border-radius: var(--pure-block-radius);
}
</style>
