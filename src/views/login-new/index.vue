<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useEventListener } from "@vueuse/core";
import { debounce } from "@pureadmin/utils";
import type { FormInstance } from "element-plus";
import { getConfig } from "@/config";
import { message } from "@/utils/message";
import { $t, transformI18n } from "@/plugins/i18n";
import { useNav } from "@/layout/hooks/useNav";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { initRouter, getTopMenu } from "@/router/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { loginRules } from "@/views/login/utils/rule";
import TerrainBackground from "./components/TerrainBackground.vue";
import { getTerrainPalette, paletteToCssVars } from "./utils/terrainTheme";

import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import SunLine from "~icons/ri/sun-line";
import MoonLine from "~icons/ri/moon-line";

defineOptions({
  name: "LoginNew"
});

const router = useRouter();
const { t } = useI18n();
const { title, getLogo } = useNav();
const { initStorage } = useLayout();
initStorage();

const userStore = useUserStoreHook();
const epThemeStore = useEpThemeStoreHook();
const { dataTheme, dataThemeChange } = useDataThemeChange();

const loading = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();
const copyrightYear = new Date().getFullYear();
const version = getConfig().Version;

const ruleForm = reactive({
  username: "admin",
  password: "admin123",
  remember: userStore.isRemembered
});

// 计算当前系统主色和暗黑模式
const currentPrimaryColor = computed(() => {
  return epThemeStore.getEpThemeColor || "#034EA2";
});

const isDark = computed(() => {
  return Boolean(dataTheme.value);
});

// 动态计算与当前系统主题适配的山体等高线 CSS 变量
const terrainCssVars = computed(() => {
  const palette = getTerrainPalette(currentPrimaryColor.value, isDark.value);
  return paletteToCssVars(palette);
});

// 切换暗黑模式
const toggleDarkMode = () => {
  dataTheme.value = !dataTheme.value;
  dataThemeChange();
};

// 快速填充测试凭证
const fillDemoCredentials = () => {
  ruleForm.username = "admin";
  ruleForm.password = "admin123";
  message("已填入开发测试凭据", { type: "info" });
};

// 登录提交
const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      userStore.SET_ISREMEMBERED(ruleForm.remember);
      userStore
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          if (res.success) {
            return initRouter().then(() => {
              disabled.value = true;
              return router
                .push(getTopMenu(true).path)
                .then(() => {
                  message(t("login.pureLoginSuccess"), { type: "success" });
                })
                .finally(() => (disabled.value = false));
            });
          } else {
            message(t("login.pureLoginFail"), { type: "error" });
          }
        })
        .catch(error => {
          userStore.logOut();
          message(
            error?.response?.data?.message ||
              error?.message ||
              t("login.pureLoginFail"),
            { type: "error" }
          );
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  ) {
    immediateDebounce(ruleFormRef.value);
  }
});
</script>

