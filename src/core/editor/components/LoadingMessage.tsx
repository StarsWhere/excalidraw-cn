import { t } from "../../../shared/i18n";
import { useState, useEffect } from "react";
import Spinner from "../../../shared/ui/Spinner";
import clsx from "clsx";
import { THEME } from "../state/constants";
import { Theme } from "../elements/types";

export const LoadingMessage: React.FC<{ delay?: number; theme?: Theme }> = ({
  delay,
  theme,
}) => {
  const [isWaiting, setIsWaiting] = useState(!!delay);

  useEffect(() => {
    if (!delay) {
      return;
    }
    const timer = setTimeout(() => {
      setIsWaiting(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (isWaiting) {
    return null;
  }

  return (
    <div
      className={clsx("LoadingMessage", {
        "LoadingMessage--dark": theme === THEME.DARK,
      })}
    >
      <div>
        <Spinner />
      </div>
      <div className="LoadingMessage-text">{t("labels.loadingScene")}</div>
    </div>
  );
};
