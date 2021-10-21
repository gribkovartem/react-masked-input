import React, {
  ChangeEvent,
  FC,
  HTMLProps,
  memo,
  useEffect,
  useRef,
  cloneElement,
  FocusEvent,
} from "react";
import { DEFAULT_MASK_SYMBOL } from "./constants";
import { convertMaskToArray, getInputMask } from "./helpers";
import { useMaskedInput } from "./useMaskedInput";
import { TypeOfProcess } from "./types";

export interface MaskedInputProps extends HTMLProps<HTMLInputElement> {
  mask: string;
  maskSymbol?: string;
  children?: JSX.Element;
}

const MaskedInputRoot: FC<MaskedInputProps> = ({
  children,
  value,
  mask,
  maskSymbol = DEFAULT_MASK_SYMBOL,
  onChange,
  onBlur,
  onFocus,
  ...rest
}) => {
  const { inputData, setInputData, getInputData } = useMaskedInput(
    (value as string) ?? "",
    { mask, maskSymbol }
  );
  const maskChars = convertMaskToArray(mask);
  const initialValue = getInputMask(maskChars);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    inputRef.current.setSelectionRange(
      inputData.caretPosition,
      inputData.caretPosition
    );

    if (onChange) {
      onChange({ target: inputRef.current });
    }
  }, [inputRef, inputData, onChange]);

  useEffect(() => {
    setInputData({
      ...inputData,
      value: initialValue,
      caretPosition: initialValue.indexOf(maskSymbol),
    });
  }, [mask]);

  useEffect(() => {
    if (!value || value === inputData.value) {
      return;
    }

    setInputData({ ...inputData, value: value as string });
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const input = e.target as HTMLInputElement;
    const typedCharacter = (e.nativeEvent as InputEvent).data;
    let typeOfProcess = null;

    if (input.value.length > inputData.value.length) {
      typeOfProcess = TypeOfProcess.TYPING;
    } else if (
      input.value.length < inputData.value.length &&
      typedCharacter === null
    ) {
      typeOfProcess = TypeOfProcess.REMOVING;
    } else {
      typeOfProcess = TypeOfProcess.REPLACING;
    }

    if (typeOfProcess !== null) {
      const data = getInputData(typeOfProcess)(input);
      if (data) {
        setInputData(data);
      }
    }
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (!inputData.touched || (inputData.touched && inputData.value === "")) {
      setInputData({
        ...inputData,
        value: initialValue,
        caretPosition: initialValue.indexOf(maskSymbol),
      });
    } else {
      setInputData({
        ...inputData,
        caretPosition: inputData.value.indexOf(maskSymbol),
      });
    }

    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (inputData.touched && inputData.value !== initialValue) {
      if (onBlur) {
        onBlur(e);
      }
      return;
    }

    setInputData({ ...inputData, value: "" });

    if (onBlur) {
      onBlur(e);
    }
  };

  return children ? (
    cloneElement(children, {
      ...rest,
      ref: inputRef,
      value: inputData.value,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
    })
  ) : (
    <input
      {...rest}
      ref={inputRef}
      value={inputData.value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};

const MaskedInput = memo(MaskedInputRoot);

export { MaskedInput };
