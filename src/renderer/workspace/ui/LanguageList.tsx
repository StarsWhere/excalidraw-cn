import { useAtom } from "jotai";
import React from "react";
import { langCodeAtom } from "@app/HandrawApp";
import * as i18n from "@shared/i18n";
import { languages } from "@shared/i18n";

export const LanguageList = ({ style }: { style?: React.CSSProperties }) => {
  const [langCode, setLangCode] = useAtom(langCodeAtom);

  return (
    <select
      className="dropdown-select dropdown-select__language"
      onChange={({ target }) => setLangCode(target.value)}
      value={langCode}
      aria-label={i18n.t("buttons.selectLanguage")}
      style={style}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};
