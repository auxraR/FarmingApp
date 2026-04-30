import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "./utils";

// Button configurations using CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ganadero-active active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-ganadero-active text-black hover:bg-green-400 shadow-md",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border-2 border-ganadero-active text-ganadero-active bg-transparent hover:bg-ganadero-active/10",
        secondary: "bg-gray-800 text-white hover:bg-gray-700",
        ghost: "hover:bg-white/5 text-gray-400 hover:text-white",
        link: "text-ganadero-active underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
