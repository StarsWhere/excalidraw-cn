import React, { useEffect, useRef, useState } from "react";
import { KEYS } from "@shared/lib/keys";

type InputPreviewProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "onChange"
> & {
  defaultValue?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onSave?: (value: string) => void;
};

const normalizeValue = (
  value: InputPreviewProps["defaultValue"],
): string => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return value?.toString() ?? "";
};

function InputPreview(props: InputPreviewProps) {
  const { defaultValue, onChange, onSave, style, ...extraProps } = props || {};

  const [isEditable, setIsEditable] = useState(false);
  const [value, setValue] = useState(normalizeValue(defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommitRef = useRef(false);

  useEffect(() => {
    setValue(normalizeValue(defaultValue));
  }, [defaultValue]);

  useEffect(() => {
    if (!isEditable) {
      return;
    }

    const input = inputRef.current;
    input?.focus();
    input?.select();
  }, [isEditable]);

  const commit = () => {
    skipBlurCommitRef.current = false;
    setIsEditable(false);
    onSave?.(value);
  };

  const reset = () => {
    skipBlurCommitRef.current = false;
    setValue(normalizeValue(defaultValue));
    setIsEditable(false);
  };

  if (isEditable) {
    return (
      <input
        ref={inputRef}
        value={value}
        style={{ minWidth: 200, ...style }}
        onChange={(event) => {
          setValue(event.target.value);
          onChange?.(event);
        }}
        onBlur={() => {
          if (skipBlurCommitRef.current) {
            skipBlurCommitRef.current = false;
            return;
          }
          commit();
        }}
        onKeyDown={(event) => {
          if (event.key === KEYS.ENTER) {
            event.preventDefault();
            skipBlurCommitRef.current = true;
            commit();
          }

          if (event.key === KEYS.ESCAPE) {
            event.preventDefault();
            skipBlurCommitRef.current = true;
            reset();
          }

          extraProps.onKeyDown?.(event);
        }}
        {...extraProps}
      />
    );
  }
  return (
    <span
      title={`画布名称: ${value || normalizeValue(defaultValue)}`}
      style={{ cursor: "pointer", whiteSpace: "nowrap", color: "#999" }}
      onClick={() => {
        setIsEditable(true);
      }}
    >
      {value}
    </span>
  );
}

export default InputPreview;
