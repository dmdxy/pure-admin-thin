<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { getConfig } from "@/config";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive } from "vue";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { $t, transformI18n } from "@/plugins/i18n";
import { useLayout } from "@/layout/hooks/useLayout";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import loginBgLight from "@/assets/login/loginBg1.jpg";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();

const { initStorage } = useLayout();
initStorage();

const { dataTheme, setEpThemeColor } = useDataThemeChange();
dataTheme.value = false;
setEpThemeColor(useEpThemeStoreHook().getEpThemeColor);
document.documentElement.classList.remove("dark");

const { t } = useI18n();
const { title, getLogo } = useNav();
const copyrightYear = new Date().getFullYear();
const version = getConfig().Version;
const userStore = useUserStoreHook();

const ruleForm = reactive({
  username: "admin",
  password: "admin123",
  remember: userStore.isRemembered
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      userStore.SET_ISREMEMBERED(ruleForm.remember);
      // 暂沿用当前 mock 登录，后续再接真实接口
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
        .finally(() => (loading.value = false));
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
  )
    immediateDebounce(ruleFormRef.value);
});
</script>

<template>
  <main class="survey-login">
    <img
      class="survey-login__background"
      :src="loginBgLight"
      alt=""
      aria-hidden="true"
    />
    <div class="survey-login__scrim" aria-hidden="true" />

    <header class="survey-login__brand">
      <img class="survey-login__logo" :src="getLogo()" alt="" />
      <p class="survey-login__brand-title">{{ title }}</p>
      <p class="survey-login__brand-subtitle">业务协同 · 数据融合 · 空间赋能</p>
    </header>

    <section class="survey-login__card" :aria-label="t('login.pureLogin')">
      <div class="survey-login__accent" aria-hidden="true" />
      <h1>{{ t("login.pureLogin") }}</h1>
      <p class="survey-login__description">{{ t("login.description") }}</p>

      <el-form
        ref="ruleFormRef"
        class="survey-login__form"
        :model="ruleForm"
        :rules="loginRules"
        label-position="top"
        @submit.prevent="onLogin(ruleFormRef)"
      >
        <el-form-item
          :label="t('login.pureUsername')"
          :rules="[
            {
              required: true,
              message: transformI18n($t('login.pureUsernameReg')),
              trigger: 'blur'
            }
          ]"
          prop="username"
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

        <div class="survey-login__options">
          <el-checkbox v-model="ruleForm.remember">
            {{ t("login.remember") }}
          </el-checkbox>
        </div>

        <el-button
          class="survey-login__submit"
          native-type="submit"
          type="primary"
          :loading="loading"
          :disabled="disabled"
        >
          {{ t("login.pureLogin") }}
        </el-button>
      </el-form>

      <p class="survey-login__footnote">{{ t("login.footnote") }}</p>
    </section>

    <footer class="survey-login__copyright">
      © {{ copyrightYear }} {{ title }}
      <span v-if="version"> · v{{ version }}</span>
    </footer>
  </main>
</template>

