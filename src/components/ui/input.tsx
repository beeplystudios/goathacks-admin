import { type VariantProps, cva } from "class-variance-authority";
import { type ElementRef, forwardRef, type CSSProperties } from "react";
import {
  Input as AriaInput,
  type InputProps as AriaInputProps,
} from "react-aria-components";
import { cn } from "../../utils/cn";
import useMeasure from "react-use-measure";

const input = cva(
  [
    "h-8 px-2 py-1 text-sm",
    "rounded-md bg-neutral-400 border-[0.0125rem] border-neutral-300/40 hover:bg-neutral-300/60 disabled:hover:bg-neutral-400 placeholder:text-neutral-50 placeholder:text-xs shadow-inner",
    "focus:outline-none focus-visible:ring-[1.25px] focus-visible:ring-primary-100 focus-visible:ring-offset-0",
    "disabled:opacity-70 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
      visual: {
        leading: "pl-8",
        trailing: "pr-[var(--input-padding-right)]",
        "leading-trailing": "pl-8 pr-[var(--input-padding-right)]",
      },
      invalid: {
        true: "!border-feedback-error-primary focus-visible:!ring-feedback-error-primary",
      },
    },
    defaultVariants: {
      fullWidth: false,
      invalid: false,
    },
  }
);

export type InputProps = Omit<AriaInputProps, "className" | "disabled"> &
  Omit<VariantProps<typeof input>, "visual" | "invalid"> & {
    leadingVisual?: React.ReactNode;
    trailingVisual?: React.ReactNode;
    isDisabled?: boolean;
  };

export const Input = forwardRef<
  ElementRef<typeof AriaInput>,
  Omit<InputProps, "ref">
>(({ fullWidth, leadingVisual, trailingVisual, isDisabled, ...props }, ref) => {
  const [trailingVisualRef, bounds] = useMeasure();
  const visual = (() => {
    if (leadingVisual && trailingVisual) {
      return "leading-trailing";
    } else if (leadingVisual) {
      return "leading";
    } else if (trailingVisual) {
      return "trailing";
    }

    return undefined;
  })();

  return (
    <div
      className={cn("relative select-none", fullWidth ? "w-full" : "w-max")}
      style={
        {
          "--input-padding-right": `max(${bounds.width}px, 2rem)`,
        } as CSSProperties
      }
    >
      {leadingVisual && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 pt-0.5">
          {leadingVisual}
        </div>
      )}
      <AriaInput
        className={({ isInvalid }) =>
          input({
            fullWidth,
            visual,
            invalid: isInvalid,
          })
        }
        disabled={isDisabled}
        {...props}
        ref={ref}
      />
      {trailingVisual && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 pt-0.5"
          ref={trailingVisualRef}
        >
          {trailingVisual}
        </div>
      )}
    </div>
  );
});

Input.displayName = "Input";
