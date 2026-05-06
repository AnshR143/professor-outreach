import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#304674] text-white",
        secondary: "border-transparent bg-[#f1f5f9] text-[#475569]",
        outline: "border-[#e2e8f0] bg-white text-[#475569]",
        success: "border-transparent bg-[#dcfce7] text-[#15803d]",
        warning: "border-transparent bg-[#fef3c7] text-[#b45309]",
        destructive: "border-transparent bg-[#fee2e2] text-[#dc2626]",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
