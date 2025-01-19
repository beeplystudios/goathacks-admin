import { type ElementRef, forwardRef } from "react";
import { Label as AriaLabel, type LabelProps } from "react-aria-components";

export const Label = forwardRef<
  ElementRef<typeof AriaLabel>,
  Omit<LabelProps, "ref">
>((props, ref) => {
  return (
    <AriaLabel
      className="block text-sm font-medium text-white"
      {...props}
      ref={ref}
    />
  );
});
