import React from "react";
import { t } from "@shared/i18n";
import {
  getWorkspaceStateSnapshot,
  requireElectronApi,
  resetWorkspaceStateCache,
} from "@app/host/workspace";
import { notifyWorkspaceStateChanged } from "@app/host/workspace";

interface TopErrorBoundaryState {
  hasError: boolean;
  workspaceState: string;
}

export class TopErrorBoundary extends React.Component<
  any,
  TopErrorBoundaryState
> {
  state: TopErrorBoundaryState = {
    hasError: false,
    workspaceState: "",
  };

  render() {
    return this.state.hasError ? this.errorSplash() : this.props.children;
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(error, errorInfo);
    this.setState({
      hasError: true,
      workspaceState: JSON.stringify(getWorkspaceStateSnapshot(), null, 2),
    });
  }

  private selectTextArea(event: React.MouseEvent<HTMLTextAreaElement>) {
    if (event.target !== document.activeElement) {
      event.preventDefault();
      (event.target as HTMLTextAreaElement).select();
    }
  }

  private errorSplash() {
    return (
      <div className="ErrorSplash excalidraw">
        <div className="ErrorSplash-messageContainer">
          <div className="ErrorSplash-paragraph bigger align-center">
            {t("errorSplash.headingMain_pre")}
            <button
              onClick={() => {
                resetWorkspaceStateCache();
                this.setState({
                  hasError: false,
                  workspaceState: "",
                });
                notifyWorkspaceStateChanged();
              }}
            >
              {t("errorSplash.headingMain_button")}
            </button>
          </div>
          <div className="ErrorSplash-paragraph align-center">
            {t("errorSplash.clearCanvasMessage")}
            <button
              onClick={async () => {
                try {
                  await requireElectronApi().resetWorkspaceState();
                  resetWorkspaceStateCache();
                  this.setState({
                    hasError: false,
                    workspaceState: "",
                  });
                  notifyWorkspaceStateChanged();
                } catch (error: any) {
                  console.error(error);
                }
              }}
            >
              {t("errorSplash.clearCanvasMessage_button")}
            </button>
            <br />
            <div className="smaller">
              <span role="img" aria-label="warning">
                ⚠️
              </span>
              {t("errorSplash.clearCanvasCaveat")}
              <span role="img" aria-hidden="true">
                ⚠️
              </span>
            </div>
          </div>
          <div>
            <div className="ErrorSplash-paragraph">
              <div className="ErrorSplash-details">
                <label>{t("errorSplash.sceneContent")}</label>
                <textarea
                  rows={5}
                  onPointerDown={this.selectTextArea}
                  readOnly={true}
                  value={this.state.workspaceState}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