<style scoped lang="scss">
.survey-login {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: max(100dvh, 640px);
  overflow: hidden;
  color: #172033;
  background: var(--el-color-primary-light-9, #eaf4f7);
}

.survey-login__background,
.survey-login__scrim {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.survey-login__background {
  object-fit: cover;
  object-position: top;
}

.survey-login__scrim {
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgb(255 255 255 / 10%) 0%,
    transparent 42%,
    rgb(255 255 255 / 16%) 100%
  );
}

.survey-login__brand,
.survey-login__card {
  position: absolute;
  z-index: 1;
}

.survey-login__brand {
  top: clamp(32px, 5.8vh, 52px);
  left: clamp(32px, 4.2vw, 64px);
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 14px 10px;
  align-items: center;
  width: 340px;
  max-width: calc(100% - 64px);
}

.survey-login__logo {
  display: block;
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: saturate(0.9);
}

.survey-login__brand p {
  margin: 0;
}

.survey-login__brand-title {
  font-size: clamp(26px, 2vw, 28px);
  font-weight: 600;
  line-height: 36px;
  color: var(--el-color-primary);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.survey-login__brand-subtitle {
  grid-column: 2;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: #52677e;
  white-space: nowrap;
}

.survey-login__card {
  top: 50%;
  right: calc(clamp(32px, 8.4vw, 320px) + 44px);
  box-sizing: border-box;
  width: min(clamp(360px, 22vw, 400px), calc(100vw - 64px));
  padding: clamp(24px, 1.3vw, 32px) 28px;
  overflow: hidden;
  background: rgb(255 255 255 / 64%);
  border: 1px solid rgb(255 255 255 / 68%);
  border-radius: 12px;
  box-shadow:
    0 2px 4px color-mix(in srgb, var(--el-color-primary) 6%, transparent),
    0 16px 40px color-mix(in srgb, var(--el-color-primary) 14%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 74%);
  isolation: isolate;
  backdrop-filter: blur(28px) saturate(118%) contrast(104%);
  transform: translateY(-50%);
}

.survey-login__card::before {
  position: absolute;
  inset: -30px;
  z-index: 0;
  pointer-events: none;
  content: "";
  background: radial-gradient(
    ellipse 100% 76% at 50% 35%,
    rgb(255 255 255 / 38%),
    transparent 72%
  );
  filter: blur(12px);
}

.survey-login__card > :not(.survey-login__accent) {
  position: relative;
  z-index: 1;
}

.survey-login__accent {
  position: absolute;
  top: 0;
  left: 28px;
  z-index: 2;
  width: clamp(56px, 3vw, 84px);
  height: clamp(4px, 0.2vw, 6px);
  background: var(--el-color-primary-light-3, var(--el-color-primary));
  border-radius: 0 0 4px 4px;
}

.survey-login__card h1 {
  margin: 0;
  font-size: clamp(1.625rem, 1.15vw, 2.25rem);
  font-weight: 700;
  line-height: 1.15;
}

.survey-login__description {
  margin: 10px 0 24px;
  font-size: clamp(0.8125rem, 0.63vw, 1rem);
  color: #64748b;
}

.survey-login__form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.survey-login__form :deep(.el-form-item:nth-child(2)) {
  margin-bottom: 16px;
}

.survey-login__form :deep(.el-form-item__label) {
  height: auto;
  padding-bottom: 0;
  margin-bottom: 8px;
  font-size: clamp(0.75rem, 0.58vw, 0.9375rem);
  font-weight: 600;
  line-height: 1.2;
  color: color-mix(in srgb, var(--el-color-primary) 48%, #334155);
}

.survey-login__form :deep(.el-input__wrapper) {
  min-height: 44px;
  padding: 0 clamp(12px, 0.63vw, 18px);
  background: rgb(255 255 255 / 68%);
  border-radius: 6px;
  box-shadow:
    0 0 0 1px var(--el-color-primary-light-7) inset,
    inset 0 1px 0 rgb(255 255 255 / 45%);
}

.survey-login__form :deep(.el-input__inner) {
  height: 44px;
  color: #172033;
}

.survey-login__form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.survey-login__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 18px;
}

.survey-login__options :deep(.el-checkbox) {
  height: 20px;
}

.survey-login__options :deep(.el-checkbox__label) {
  font-size: clamp(0.75rem, 0.58vw, 0.9375rem);
  color: #64748b;
}

.survey-login__submit {
  width: 100%;
  height: 44px;
  font-size: clamp(0.875rem, 0.63vw, 1rem);
  font-weight: 600;
  border-radius: 7px;
}

.survey-login__footnote {
  margin: 14px 0 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
  color: #526175;
  text-align: center;
}

.survey-login__copyright {
  position: relative;
  z-index: 1;
  padding: 24px 24px calc(24px + env(safe-area-inset-bottom, 0px));
  margin-top: auto;
  font-size: 12px;
  line-height: 20px;
  color: #64748b;
  text-align: center;
  overflow-wrap: anywhere;
}

@media (width <= 960px) {
  .survey-login {
    min-height: 100dvh;
    padding-top: 176px;
    overflow-y: auto;
  }

  .survey-login__background {
    object-position: 42% center;
  }

  .survey-login__card {
    position: relative;
    top: auto;
    right: auto;
    flex-shrink: 0;
    align-self: center;
    transform: none;
  }
}
</style>
