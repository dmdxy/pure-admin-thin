import { useNav } from "./useNav";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { computed, watch, onBeforeMount, type Ref } from "vue";
import {
  getAvailableLocales,
  getDefaultLocale,
  resolveLocale
} from "@/utils/locale";

export function useTranslationLang(ref?: Ref) {
  const { $storage, changeTitle, handleResize } = useNav();
  const { locale, t } = useI18n();
  const route = useRoute();

  const availableLocales = computed(() => getAvailableLocales());
  const showTranslation = computed(() => availableLocales.value.length > 1);

  function translation(lang: string) {
    const next = resolveLocale(lang);
    $storage.locale = { locale: next };
    locale.value = next;
    ref && handleResize(ref.value);
  }

  function translationCh() {
    translation("zh");
  }

  function translationEn() {
    translation("en");
  }

  watch(
    () => locale.value,
    () => {
      changeTitle(route.meta);
    }
  );

  onBeforeMount(() => {
    const next = resolveLocale($storage.locale?.locale);
    if ($storage.locale?.locale !== next) {
      $storage.locale = { locale: next };
    }
    locale.value = next;
  });

  return {
    t,
    route,
    locale,
    translation,
    translationCh,
    translationEn,
    availableLocales,
    showTranslation,
    defaultLocale: getDefaultLocale()
  };
}
