import React, { useEffect, forwardRef } from "react";
import { InitializeApp } from "./InitializeApp";
import App, { useDevice } from "./App";
import { isShallowEqual } from "../../../shared/lib/utils";

import "../../../shared/styles/app.scss";
import "../../../shared/styles/styles.scss";

import { AppProps, ExcalidrawAPIRefValue, ExcalidrawProps } from "../state/types";
import { defaultLang } from "../../../shared/i18n";
import { DEFAULT_UI_OPTIONS } from "../state/constants";
import { Provider } from "jotai";
import { jotaiScope, jotaiStore } from "../state/jotai";

const ExcalidrawBase = (props: ExcalidrawProps) => {
  const {
    onChange,
    initialData,
    excalidrawRef,
    onPointerUpdate,
    renderTopRightUI,
    renderSidebar,
    langCode = defaultLang.code,
    viewModeEnabled,
    zenModeEnabled,
    gridModeEnabled,
    libraryReturnUrl,
    theme,
    name,
    renderCustomStats,
    onPaste,
    detectScroll = true,
    handleKeyboardGlobally = false,
    onLibraryChange,
    autoFocus = false,
    generateIdForFile,
    onLinkOpen,
    onPointerDown,
    onScrollChange,
    children,
  } = props;

  const canvasActions = props.UIOptions?.canvasActions;

  const UIOptions: AppProps["UIOptions"] = {
    ...props.UIOptions,
    canvasActions: {
      ...DEFAULT_UI_OPTIONS.canvasActions,
      ...canvasActions,
    },
  };

  if (canvasActions?.export) {
    UIOptions.canvasActions.export.saveFileToDisk =
      canvasActions.export?.saveFileToDisk ??
      DEFAULT_UI_OPTIONS.canvasActions.export.saveFileToDisk;
  }

  if (
    UIOptions.canvasActions.toggleTheme === null &&
    typeof theme === "undefined"
  ) {
    UIOptions.canvasActions.toggleTheme = true;
  }

  useEffect(() => {
    const handleTouchMove = (event: TouchEvent) => {
      // @ts-ignore
      if (typeof event.scale === "number" && event.scale !== 1) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <InitializeApp langCode={langCode} theme={theme}>
      <Provider unstable_createStore={() => jotaiStore} scope={jotaiScope}>
        <App
          onChange={onChange}
          initialData={initialData}
          excalidrawRef={excalidrawRef}
          onPointerUpdate={onPointerUpdate}
          renderTopRightUI={renderTopRightUI}
          langCode={langCode}
          viewModeEnabled={viewModeEnabled}
          zenModeEnabled={zenModeEnabled}
          gridModeEnabled={gridModeEnabled}
          libraryReturnUrl={libraryReturnUrl}
          theme={theme}
          name={name}
          renderCustomStats={renderCustomStats}
          UIOptions={UIOptions}
          onPaste={onPaste}
          detectScroll={detectScroll}
          handleKeyboardGlobally={handleKeyboardGlobally}
          onLibraryChange={onLibraryChange}
          autoFocus={autoFocus}
          generateIdForFile={generateIdForFile}
          onLinkOpen={onLinkOpen}
          onPointerDown={onPointerDown}
          onScrollChange={onScrollChange}
          renderSidebar={renderSidebar}
        >
          {children}
        </App>
      </Provider>
    </InitializeApp>
  );
};

type PublicExcalidrawProps = Omit<ExcalidrawProps, "forwardedRef">;

const areEqual = (
  prevProps: PublicExcalidrawProps,
  nextProps: PublicExcalidrawProps,
) => {
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  const {
    initialData: prevInitialData,
    UIOptions: prevUIOptions = {},
    ...prev
  } = prevProps;
  const {
    initialData: nextInitialData,
    UIOptions: nextUIOptions = {},
    ...next
  } = nextProps;
  void prevInitialData;
  void nextInitialData;

  const prevUIOptionsKeys = Object.keys(prevUIOptions) as (keyof Partial<
    typeof DEFAULT_UI_OPTIONS
  >)[];
  const nextUIOptionsKeys = Object.keys(nextUIOptions) as (keyof Partial<
    typeof DEFAULT_UI_OPTIONS
  >)[];

  if (prevUIOptionsKeys.length !== nextUIOptionsKeys.length) {
    return false;
  }

  const isUIOptionsSame = prevUIOptionsKeys.every((key) => {
    if (key === "canvasActions") {
      const canvasOptionKeys = Object.keys(
        prevUIOptions.canvasActions!,
      ) as (keyof Partial<typeof DEFAULT_UI_OPTIONS.canvasActions>)[];
      return canvasOptionKeys.every((canvasActionKey) => {
        if (
          canvasActionKey === "export" &&
          prevUIOptions?.canvasActions?.export &&
          nextUIOptions?.canvasActions?.export
        ) {
          return (
            prevUIOptions.canvasActions.export.saveFileToDisk ===
            nextUIOptions.canvasActions.export.saveFileToDisk
          );
        }
        return (
          prevUIOptions?.canvasActions?.[canvasActionKey] ===
          nextUIOptions?.canvasActions?.[canvasActionKey]
        );
      });
    }
    return prevUIOptions[key] === nextUIOptions[key];
  });

  return isUIOptionsSame && isShallowEqual(prev, next);
};

const forwardedRefComp = forwardRef<
  ExcalidrawAPIRefValue,
  PublicExcalidrawProps
>((props, ref) => <ExcalidrawBase {...props} excalidrawRef={ref} />);

export const Excalidraw = React.memo(forwardedRefComp, areEqual);
Excalidraw.displayName = "Excalidraw";

export { useDevice };
