import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        // Primary - プロジェクトのメインカラー（紫-青グラデーション）
        default:
          "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:from-[#5a6fd8] hover:to-[#6a4190] hover:shadow-xl hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        
        // Modern - 既存のbtn-modernスタイルを統合
        modern:
          "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:from-[#5a6fd8] hover:to-[#6a4190] hover:shadow-xl hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-500",
        
        // Gradient - より鮮やかなグラデーション
        gradient:
          "bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white shadow-lg hover:shadow-2xl hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/25 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        
        // Glass - ガラス効果
        glass:
          "bg-white/10 backdrop-blur-md border border-white/20 text-foreground shadow-lg hover:bg-white/20 hover:shadow-xl hover:-translate-y-0.5 dark:bg-black/10 dark:border-white/10 dark:hover:bg-black/20",
        
        // Success - 成功アクション用
        success:
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:-translate-y-0.5",
        
        // Warning - 警告アクション用
        warning:
          "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:from-amber-600 hover:to-orange-700 hover:shadow-xl hover:-translate-y-0.5",
        
        // Destructive - 削除アクション用
        destructive:
          "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-0.5",
        
        // Outline - アウトライン
        outline:
          "border-2 border-[#667eea]/30 bg-background/50 backdrop-blur-sm text-[#667eea] shadow-sm hover:bg-[#667eea]/10 hover:border-[#667eea] hover:shadow-md hover:-translate-y-0.5 dark:border-[#667eea]/50 dark:text-[#667eea] dark:hover:bg-[#667eea]/20",
        
        // Secondary - セカンダリアクション用
        secondary:
          "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 shadow-sm hover:from-slate-200 hover:to-slate-300 hover:shadow-md hover:-translate-y-0.5 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600",
        
        // Ghost - 控えめなアクション用
        ghost:
          "text-[#667eea] hover:bg-[#667eea]/10 hover:text-[#667eea] backdrop-blur-sm hover:shadow-sm hover:-translate-y-0.5 dark:text-[#667eea] dark:hover:bg-[#667eea]/20",
        
        // Link - リンクスタイル
        link:
          "text-[#667eea] underline-offset-4 hover:underline hover:text-[#764ba2] transition-colors",
        
        // Soft - ソフトなアクション用
        soft:
          "bg-[#667eea]/10 text-[#667eea] shadow-sm hover:bg-[#667eea]/20 hover:shadow-md hover:-translate-y-0.5 dark:bg-[#667eea]/20 dark:hover:bg-[#667eea]/30",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-8 text-base rounded-xl",
        xl: "h-14 px-10 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  gradient?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, gradient, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({
            variant: gradient ? "gradient" : variant,
            size,
            className,
          })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
