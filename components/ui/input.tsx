import { cn } from "@/lib/utils"
import * as React from "react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fb] px-3 py-2 text-sm text-[#0f172a] shadow-sm transition-shadow placeholder:text-[#94a3b8] focus-visible:border-[#3b82f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/20 disabled:cursor-not-allowed disabled:opacity-50",
          type === "file" &&
            "p-0 pr-3 italic text-[#94a3b8] file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-[#e2e8f0] file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-[#374151]",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
