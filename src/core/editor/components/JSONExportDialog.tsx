import React from "react";
import { NonDeletedExcalidrawElement } from "../elements/types";
import { t } from "../../../shared/i18n";

import { AppState, ExportOpts, BinaryFiles } from "../state/types";
import { Dialog } from "../../../shared/ui/Dialog";
import { exportToFileIcon } from "./icons";
import { ToolButton } from "./ToolButton";
import { actionSaveFileToDisk } from "../actions/actionExport";
import { Card } from "../../../shared/ui/Card";

import "./ExportDialog.scss";
import { nativeFileSystemSupported } from "../../../platform/desktop/api/filesystem";
import { ActionManager } from "../actions/manager";

export type ExportCB = (
  elements: readonly NonDeletedExcalidrawElement[],
  scale?: number,
) => void;

const JSONExportModal = ({
  elements,
  appState,
  files,
  actionManager,
  exportOpts,
  canvas,
}: {
  appState: AppState;
  files: BinaryFiles;
  elements: readonly NonDeletedExcalidrawElement[];
  actionManager: ActionManager;
  onCloseRequest: () => void;
  exportOpts: ExportOpts;
  canvas: HTMLCanvasElement | null;
}) => {
  return (
    <div className="ExportDialog ExportDialog--json">
      <div className="ExportDialog-cards">
        {exportOpts.saveFileToDisk && (
          <Card color="lime">
            <div className="Card-icon">{exportToFileIcon}</div>
            <h2>{t("exportDialog.disk_title")}</h2>
            <div className="Card-details">
              {t("exportDialog.disk_details")}
              {!nativeFileSystemSupported &&
                actionManager.renderAction("changeProjectName")}
            </div>
            <ToolButton
              className="Card-button"
              type="button"
              title={t("exportDialog.disk_button")}
              aria-label={t("exportDialog.disk_button")}
              showAriaLabel={true}
              onClick={() => {
                actionManager.executeAction(actionSaveFileToDisk, "ui");
              }}
            />
          </Card>
        )}
        {exportOpts.renderCustomUI &&
          exportOpts.renderCustomUI(elements, appState, files, canvas)}
      </div>
    </div>
  );
};

export const JSONExportDialog = ({
  elements,
  appState,
  files,
  actionManager,
  exportOpts,
  canvas,
  setAppState,
}: {
  elements: readonly NonDeletedExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
  actionManager: ActionManager;
  exportOpts: ExportOpts;
  canvas: HTMLCanvasElement | null;
  setAppState: React.Component<any, AppState>["setState"];
}) => {
  const handleClose = React.useCallback(() => {
    setAppState({ openDialog: null });
  }, [setAppState]);

  return (
    <>
      {appState.openDialog === "jsonExport" && (
        <Dialog onCloseRequest={handleClose} title={t("buttons.export")}>
          <JSONExportModal
            elements={elements}
            appState={appState}
            files={files}
            actionManager={actionManager}
            onCloseRequest={handleClose}
            exportOpts={exportOpts}
            canvas={canvas}
          />
        </Dialog>
      )}
    </>
  );
};
