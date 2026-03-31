import { restore } from "../../../../core/editor/io/restore";
import { ImportedDataState } from "../../../../core/editor/io/types";

export const loadScene = async (
  id: string | null,
  privateKey: string | null,
  localDataState: ImportedDataState | undefined | null,
) => {
  void id;
  void privateKey;

  const data = restore(localDataState || null, null, null);

  return {
    elements: data.elements,
    appState: data.appState,
    files: data.files,
    commitToHistory: false,
  };
};
