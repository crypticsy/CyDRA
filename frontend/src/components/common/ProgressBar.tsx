import { ProgressSpinner } from "primereact/progressspinner";

/**
 * Renders a centered ProgressSpinner with customizable container height.
 */
export function createProgressSpinner(heightVal = "100vh") {
  return (
    <div className={`w-full h-[${heightVal}] flex items-center justify-center`}>
      <ProgressSpinner
        style={{ width: "5rem", height: "5rem" }}
        strokeWidth="8"
        animationDuration=".2s"
      />
    </div>
  );
}