<template>
  <div class="terrain-login" :class="{ 'is-dark': isDark }">
    <!-- 左侧：品牌与等高线视觉区 -->
    <section class="terrain-login__visual" :style="terrainCssVars">
      <!-- 矢量山体背景 -->
      <div class="terrain-login__svg-wrapper">
        <TerrainBackground />
      </div>

      <!-- 科技光晕与微网格质感 -->
      <div class="terrain-login__scrim" />

      <!-- 品牌内容层 -->
      <div class="terrain-login__brand-container">
        <!-- 顶部品牌 Logo -->
        <header class="terrain-login__brand-header">
          <div class="terrain-login__logo-badge">
            <img class="terrain-login__logo" :src="getLogo()" alt="Logo" />
          </div>
          <div class="terrain-login__brand-heading">
            <h1 class="terrain-login__brand-title">{{ title }}</h1>
          </div>
        </header>

        <div class="terrain-login__brand-body">
          <div class="terrain-login__brand-capabilities">
            <span>业务协同</span>
            <span>任务编排</span>
            <span>全程监管</span>
          </div>
          <p class="terrain-login__brand-description">
            任务分派、空间数据处理与流程监管，一体化推进。
          </p>
        </div>
      </div>
    </section>

    <!-- 右侧：登录交互区域 -->
    <main class="terrain-login__panel">
      <!-- 右上角深浅模式切换按钮 -->
      <div class="terrain-login__top-tools">
        <button
          type="button"
          class="tool-btn theme-toggle-btn"
          :title="isDark ? '切换至浅色模式' : '切换至深色模式'"
          @click="toggleDarkMode"
        >
          <component :is="useRenderIcon(isDark ? SunLine : MoonLine)" />
          <span class="tool-btn-text">{{ isDark ? "浅色" : "深色" }}</span>
        </button>
      </div>

      <!-- 居中登录卡片 -->
      <div class="terrain-login__form-box">
        <div class="terrain-login__card-header">
          <div class="welcome-tag">SECURITY LOGIN</div>
          <h3 class="card-title">{{ t("login.pureLogin") }}</h3>
          <p class="card-subtitle">
            请输入您的企业域账号和密码以进入系统工作台
          </p>
        </div>

        <el-form
          ref="ruleFormRef"
          class="terrain-login__form"
          :model="ruleForm"
          :rules="loginRules"
          label-position="top"
          size="large"
          @submit.prevent="onLogin(ruleFormRef)"
        >
          <el-form-item
            :label="t('login.pureUsername')"
            prop="username"
            :rules="[
              {
                required: true,
                message: transformI18n($t('login.pureUsernameReg')),
                trigger: 'blur'
              }
            ]"
          >
            <el-input
              v-model="ruleForm.username"
              clearable
              autocomplete="username"
              :placeholder="t('login.pureUsernameReg')"
              :prefix-icon="useRenderIcon(User)"
            />
          </el-form-item>

          <el-form-item :label="t('login.purePassword')" prop="password">
            <el-input
              v-model="ruleForm.password"
              clearable
              show-password
              autocomplete="current-password"
              :placeholder="t('login.purePassWordReg')"
              :prefix-icon="useRenderIcon(Lock)"
            />
          </el-form-item>

          <div class="terrain-login__actions">
            <el-checkbox v-model="ruleForm.remember">
              {{ t("login.remember") }}
            </el-checkbox>

            <button
              type="button"
              class="quick-fill-btn"
              @click="fillDemoCredentials"
            >
              填充测试账号
            </button>
          </div>

          <el-button
            class="terrain-login__submit-btn"
            native-type="submit"
            type="primary"
            :loading="loading"
            :disabled="disabled"
          >
            {{ t("login.pureLogin") }}
          </el-button>
        </el-form>

        <div class="terrain-login__footnote">
          <span>统一身份与访问控制 (IAM)</span>
        </div>

        <footer class="terrain-login__copyright">
          © {{ copyrightYear }} {{ title }}
          <span v-if="version"> · v{{ version }}</span>
        </footer>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.terrain-login {
  position: relative;
  display: flex;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--el-text-color-primary, #1e293b);
  background-color: var(--el-bg-color, #fff);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;

  // ----------------------------------------------------
  // 左侧：品牌区与等高线
  // ----------------------------------------------------
  &__visual {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 100vh;
    overflow: hidden;
    background-color: var(--terrain-bg, #2e3a40);
    transition: background-color 0.4s ease;
  }

  &__svg-wrapper {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;

    :deep(svg) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__scrim {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgb(255 255 255 / 5%) 0%,
      transparent 46%,
      rgb(9 38 70 / 8%) 100%
    );
  }

  &__brand-container {
    position: absolute;
    inset: 0;
    z-index: 3;
    box-sizing: border-box;
    width: 100%;
    padding: clamp(36px, 5vw, 72px);
  }

  &__brand-header {
    display: flex;
    gap: 14px;
    align-items: center;
    background: transparent;
  }

  &__brand-heading {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__logo-badge {
    display: flex;
    flex: 0 0 36px;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: 0;
    box-shadow: none;
    backdrop-filter: none;
  }

  &__logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  &__brand-title {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: clamp(20px, 1.8vw, 28px);
    font-weight: 700;
    line-height: 1.2;
    color: #294b70;
    letter-spacing: 0.01em;
    white-space: nowrap;
    background: transparent;
  }

  &.is-dark {
    .terrain-login__brand-title {
      color: #fff;
    }
  }

  &__brand-body {
    position: absolute;
    bottom: clamp(36px, 5vw, 72px);
    left: clamp(36px, 5vw, 72px);
    max-width: 520px;
  }

  &__brand-capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    span {
      padding: 5px 10px;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.3;
      color: rgb(255 255 255 / 86%);
      letter-spacing: 0.04em;
      white-space: nowrap;
      background: rgb(255 255 255 / 10%);
      border: 1px solid rgb(255 255 255 / 24%);
      border-radius: 999px;
      box-shadow: 0 4px 14px rgb(0 0 0 / 8%);
      backdrop-filter: blur(8px);
    }
  }

  &__brand-description {
    max-width: 360px;
    margin: 14px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: rgb(255 255 255 / 62%);
    letter-spacing: 0.02em;
  }

  // ----------------------------------------------------
  // 右侧：操作区（收窄更紧凑精致）
  // ----------------------------------------------------
  &__panel {
    position: relative;
    z-index: 5;
    display: flex;
    flex: 0 0 clamp(480px, 36vw, 560px);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: clamp(480px, 36vw, 560px);
    min-width: 460px;
    padding: 40px clamp(32px, 3.5vw, 60px);
    background-color: var(--el-bg-color, #fff);
    box-shadow: -12px 0 36px rgb(0 0 0 / 5%);
  }

  &__top-tools {
    position: absolute;
    top: 24px;
    right: 28px;
    z-index: 10;
    display: flex;
    gap: 12px;
    align-items: center;

    .tool-btn {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-regular, #64748b);
      cursor: pointer;
      background: var(--el-fill-color-light, #f1f5f9);
      border: 1px solid var(--el-border-color-lighter, #e2e8f0);
      border-radius: 20px;
      transition: all 0.2s ease;

      &:hover {
        color: var(--el-color-primary, #034ea2);
        background: var(--el-fill-color, #e2e8f0);
        transform: translateY(-1px);
      }
    }
  }

  &__form-box {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 400px;
  }

  &__card-header {
    margin-bottom: 28px;

    .welcome-tag {
      display: inline-block;
      padding: 3px 8px;
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--el-color-primary, #034ea2);
      letter-spacing: 0.08em;
      background: var(--el-color-primary-light-9, #ecf5ff);
      border-radius: 4px;
    }

    .card-title {
      margin: 0 0 6px;
      font-size: 28px;
      font-weight: 700;
      color: var(--el-text-color-primary, #0f172a);
      letter-spacing: -0.02em;
    }

    .card-subtitle {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--el-text-color-secondary, #64748b);
    }
  }

  &__form {
    :deep(.el-form-item__label) {
      padding-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary, #334155);
    }

    :deep(.el-input__wrapper) {
      padding: 4px 14px;
      border-radius: 8px;
      box-shadow: 0 0 0 1px var(--el-border-color, #dcdfe6) inset;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-3, #79bbff) inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 2px var(--el-color-primary, #034ea2) inset !important;
      }
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 8px 0 24px;

    .quick-fill-btn {
      padding: 0;
      font-size: 13px;
      color: var(--el-color-primary, #034ea2);
      cursor: pointer;
      background: transparent;
      border: none;
      transition: opacity 0.2s;

      &:hover {
        text-decoration: underline;
        opacity: 0.8;
      }
    }
  }

  &__submit-btn {
    width: 100%;
    height: 46px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgb(3 78 162 / 22%);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;

    &:hover:not(:disabled) {
      box-shadow: 0 8px 22px rgb(3 78 162 / 30%);
      transform: translateY(-1px);
    }
  }

  &__footnote {
    padding-top: 16px;
    margin-top: 24px;
    font-size: 12px;
    color: var(--el-text-color-placeholder, #94a3b8);
    text-align: center;
    border-top: 1px dashed var(--el-border-color-lighter, #f1f5f9);
  }

  &__copyright {
    margin-top: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary, #94a3b8);
    text-align: center;
  }
}

// ----------------------------------------------------
// 响应式设计（窄屏与移动端适配）
// ----------------------------------------------------
@media (width <= 980px) {
  .terrain-login {
    flex-direction: column;

    &__visual {
      flex: none;
      min-height: 280px;
      max-height: 38vh;
    }

    &__brand-container {
      padding: 24px;
    }

    &__brand-body {
      right: 24px;
      bottom: 24px;
      left: 24px;

      .terrain-login__brand-capabilities {
        gap: 6px;

        span {
          padding: 4px 8px;
          font-size: 12px;
        }
      }

      .terrain-login__brand-description {
        display: none;
      }
    }

    &__panel {
      flex: 1;
      width: 100%;
      min-width: 0;
      padding: 32px 24px;
    }

    &__top-tools {
      top: 16px;
      right: 16px;
    }
  }
}
</style>
