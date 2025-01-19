"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import {
  Popover as AriaPopover,
  Dialog,
  DialogTrigger,
} from "react-aria-components";
import { cn } from "../../utils/cn";

export const PopoverTrigger = DialogTrigger;

export const Popover = forwardRef<
  ElementRef<typeof AriaPopover>,
  Omit<ComponentPropsWithoutRef<typeof AriaPopover>, "className">
>(({ children, ...props }, ref) => {
  return (
    <AriaPopover
      className={({ isEntering, isExiting, placement }) =>
        cn(
          "min-w-[var(--trigger-width)] rounded-md border-[0.0125rem] border-neutral-300/40 bg-neutral-400 bg-opacity-40 backdrop-blur-lg",
          "focus:outline-none",
          {
            "slide-in-from-top-2": placement === "bottom" && isEntering,
            "slide-in-from-bottom-2": placement === "top" && isEntering,
            "slide-in-from-left-2": placement === "right" && isEntering,
            "slide-in-from-right-2": placement === "left" && isEntering,
            "animate-in fade-in-0 fill-mode-forwards duration-150 ease-out":
              isEntering,
            "animate-out fade-out-0 fill-mode-forwards duration-150 ease-in":
              isExiting,
            "slide-out-to-bottom-2": placement === "top" && isExiting,
            "slide-out-to-left-2": placement === "right" && isExiting,
            "slide-out-to-top-2": placement === "bottom" && isExiting,
            "slide-out-to-right-2": placement === "left" && isExiting,
          }
        )
      }
      ref={ref}
      {...props}
    >
      {children}
    </AriaPopover>
  );
});

Popover.displayName = "Popover";

export const PopoverBody = forwardRef<
  ElementRef<typeof Dialog>,
  Omit<ComponentPropsWithoutRef<typeof Dialog>, "className">
>(({ children, ...props }, ref) => {
  return (
    <Dialog
      role="dialog"
      className="flex flex-col gap-2 p-4 outline-none"
      ref={ref}
      {...props}
    >
      {children}
    </Dialog>
  );
});

PopoverBody.displayName = "PopoverBody";
