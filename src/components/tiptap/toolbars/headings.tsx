"use client"

import React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToolbar } from "./toolbar-provider"
import { useMediaQuery } from "@/hooks/use-media-querry"
import { MobileToolbarGroup, MobileToolbarItem } from "./mobile-toolbar-group"

const levels = [1, 2, 3, 4] as const

export const HeadingsToolbar = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { editor } = useToolbar()
    const isMobile = useMediaQuery("(max-width: 640px)")
    const activeLevel = levels.find((level) => editor?.isActive("heading", { level }))

    if (isMobile) {
      return (
        <MobileToolbarGroup label={activeLevel ? `H${activeLevel}` : "Normal"}>
          <MobileToolbarItem
            onClick={() => editor?.chain().focus().setParagraph().run()}
            active={!editor?.isActive("heading")}
          >
            기본
          </MobileToolbarItem>
          {levels.map((level) => (
            <MobileToolbarItem
              key={level}
              onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
              active={editor?.isActive("heading", { level })}
            >
              제목 {level}
            </MobileToolbarItem>
          ))}
        </MobileToolbarGroup>
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-max gap-1 px-3 font-normal",
                  editor?.isActive("heading") && "bg-accent",
                  className,
                )}
                ref={ref}
                {...props}
              >
                {activeLevel ? `제목 ${activeLevel}` : "기본"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className={cn("flex items-center gap-2 h-fit", !editor?.isActive("heading") && "bg-accent")}
              >
                기본
              </DropdownMenuItem>
              {levels.map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
                  className={cn("flex items-center gap-2", editor?.isActive("heading", { level }) && "bg-accent")}
                >
                  제목 {level}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <span>Headings</span>
        </TooltipContent>
      </Tooltip>
    )
  },
)

HeadingsToolbar.displayName = "HeadingsToolbar"

