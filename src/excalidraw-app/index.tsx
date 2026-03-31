import polyfill from "../polyfill";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "../analytics";
import { ErrorDialog } from "../components/ErrorDialog";
import { TopErrorBoundary } from "../components/TopErrorBoundary";
import {
  EVENT,
  THEME,
  TITLE_TIMEOUT,
  VERSION_TIMEOUT,
} from "../constants";
import {
  ExcalidrawElement,
  FileId,
  NonDeletedExcalidrawElement,
  Theme,
} from "../element/types";
import { useCallbackRefState } from "../hooks/useCallbackRefState";
import { Excalidraw } from "../components/Excalidraw";
import { defaultLang } from "../i18n";
import {
  AppState,
  LibraryItems,
  ExcalidrawImperativeAPI,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "../types";
import {
  getVersion,
  getFrame,
  preventUnload,
  ResolvablePromise,
  resolvablePromise,
} from "../utils";
import { loadScene } from "./data";
import {
  bootstrapDesktopState,
  clearLibraryItems,
  getAllBoardElementsFromStorage,
  getCurrentBoardName,
  getDesktopDraftState,
  getLibraryItems,
  saveLibraryItems,
} from "./data/desktopState";
import { onDesktopStateChanged } from "./data/desktopEvents";
import CustomStats from "./CustomStats";

import "./index.scss";

import { updateStaleImageStatuses } from "./data/FileManager";
import { newElementWith } from "../element/mutateElement";
import { isInitializedImageElement } from "../element/typeChecks";
import { LocalData } from "./data/LocalData";
import { atom, Provider, useAtom } from "jotai";
import { jotaiStore } from "../jotai";
import { useHandleLibrary } from "../data/library";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import { AppFooter } from "./components/AppFooter";

polyfill();

window.EXCALIDRAW_THROTTLE_RENDER = true;

const detectDesktopLanguage = () => {
  const preferredLanguage =
    navigator.languages?.[0] || navigator.language || defaultLang.code;
  return preferredLanguage.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : defaultLang.code;
};

const initializeScene = async (): Promise<{
  scene: ExcalidrawInitialDataState | null;
  isExternalScene: false;
}> => {
  await bootstrapDesktopState();
  const desktopState = getDesktopDraftState();
  const scene = await loadScene(null, null, desktopState);
  return { scene, isExternalScene: false };
};

const currentLangCode = detectDesktopLanguage();

export const langCodeAtom = atom(
  Array.isArray(currentLangCode) ? currentLangCode[0] : currentLangCode,
);

const ExcalidrawWrapper = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [langCode] = useAtom(langCodeAtom);
  const [appRevision, setAppRevision] = useState(0);
  // initial state
  // ---------------------------------------------------------------------------

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  useEffect(() => {
    trackEvent("load", "frame", getFrame());
    // Delayed so that the app has a time to load the latest SW
    setTimeout(() => {
      trackEvent("load", "version", getVersion());
    }, VERSION_TIMEOUT);
  }, []);

  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();

  useHandleLibrary({
    excalidrawAPI,
    getInitialLibraryItems: getLibraryItems,
  });

  useEffect(
    () =>
      onDesktopStateChanged(() => {
        setAppRevision((revision) => revision + 1);
      }),
    [],
  );

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    const loadImages = (
      data: ResolutionType<typeof initializeScene>,
      isInitialLoad = false,
    ) => {
      if (!data.scene || !isInitialLoad) {
        return;
      }
      const allBoardElements = getAllBoardElementsFromStorage();
      const fileIds =
        allBoardElements?.reduce((acc, element) => {
          if (isInitializedImageElement(element)) {
            return acc.concat(element.fileId);
          }
          return acc;
        }, [] as FileId[]) || [];

      if (fileIds.length) {
        LocalData.fileStorage
          .getFiles(fileIds)
          .then(({ loadedFiles, erroredFiles }) => {
            if (loadedFiles.length) {
              excalidrawAPI.addFiles(loadedFiles);
            }
            updateStaleImageStatuses({
              excalidrawAPI,
              erroredFiles,
              elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
            });
          });
      }
      // On fresh load, clear unused files from the desktop file cache.
      LocalData.fileStorage.clearObsoleteFiles({ currentFileIds: fileIds });
    };

    initializeScene().then((data) => {
      loadImages(data, true);
      initialStatePromiseRef.current.promise.resolve(data.scene);
    });

    const titleTimeout = setTimeout(
      () => (document.title = "Handraw"),
      TITLE_TIMEOUT,
    );

    const onUnload = () => {
      LocalData.flushSave();
    };

    const visibilityChange = (event: FocusEvent | Event) => {
      if (event.type === EVENT.BLUR || document.hidden) {
        LocalData.flushSave();
      }
    };

    window.addEventListener(EVENT.UNLOAD, onUnload, false);
    window.addEventListener(EVENT.BLUR, visibilityChange, false);
    document.addEventListener(EVENT.VISIBILITY_CHANGE, visibilityChange, false);
    window.addEventListener(EVENT.FOCUS, visibilityChange, false);
    return () => {
      window.removeEventListener(EVENT.UNLOAD, onUnload, false);
      window.removeEventListener(EVENT.BLUR, visibilityChange, false);
      window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
      document.removeEventListener(
        EVENT.VISIBILITY_CHANGE,
        visibilityChange,
        false,
      );
      clearTimeout(titleTimeout);
    };
  }, [excalidrawAPI]);

  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      LocalData.flushSave();

      if (
        excalidrawAPI &&
        LocalData.fileStorage.shouldPreventUnload(
          excalidrawAPI.getSceneElements(),
        )
      ) {
        preventUnload(event);
      }
    };
    window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    return () => {
      window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    };
  }, [excalidrawAPI]);

  const [theme, setTheme] = useState<Theme>(
    () => getDesktopDraftState().appState?.theme || THEME.LIGHT,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === THEME.DARK);
  }, [theme]);

  const onChange = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    setTheme(appState.theme);

    // this check is redundant, but since this is a hot path, it's best
    // not to evaludate the nested expression every time
    if (!LocalData.isSavePaused()) {
      LocalData.save(elements, appState, files, () => {
        if (excalidrawAPI) {
          let didChange = false;

          const elements = excalidrawAPI
            .getSceneElementsIncludingDeleted()
            .map((element) => {
              if (
                LocalData.fileStorage.shouldUpdateImageElementStatus(element)
              ) {
                const newElement = newElementWith(element, { status: "saved" });
                if (newElement !== element) {
                  didChange = true;
                }
                return newElement;
              }
              return element;
            });

          if (didChange) {
            excalidrawAPI.updateScene({
              elements,
            });
          }
        }
      });
    }
  };

  const renderCustomStats = (
    elements: readonly NonDeletedExcalidrawElement[],
    appState: AppState,
  ) => {
    return (
      <CustomStats
        setToast={(message) => excalidrawAPI!.setToast({ message })}
        appState={appState}
        elements={elements}
      />
    );
  };

  const onLibraryChange = async (items: LibraryItems) => {
    if (!items.length) {
      await clearLibraryItems();
      return;
    }
    await saveLibraryItems(items);
  };

  return (
    <div style={{ height: "100%" }} className="excalidraw-app">
      <Excalidraw
        key={appRevision}
        ref={excalidrawRefCallback}
        name={getCurrentBoardName()}
        onChange={onChange}
        initialData={initialStatePromiseRef.current.promise}
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
          },
        }}
        langCode={langCode}
        renderCustomStats={renderCustomStats}
        detectScroll={false}
        handleKeyboardGlobally={true}
        onLibraryChange={onLibraryChange}
        autoFocus={true}
        theme={theme}
      >
        <AppMainMenu />
        <AppWelcomeScreen />
        <AppFooter />
      </Excalidraw>
      {errorMessage && (
        <ErrorDialog
          message={errorMessage}
          onClose={() => setErrorMessage("")}
        />
      )}
    </div>
  );
};

const ExcalidrawApp = () => {
  return (
    <TopErrorBoundary>
      <Provider unstable_createStore={() => jotaiStore}>
        <ExcalidrawWrapper />
      </Provider>
    </TopErrorBoundary>
  );
};

export default ExcalidrawApp;
