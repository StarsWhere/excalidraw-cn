import React from "react";
import { t } from "../i18n";
import { AppState } from "../types";
import "./ExportDialog.scss";
import { ActionManager } from "../actions/manager";
import { Dialog } from "./Dialog";
import {
  getBoardListFromStorage,
  getCurrentBoardName,
  removeBoardFromStorage,
  selectBoardInStorage,
} from "../excalidraw-app/data/desktopState";
import { List, Popconfirm } from "antd";
import { CheckSquareOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { notifyDesktopStateChanged } from "../excalidraw-app/data/desktopEvents";

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

  return (
    <>
      {appState.openDialog === "switchBoard" && (
        <Dialog onCloseRequest={handleClose} title={t("buttons.switchBoard")}>
          <List>
            {boardList?.map((scene: string) => {
              return (
                <List.Item
                  key={scene}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 10,
                    borderBottom: `1px solid #e2e2e2`,
                  }}
                >
                  <span
                    style={{
                      flex: "auto",
                      cursor: "pointer",
                      color: `${
                        currentBoardName === scene ? "green" : "#333"
                      }`,
                    }}
                    onClick={async () => {
                      await selectBoardInStorage(scene);
                      notifyDesktopStateChanged();
                    }}
                  >
                    {currentBoardName === scene ? (
                      <CheckSquareOutlined
                        style={{ marginRight: 10, color: "green" }}
                      />
                    ) : null}
                    {scene}
                  </span>
                  <Popconfirm
                    title={`确定删除 ${scene} 吗?`}
                    onConfirm={async () => {
                      await removeBoardFromStorage(scene);
                      notifyDesktopStateChanged();
                    }}
                  >
                    <CloseCircleOutlined
                      style={{ display: "block", flex: 0, width: 20 }}
                    />
                  </Popconfirm>
                </List.Item>
              );
            })}
          </List>
        </Dialog>
      )}
    </>
  );
};
