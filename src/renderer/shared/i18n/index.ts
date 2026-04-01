import fallbackLangData from "./locales/en.json";
import zhCNLangData from "./locales/zh-CN.json";
import { ENV } from "@editor/state/constants";

export interface Language {
  code: string;
  label: string;
  rtl?: boolean;
}

export const defaultLang = { code: "en", label: "English" };

const SUPPORTED_LANGUAGES: Language[] = [
  defaultLang,
  { code: "zh-CN", label: "简体中文" },
];

export const languages: Language[] = [...SUPPORTED_LANGUAGES];

const TEST_LANG_CODE = "__test__";
if (process.env.NODE_ENV === ENV.DEVELOPMENT) {
  languages.unshift(
    { code: TEST_LANG_CODE, label: "test language" },
    {
      code: `${TEST_LANG_CODE}.rtl`,
      label: "\u{202a}test language (rtl)\u{202c}",
      rtl: true,
    },
  );
}

let currentLang: Language = defaultLang;
let currentLangData: any = fallbackLangData;

const localeDataMap: Record<string, any> = {
  en: fallbackLangData,
  "zh-CN": zhCNLangData,
};

export const setLanguage = async (lang: Language) => {
  const normalizedLang =
    localeDataMap[lang.code as keyof typeof localeDataMap] ? lang : defaultLang;
  currentLang = normalizedLang;
  document.documentElement.dir = currentLang.rtl ? "rtl" : "ltr";
  document.documentElement.lang = currentLang.code;

  if (currentLang.code.startsWith(TEST_LANG_CODE)) {
    currentLangData = {};
  } else {
    currentLangData =
      localeDataMap[currentLang.code as keyof typeof localeDataMap] ||
      fallbackLangData;
  }
};

export const getLanguage = () => currentLang;

const findPartsForData = (data: any, parts: string[]) => {
  for (let index = 0; index < parts.length; ++index) {
    const part = parts[index];
    if (data[part] === undefined) {
      return undefined;
    }
    data = data[part];
  }
  if (typeof data !== "string") {
    return undefined;
  }
  return data;
};

export const t = (
  path: string,
  replacement?: { [key: string]: string | number },
) => {
  if (currentLang.code.startsWith(TEST_LANG_CODE)) {
    const name = replacement
      ? `${path}(${JSON.stringify(replacement).slice(1, -1)})`
      : path;
    return `\u{202a}[[${name}]]\u{202c}`;
  }

  const parts = path.split(".");
  let translation =
    findPartsForData(currentLangData, parts) ||
    findPartsForData(fallbackLangData, parts);
  if (translation === undefined) {
    throw new Error(`Can't find translation for ${path}`);
  }

  if (replacement) {
    for (const key in replacement) {
      translation = translation.replace(`{{${key}}}`, String(replacement[key]));
    }
  }
  return translation;
};
