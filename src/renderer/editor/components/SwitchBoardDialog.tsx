import React from "react";
import { t } from "@shared/i18n";
import { AppState } from "../state/types";
import "./ExportDialog.scss";
import { ActionManager } from "../actions/manager";
import { Dialog } from "@shared/ui/Dialog";
import ConfirmDialog from "@shared/ui/ConfirmDialog";
import {
  getBoardListFromStorage,
  getCurrentBoardName,
  removeBoardFromStorage,
  selectBoardInStorage,
} from "@app/host/workspace";
import { notifyWorkspaceStateChanged } from "@app/host/workspace";
import { TrashIcon, checkIcon } from "./icons";

export const SwitchBoardDialog = ({
  appState,
  setAppState,
}: {
  appState: AppState;
  setAppState: React.Component<any, AppState>["setState"];
  actionManager: ActionManager;
}) => {
  const handleClose = React.useCallback(() => {
    setAppState({ openDialog: null });
  }, [setAppState]);

  const boardList = getBoardListFromStorage();
  const currentBoardName = getCurrentBoardName();
  const [boardPendingDelete, setBoardPendingDelete] = React.useState<
    string | null
  >(null);

  return (
    <>
      {appState.openDialog === "switchBoard" && (
        <Dialog onCloseRequest={handleClose} title={t("buttons.switchBoard")}>
          <div>
            {boardList?.map((scene: string) => {
              const isCurrentBoard = currentBoardName === scene;

              return (
                <div
                  key={scene}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 10,
                    borderBottom: "1px solid #e2e2e2",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      flex: "auto",
                      cursor: "pointer",
                      color: isCurrentBoard ? "green" : "#333",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: 0,
                      background: "transparent",
                      padding: 0,
                      textAlign: "left",
                    }}
                    onClick={async () => {
                      await selectBoardInStorage(scene);
                      notifyWorkspaceStateChanged();
                    }}
                  >
                    {isCurrentBoard ? (
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          color: "green",
                        }}
                      >
                        {checkIcon}
                      </span>
                    ) : null}
                    {scene}
                  </button>
                  <button
                    type="button"
                    aria-label={`删除 ${scene}`}
                    title={`删除 ${scene}`}
                    onClick={() => setBoardPendingDelete(scene)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: 0,
                      background: "transparent",
                      color: "#c92a2a",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {TrashIcon}
                  </button>
                </div>
              );
            })}
          </div>
        </Dialog>
      )}
      {boardPendingDelete && (
        <ConfirmDialog
          title={`确定删除 ${boardPendingDelete} 吗?`}
          onConfirm={async () => {
            await removeBoardFromStorage(boardPendingDelete);
            setBoardPendingDelete(null);
            notifyWorkspaceStateChanged();
          }}
          onCancel={() => setBoardPendingDelete(null)}
        >
          <p>删除后将无法恢复这个画布。</p>
        </ConfirmDialog>
      )}
    </>
  );
};
