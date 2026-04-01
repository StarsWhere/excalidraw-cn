import { MIME_TYPES } from "@editor/state/constants";
import { AbortError } from "@shared/lib/errors";
import { requireHandrawElectronApi } from "./handrawElectron";

type FILE_EXTENSION =
  | "gif"
  | "jpg"
  | "png"
  | "excalidraw.png"
  | "svg"
  | "excalidraw.svg"
  | "json"
  | "excalidraw"
  | "excalidrawlib";

export type NativeFileHandle = {
  kind: "native";
  path: string;
  name: string;
};

export type FileSystemHandle = NativeFileHandle;

export type ElectronFilePayload = {
  name: string;
  path: string;
  type: string;
  buffer: Uint8Array;
};

export type ElectronOpenDialogOptions = {
  kind?: "scene" | "image" | "library";
  multiple?: boolean;
  description?: string;
};

export type ElectronSaveDialogPayload = {
  buffer: Uint8Array;
  suggestedName: string;
  filters: {
    name: string;
    extensions: string[];
  }[];
  existingPath?: string | null;
};

type FileOpenResult = {
  file: File;
  fileHandle: FileSystemHandle | null;
};

export type ElectronFileOpenResult = FileOpenResult;

const FILTER_NAMES: Record<FILE_EXTENSION, string> = {
  gif: "GIF image",
  jpg: "JPEG image",
  png: "PNG image",
  "excalidraw.png": "Excalidraw PNG image",
  svg: "SVG image",
  "excalidraw.svg": "Excalidraw SVG image",
  json: "JSON file",
  excalidraw: "Handraw scene",
  excalidrawlib: "Handraw library",
};

const createAbortError = () => new AbortError();

const ensureElectronApi = () => requireHandrawElectronApi();

const toArrayBuffer = (buffer: Uint8Array | ArrayBuffer) => {
  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }

  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
};

export const electronFilePayloadToFile = (
  payload: ElectronFilePayload,
): FileOpenResult => {
  const file = new File([toArrayBuffer(payload.buffer)], payload.name, {
    type: payload.type,
  });

  return {
    file,
    fileHandle: {
      kind: "native",
      path: payload.path,
      name: payload.name,
    },
  };
};

const getDialogKind = (extensions?: FILE_EXTENSION[]) => {
  if (!extensions?.length) {
    return "scene";
  }

  if (extensions.every((extension) => extension === "excalidrawlib")) {
    return "library";
  }

  if (
    extensions.every((extension) =>
      ["gif", "jpg", "png", "svg"].includes(extension),
    )
  ) {
    return "image";
  }

  return "scene";
};

const getFileFilters = (extensions: FILE_EXTENSION[]) => {
  return extensions.map((extension) => ({
    name: FILTER_NAMES[extension],
    extensions:
      extension === "jpg"
        ? ["jpg", "jpeg"]
        : extension === "json"
        ? ["json", "excalidraw"]
        : [extension],
  }));
};

export const nativeFileSystemSupported = true;

export const fileOpen = async <M extends boolean | undefined = false>(opts: {
  extensions?: FILE_EXTENSION[];
  description: string;
  multiple?: M;
}): Promise<M extends true ? FileOpenResult[] : FileOpenResult> => {
  const desktop = ensureElectronApi();
  const result = await desktop.openFile({
    kind: getDialogKind(opts.extensions),
    multiple: opts.multiple ?? false,
    description: opts.description,
  });

  if (!result) {
    throw createAbortError();
  }

  if (Array.isArray(result)) {
    return result.map(electronFilePayloadToFile) as M extends true
      ? FileOpenResult[]
      : never;
  }

  return electronFilePayloadToFile(result) as M extends true
    ? never
    : FileOpenResult;
};

export const fileSave = async (
  blob: Blob,
  opts: {
    name: string;
    extension: FILE_EXTENSION;
    description: string;
    fileHandle?: FileSystemHandle | null;
  },
) => {
  const desktop = ensureElectronApi();
  const fileHandle = await desktop.saveFile({
    buffer: new Uint8Array(await blob.arrayBuffer()),
    suggestedName: `${opts.name}.${opts.extension}`,
    filters: getFileFilters([opts.extension]),
    existingPath: opts.fileHandle?.path ?? null,
  });

  if (!fileHandle) {
    throw createAbortError();
  }

  return fileHandle;
};

export const getMimeTypeFromHandle = (
  handle: FileSystemHandle | null,
): string | null => {
  if (!handle) {
    return null;
  }

  const ext = handle.path.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }

  let mappedKey: keyof typeof MIME_TYPES | null = null;

  if (ext === "excalidraw" || ext === "excalidrawlib") {
    mappedKey = ext;
  } else if (ext === "svg" || ext === "png" || ext === "gif") {
    mappedKey = ext;
  } else if (ext === "jpg" || ext === "jpeg") {
    mappedKey = "jpg";
  } else if (ext === "json") {
    mappedKey = "json";
  }

  return mappedKey ? MIME_TYPES[mappedKey] : null;
};
