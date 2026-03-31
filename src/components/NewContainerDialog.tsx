import React, { useState } from "react";
import { t } from "../i18n";
import { AppState } from "../types";
import { Dialog } from "./Dialog";
import "./ExportDialog.scss";
import { ActionManager } from "../actions/manager";
import { Button } from "./Button";
import { message } from "antd";
import {
  createBoardInStorage,
  getBoardListFromStorage,
} from "../excalidraw-app/data/desktopState";
import { notifyDesktopStateChanged } from "../excalidraw-app/data/desktopEvents";

export const NewBoardDialog = ({
  // elements,
  appState,
  setAppState,
}: // files,
// exportPadding = DEFAULT_EXPORT_PADDING,
// actionManager,
{
  appState: AppState;
  setAppState: React.Component<any, AppState>["setState"];
  // elements: readonly NonDeletedExcalidrawElement[];
  // files: BinaryFiles;
  // exportPadding?: number;
  actionManager: ActionManager;
}) => {
  const handleClose = React.useCallback(() => {
    setAppState({ openDialog: null });
  }, [setAppState]);

  const [newContainerName, setNewContainerName] = useState(appState.name);

  return (
    <>
      {appState.openDialog === "newBoard" && (
        <Dialog onCloseRequest={handleClose} title={t("buttons.newBoard")}>
          <input
            type="text"
            placeholder={t("labels.inputNewBoardName")}
            style={{ minWidth: 500 }}
            defaultValue={newContainerName}
            onChange={(e) => {
              setNewContainerName(e.target.value);
            }}
          />
          <Button
            style={{
              whiteSpace: "nowrap",
              padding: "0 20px",
              marginTop: 10,
              width: 70,
              backgroundColor: "#6965db",
              color: "#fff",
            }}
            onSelect={async () => {
              const boardName = newContainerName.trim();
              const boardList: string[] = getBoardListFromStorage();

              if (!boardName) {
                message.error(t("errors.required"));
                return;
              }

              if (boardList.includes(boardName)) {
                message.error(`画布 ${boardName} 已存在，无需重复创建`);
                return;
              }

              await createBoardInStorage(boardName);
              notifyDesktopStateChanged();
            }}
          >
            {t("buttons.confirm")}
          </Button>
        </Dialog>
      )}
    </>
  );
};
