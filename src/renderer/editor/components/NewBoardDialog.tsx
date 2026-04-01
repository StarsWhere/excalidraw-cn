import React, { useState } from "react";
import { t } from "@shared/i18n";
import { AppState } from "../state/types";
import { Dialog } from "@shared/ui/Dialog";
import "./ExportDialog.scss";
import { ActionManager } from "../actions/manager";
import { Button } from "@shared/ui/Button";
import {
  createBoardInStorage,
  getBoardListFromStorage,
} from "@app/host/workspace";
import { notifyWorkspaceStateChanged } from "@app/host/workspace";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createBoard = async () => {
    const boardName = newContainerName.trim();
    const boardList: string[] = getBoardListFromStorage();

    if (!boardName) {
      setErrorMessage(t("errors.required"));
      return;
    }

    if (boardList.includes(boardName)) {
      setErrorMessage(`画布 ${boardName} 已存在，无需重复创建`);
      return;
    }

    setErrorMessage(null);
    await createBoardInStorage(boardName);
    notifyWorkspaceStateChanged();
  };

  return (
    <>
      {appState.openDialog === "newBoard" && (
        <Dialog onCloseRequest={handleClose} title={t("buttons.newBoard")}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createBoard();
            }}
          >
            <input
              type="text"
              placeholder={t("labels.inputNewBoardName")}
              style={{ minWidth: 500 }}
              value={newContainerName}
              onChange={(event) => {
                setNewContainerName(event.target.value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
            />
            {errorMessage && (
              <p
                role="alert"
                style={{ color: "#c92a2a", margin: "8px 0 0", fontSize: 14 }}
              >
                {errorMessage}
              </p>
            )}
            <Button
              type="submit"
              style={{
                whiteSpace: "nowrap",
                padding: "0 20px",
                marginTop: 10,
                width: 70,
                backgroundColor: "#6965db",
                color: "#fff",
              }}
              onSelect={() => {}}
            >
              {t("buttons.confirm")}
            </Button>
          </form>
        </Dialog>
      )}
    </>
  );
};
