import {
  getTransformHandles,
  TransformHandleDirection,
} from "../../core/editor/elements/transformHandles";
import { ExcalidrawElement } from "../../core/editor/elements/types";
import { Keyboard, KeyboardModifiers, Pointer } from "./ui";

const mouse = new Pointer("mouse");
const { h } = window;

export const resize = (
  element: ExcalidrawElement,
  handleDir: TransformHandleDirection,
  delta: [number, number],
  keyboardModifiers: KeyboardModifiers = {},
) => {
  mouse.select(element);
  const handle = getTransformHandles(element, h.state.zoom, "mouse")[
    handleDir
  ]!;
  const clientX = handle[0] + handle[2] / 2;
  const clientY = handle[1] + handle[3] / 2;
  Keyboard.withModifierKeys(keyboardModifiers, () => {
    mouse.reset();
    mouse.downAt(clientX, clientY);
    mouse.moveTo(clientX + delta[0], clientY + delta[1]);
    mouse.upAt();
  });
};

export const rotate = (
  element: ExcalidrawElement,
  deltaX: number,
  deltaY: number,
  keyboardModifiers: KeyboardModifiers = {},
) => {
  mouse.select(element);
  const handle = getTransformHandles(element, h.state.zoom, "mouse").rotation!;
  const clientX = handle[0] + handle[2] / 2;
  const clientY = handle[1] + handle[3] / 2;

  Keyboard.withModifierKeys(keyboardModifiers, () => {
    mouse.reset();
    mouse.downAt(clientX, clientY);
    mouse.moveTo(clientX + deltaX, clientY + deltaY);
    mouse.upAt();
  });
};
