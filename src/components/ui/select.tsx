"use client";

import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import {
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  Header,
  ListBoxItem as Item,
  ListBox,
  Section,
  SelectContext,
  Text,
} from "react-aria-components";
import { cn } from "../../utils/cn";
import { Button } from "./button";
import { Popover } from "./popover";

export const Select = forwardRef<
  ElementRef<typeof AriaSelect>,
  Omit<ComponentPropsWithoutRef<typeof AriaSelect>, "onSelectionChange"> & {
    onChange?: ComponentPropsWithoutRef<typeof AriaSelect>["onSelectionChange"];
  }
>(({ onChange, className, ...props }, ref) => (
  <SelectContext.Provider value={{ placeholder: props.placeholder }}>
    <AriaSelect
      onSelectionChange={onChange}
      ref={ref}
      className={cn(className, "flex flex-col gap-2")}
      {...props}
    />
  </SelectContext.Provider>
));

export const SelectItem = forwardRef<
  ElementRef<typeof Item>,
  Omit<ComponentPropsWithoutRef<typeof Item>, "className">
>((props, ref) => {
  return (
    <Item
      className={({ isSelected, isDisabled, isFocused, isHovered }) =>
        cn(
          "mx-1.5 my-1.5 flex cursor-default flex-col rounded-md px-4 py-1.5 text-sm text-neutral-50",
          {
            "outline-none": isFocused,
            "bg-neutral-200/40 text-white": isHovered && !isDisabled,
            "bg-neutral-200/50 text-white": isSelected,
            "cursor-not-allowed opacity-70": isDisabled,
          }
        )
      }
      ref={ref}
      {...props}
    />
  );
});

SelectItem.displayName = "SelectItem";

export const SelectTrigger = forwardRef<
  ElementRef<typeof AriaSelectValue>,
  Omit<
    ComponentPropsWithoutRef<typeof AriaSelectValue> & {
      btnProps?: Omit<ComponentPropsWithoutRef<typeof Button>, "children">;
      leadingVisual?: React.ReactNode;
      hideDescription?: boolean;
    },
    "className"
  >
>(({ btnProps, leadingVisual, hideDescription = false, ...props }, ref) => {
  return (
    <Button
      {...btnProps}
      size="max"
      trailingVisual={<ChevronDown className="ml-auto h-4 w-4" />}
    >
      <span
        className={cn(
          "flex flex-col items-start gap-0.5",
          !!leadingVisual && "my-2"
        )}
      >
        {!!leadingVisual && leadingVisual}
        <AriaSelectValue
          ref={ref}
          className={cn(
            hideDescription
              ? "[&>*[slot='description']]:hidden"
              : "flex flex-col items-start [&>*[slot='description']]:mb-1 [&>*[slot='description']]:mr-4 [&>*[slot='label']]:mt-1"
          )}
          {...props}
        />
      </span>
    </Button>
  );
});

SelectTrigger.displayName = "SelectTrigger";

export const SelectBody = forwardRef<
  ElementRef<typeof ListBox>,
  Omit<ComponentPropsWithoutRef<typeof ListBox>, "className"> & {
    popoverProps?: Omit<ComponentPropsWithoutRef<typeof Popover>, "className">;
  }
>(({ popoverProps, children, ...props }, ref) => {
  return (
    <Popover {...popoverProps}>
      <ListBox className="outline-none" ref={ref} {...props}>
        {children}
      </ListBox>
    </Popover>
  );
});

SelectBody.displayName = "SelectBody";

export const SelectSection = Section;

export const SelectHeading = forwardRef<
  ElementRef<typeof Header>,
  Omit<ComponentPropsWithoutRef<typeof Header>, "className">
>((props, ref) => {
  return (
    <Header
      className="mx-1.5 border-b-[0.0125rem] border-neutral-300/40 px-4 py-2 text-xs font-medium"
      ref={ref}
      {...props}
    />
  );
});

SelectHeading.displayName = "SelectHeading";

export const SelectLabel = forwardRef<
  ElementRef<typeof Text>,
  Omit<ComponentPropsWithoutRef<typeof Text>, "slot" | "className">
>((props, ref) => {
  return <Text {...props} ref={ref} slot="label" className="text-white" />;
});

SelectLabel.displayName = "SelectLabel";

export const SelectDescription = forwardRef<
  ElementRef<typeof Text>,
  Omit<ComponentPropsWithoutRef<typeof Text>, "slot" | "className">
>((props, ref) => {
  return (
    <Text
      {...props}
      ref={ref}
      slot="description"
      className="text-sm text-neutral-50"
    />
  );
});
