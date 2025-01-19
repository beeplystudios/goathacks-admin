import { cva, type VariantProps } from "class-variance-authority";
import React, { forwardRef, useId, type ElementRef } from "react";
import { FocusRing } from "react-aria";
import {
  Button as AriaButton,
  Link,
  type ButtonProps as AriaButtonProps,
  type LinkProps,
} from "react-aria-components";
import { cn } from "../../utils/cn";
import { ThreeDotsLoading } from "./three-dots";

export const button = cva(
  [
    "rounded-md text-sm font-medium border-[0.0125rem] transition-colors whitespace-nowrap relative touch-none select-none shadow-inner",
    "focus:outline-none",
    "disabled:scale-100 active:scale-95",
    "disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100",
    "data-[loading=true]:!cursor-wait",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary border-primary-50 border-opacity-20 hover:bg-primary-400 disabled:hover:bg-primary",
        secondary:
          "bg-neutral-300 border-neutral-200/20 hover:bg-neutral-200/50 disabled:hover:bg-neutral-300",
        ghost:
          "border-transparent hover:bg-neutral-400 disabled:hover:bg-transparent",
        danger:
          "bg-neutral-400 text-feedback-error-primary border-feedback-error-primary hover:bg-neutral-300",
        disabled: "border-neutral-300 bg-neutral-400",
        none: "border-transparent",
      },
      size: {
        base: "h-8 px-4 py-1 text-sm",
        icon: "h-8 w-8 p-1 aspect-square",
        max: "h-max w-max px-4 py-1",
        fit: "h-fit w-fit",
      },
      fullWidth: {
        true: "w-full",
        false: "w-max",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "base",
      fullWidth: false,
    },
  }
);

export type ButtonProps<T> = Omit<T, "className" | "children"> &
  VariantProps<typeof button> & {
    isLoading?: boolean;
    children: React.ReactNode;
    leadingVisual?: React.ReactNode;
    trailingVisual?: React.ReactNode;
    align?: "start" | "center";
  };

export const Button = forwardRef<
  ElementRef<typeof AriaButton>,
  Omit<ButtonProps<AriaButtonProps>, "ref">
>(
  (
    {
      children,
      variant,
      size,
      fullWidth,
      isLoading,
      leadingVisual,
      trailingVisual,
      align = "center",
      ...props
    },
    ref
  ) => {
    const id = useId();
    const disabled = props.isDisabled || isLoading;

    return (
      <FocusRing focusRingClass="ring-[1.25px] ring-primary-100 ring-offset-0">
        <AriaButton
          className={cn(
            button({
              variant: props.isDisabled ? "disabled" : variant,
              size,
              fullWidth,
            })
          )}
          ref={ref}
          isDisabled={disabled}
          data-loading={isLoading}
          aria-describedby={id}
          {...props}
        >
          {isLoading && (
            <ThreeDotsLoading
              role="status"
              aria-live="polite"
              aria-atomic
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          )}

          <span
            id={id}
            aria-hidden={isLoading}
            className={cn(
              "flex items-center gap-2",
              align === "center" ? "justify-center" : "justify-start",
              isLoading ? "opacity-0" : "opacity-100"
            )}
          >
            {leadingVisual && leadingVisual}
            <span className="flex flex-col gap-1">{children}</span>
            {trailingVisual && trailingVisual}
          </span>
        </AriaButton>
      </FocusRing>
    );
  }
);

Button.displayName = "Button";

export const ButtonLink = forwardRef<
  ElementRef<typeof Link>,
  Omit<ButtonProps<LinkProps>, "ref" | "isLoading" | "slot"> & {
    // If true, use an HTML <a> tag instead of the react-aria <Link> component
    // This is useful for when you need to the client to do a full page refresh
    useAnchorTag?: boolean;
  }
>(
  (
    {
      children,
      variant,
      size,
      fullWidth,
      leadingVisual,
      trailingVisual,
      align = "center",
      useAnchorTag,
      ...props
    },
    ref
  ) => {
    const id = useId();

    const LinkElement = useAnchorTag ? "a" : Link;

    return (
      <FocusRing focusRingClass="ring-[1.25px] ring-primary-100 ring-offset-0">
        <LinkElement
          className={cn(
            button({
              variant: props.isDisabled ? "disabled" : variant,
              size,
              fullWidth,
            }),
            "block"
          )}
          ref={ref}
          aria-describedby={id}
          {...props}
        >
          <span
            id={id}
            className={cn(
              "flex h-full items-center gap-2",
              align === "center" ? "justify-center" : "justify-start"
            )}
          >
            {leadingVisual && leadingVisual}
            {children}
            {trailingVisual && trailingVisual}
          </span>
        </LinkElement>
      </FocusRing>
    );
  }
);
