import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { FaPlus, FaMinus } from "react-icons/fa6";

export const dialogClassName = "capitalize";

export const normalLabelClassName = "!text-xs !whitespace-nowrap";
export const normalLabelInputClassName =
  "w-full flex items-center align-middle justify-center space-x-4";
export const normalInputBaseClassName =
  "!bg-[#deecfc] hover:!border-[#3b82f6] active:!outline-4 active:!outline-offset-0 active:!outline-[#bfdbfe] focus:!outline-4 focus:!outline-offset-0 focus:!outline-[#bfdbfe] focus:!outline-none";

export function createDisbaledInput(text, title: string, key?: string) {
  return (
    <div key={key} className={normalLabelInputClassName}>
      <div className={normalLabelClassName}>{title} :</div>
      <input
        key={key}
        type="text"
        value={text}
        disabled={true}
        maxLength={50} // Restrict the input to 50 characters
        className="w-full p-2 border rounded-md border-[#9ca3af]/20 !bg-[#deecfc]/20 text-black/40 capitalize text-xs"
      />
    </div>
  );
}

export function createTextInput(
  title: string,
  value: any,
  setValue: (value: any) => void,
  placeholder?: string,
  onKeyEvent?: (e: any) => void
) {
  return (
    <div className={normalLabelInputClassName}>
      <div className={normalLabelClassName}>{title} :</div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={50} // Restrict the input to 50 characters
        className={
          "w-full px-2.5 py-2 border rounded-md border-[#9ca3af] text-xs " +
          normalInputBaseClassName
        }
        placeholder={placeholder}
        onKeyDown={onKeyEvent}
      />
    </div>
  );
}

export function createNumberInput(
  title: string,
  value: any,
  setValue: (value: any) => void,
  minVal = 0,
  maxVal = 1,
) {
  return (
    <div className={normalLabelInputClassName}>
      <div className={normalLabelClassName}>{title} :</div>
      <InputNumber
        inputId="horizontal-buttons"
        value={value}
        onChange={(e) => setValue(parseFloat(e.value.toFixed(2)))}
        mode="decimal"
        min={minVal}
        max={maxVal}
        step={0.05}
        showButtons
        buttonLayout="horizontal"
        decrementButtonIcon={<FaMinus size={12} />}
        incrementButtonIcon={<FaPlus size={12} />}
        className="space-x-3 h-9 "
        inputClassName="!bg-[#deecfc] !text-xs "
        decrementButtonClassName={
          "text-white px-3 rounded-md " +
          (value < minVal + 0.01 ? "bg-[#deecfc]" : "bg-red-600")
        }
        incrementButtonClassName={
          "text-white px-3 rounded-md " +
          (value > maxVal - 0.01 ? "bg-[#deecfc]" : "bg-lime-600")
        }
      />
    </div>
  );
}

export function createDropDown(
  defaultValue: any,
  value: any,
  setValue: (value: any) => void,
  disabled: boolean,
  options: any,
  optionsLabel: string,
  placeholder: string
) {
  return (
    <Dropdown
      value={value}
      disabled={disabled}
      defaultValue={defaultValue}
      onChange={(e) => setValue(e.value)}
      options={options || []}
      optionLabel={optionsLabel}
      placeholder={placeholder}
      className={normalInputBaseClassName + " !text-xs "}
      panelClassName="text-xs border border-2 border-[#9ca3af] rounded-lg capitalize"
    />
  );
}

export function createCheckBox(value: any, setValue: (value: any) => void) {
  return (
    <label className="flex items-center cursor-pointer relative">
      <input
        type="checkbox"
        value={value}
        onChange={(e) => setValue(e.target.checked)}
        className="peer h-5 w-5 cursor-pointer transition-all appearance-none bg-[#deecfc] border rounded border-[#9ca3af] hover:!border-[#3b82f6] "
      />
      <span className="absolute opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          ></path>
        </svg>
      </span>
    </label>
  );
}
