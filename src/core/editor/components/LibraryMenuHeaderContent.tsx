import React, { useCallback, useState } from "react";
import { saveLibraryAsJSON } from "../io/json";
import Library, { libraryItemsAtom } from "../io/library";
import { t } from "../../../shared/i18n";
import { AppState, LibraryItem } from "../state/types";
import { DotsIcon, ExportIcon, LoadIcon, TrashIcon } from "./icons";
import { fileOpen } from "../../../platform/desktop/api/filesystem";
import { muteFSAbortError } from "../../../shared/lib/utils";
import { atom, useAtom } from "jotai";
import { jotaiScope } from "../state/jotai";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";

import DropdownMenu from "../../../shared/ui/dropdownMenu/DropdownMenu";

export const isLibraryMenuOpenAtom = atom(false);

export const LibraryMenuHeader: React.FC<{
  setAppState: React.Component<any, AppState>["setState"];
  selectedItems: LibraryItem["id"][];
  library: Library;
  onRemoveFromLibrary: () => void;
  resetLibrary: () => void;
  onSelectItems: (items: LibraryItem["id"][]) => void;
  appState: AppState;
}> = ({
  setAppState,
  selectedItems,
  library,
  onRemoveFromLibrary,
  resetLibrary,
  onSelectItems,
  appState,
}) => {
  const [libraryItemsData] = useAtom(libraryItemsAtom, jotaiScope);
  const [isLibraryMenuOpen, setIsLibraryMenuOpen] = useAtom(
    isLibraryMenuOpenAtom,
  );
  const renderRemoveLibAlert = useCallback(() => {
    const content = selectedItems.length
      ? t("alerts.removeItemsFromsLibrary", { count: selectedItems.length })
      : t("alerts.resetLibrary");
    const title = selectedItems.length
      ? t("confirmDialog.removeItemsFromLib")
      : t("confirmDialog.resetLibrary");
    return (
      <ConfirmDialog
        onConfirm={() => {
          if (selectedItems.length) {
            onRemoveFromLibrary();
          } else {
            resetLibrary();
          }
          setShowRemoveLibAlert(false);
        }}
        onCancel={() => {
          setShowRemoveLibAlert(false);
        }}
        title={title}
      >
        <p>{content}</p>
      </ConfirmDialog>
    );
  }, [selectedItems, onRemoveFromLibrary, resetLibrary]);

  const [showRemoveLibAlert, setShowRemoveLibAlert] = useState(false);

  const itemsSelected = !!selectedItems.length;
  const items = itemsSelected
    ? libraryItemsData.libraryItems.filter((item) =>
        selectedItems.includes(item.id),
      )
    : libraryItemsData.libraryItems;
  const resetLabel = itemsSelected
    ? t("buttons.remove")
    : t("buttons.resetLibrary");
  const onLibraryImport = async () => {
    try {
      await library.updateLibrary({
        libraryItems: fileOpen({
          description: "Excalidraw library files",
          // ToDo: Be over-permissive until https://bugs.webkit.org/show_bug.cgi?id=34442
          // gets resolved. Else, iOS users cannot open `.excalidraw` files.
          /*
            extensions: [".json", ".excalidrawlib"],
            */
        }).then(({ file }) => file),
        merge: true,
        openLibraryMenu: true,
      });
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.warn(error);
        return;
      }
      setAppState({ errorMessage: t("errors.importLibraryError") });
    }
  };

  const onLibraryExport = async () => {
    const libraryItems = itemsSelected
      ? items
      : await library.getLatestLibrary();
    saveLibraryAsJSON(libraryItems)
      .catch(muteFSAbortError)
      .catch((error) => {
        setAppState({ errorMessage: error.message });
      });
  };

  const renderLibraryMenu = () => {
    return (
      <DropdownMenu open={isLibraryMenuOpen}>
        <DropdownMenu.Trigger
          className="Sidebar__dropdown-btn"
          onToggle={() => setIsLibraryMenuOpen(!isLibraryMenuOpen)}
        >
          {DotsIcon}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          onClickOutside={() => setIsLibraryMenuOpen(false)}
          onSelect={() => setIsLibraryMenuOpen(false)}
          className="library-menu"
        >
          {!itemsSelected && (
            <DropdownMenu.Item
              onSelect={onLibraryImport}
              icon={LoadIcon}
              data-testid="lib-dropdown--load"
            >
              {t("buttons.load")}
            </DropdownMenu.Item>
          )}
          {!!items.length && (
            <DropdownMenu.Item
              onSelect={onLibraryExport}
              icon={ExportIcon}
              data-testid="lib-dropdown--export"
            >
              {t("buttons.export")}
            </DropdownMenu.Item>
          )}
          {!!items.length && (
            <DropdownMenu.Item
              onSelect={() => setShowRemoveLibAlert(true)}
              icon={TrashIcon}
            >
              {resetLabel}
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu>
    );
  };
  return (
    <div style={{ position: "relative" }}>
      {renderLibraryMenu()}
      {selectedItems.length > 0 && (
        <div className="library-actions-counter">{selectedItems.length}</div>
      )}
      {showRemoveLibAlert && renderRemoveLibAlert()}
    </div>
  );
};
