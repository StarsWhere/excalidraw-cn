// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Document {
  fonts?: {
    ready?: Promise<void>;
    check?: (font: string, text?: string) => boolean;
    load?: (font: string, text?: string) => Promise<FontFace[]>;
    addEventListener?(
      type: "loading" | "loadingdone" | "loadingerror",
      listener: (this: Document, ev: Event) => any,
    ): void;
  };
}

interface Window {
  ClipboardItem: any;
  __EXCALIDRAW_SHA__: string | undefined;
  EXCALIDRAW_EXPORT_SOURCE: string;
  EXCALIDRAW_THROTTLE_RENDER: boolean | undefined;
}

interface CanvasRenderingContext2D {
  roundRect?: (
    x: number,
    y: number,
    width: number,
    height: number,
    radii:
      | number
      | [number]
      | [number, number]
      | [number, number, number]
      | [number, number, number, number],
  ) => void;
}

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: Record<string, string | undefined>;
};

declare const global: typeof globalThis;

declare const __dirname: string;

declare const Buffer: {
  from(data: string, encoding?: string): Uint8Array;
};

type Buffer = Uint8Array;

interface Clipboard extends EventTarget {
  write(data: any[]): Promise<void>;
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type ValueOf<T> = T[keyof T];

type Merge<M, N> = Omit<M, keyof N> & N;

type SubtypeOf<Supertype, Subtype extends Supertype> = Subtype;

type ResolutionType<T extends (...args: any) => any> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

type MarkOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type MarkRequired<T, RK extends keyof T> = Exclude<T, RK> &
  Required<Pick<T, RK>>;

type MarkNonNullable<T, K extends keyof T> = {
  [P in K]-?: P extends K ? NonNullable<T[P]> : T[P];
} & { [P in keyof T]: T[P] };

type NonOptional<T> = Exclude<T, undefined>;

type TEXtChunk = { name: "tEXt"; data: Uint8Array };

declare module "png-chunk-text" {
  function encode(
    name: string,
    value: string,
  ): { name: "tEXt"; data: Uint8Array };
  function decode(data: Uint8Array): { keyword: string; text: string };
}
declare module "png-chunks-encode" {
  function encode(chunks: TEXtChunk[]): Uint8Array;
  export = encode;
}
declare module "png-chunks-extract" {
  function extract(buffer: Uint8Array): TEXtChunk[];
  export = extract;
}

type SignatureType<T> = T extends (...args: infer R) => any ? R : never;
type CallableType<T extends (...args: any[]) => any> = (
  ...args: SignatureType<T>
) => ReturnType<T>;

type ForwardRef<T, P = any> = Parameters<
  CallableType<React.ForwardRefRenderFunction<T, P>>
>[1];

interface Blob {
  name?: string;
  path?: string;
}

declare module "*.scss";

declare module "fs";
declare module "util";
declare module "path";

interface ArrayBuffer {
  _brand?: "ArrayBuffer";
}
interface Uint8Array {
  _brand?: "Uint8Array";
}

declare module "image-blob-reduce" {
  import { PicaResizeOptions, Pica } from "pica";
  namespace ImageBlobReduce {
    interface ImageBlobReduce {
      toBlob(file: File, options: ImageBlobReduceOptions): Promise<Blob>;
      _create_blob(
        this: { pica: Pica },
        env: {
          out_canvas: HTMLCanvasElement;
          out_blob: Blob;
        },
      ): Promise<any>;
    }

    interface ImageBlobReduceStatic {
      new (options?: any): ImageBlobReduce;
      (options?: any): ImageBlobReduce;
    }

    interface ImageBlobReduceOptions extends PicaResizeOptions {
      max: number;
    }
  }
  const reduce: ImageBlobReduce.ImageBlobReduceStatic;
  export = reduce;
}
