import * as React from "react";
import { cn } from "@/lib/utils"; // Adjust based on your utils setup

// Define the props for the Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "block w-full border-none focus:border-none focus:none",
        "focus-visible:outline-none",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export { Input };