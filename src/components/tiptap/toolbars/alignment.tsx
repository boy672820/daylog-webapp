"use client"

import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Check, ChevronDown } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-querry"
import { MobileToolbarGroup, MobileToolbarItem } from "./mobile-toolbar-group"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToolbar } from "./toolbar-provider"

export const AlignmentTooolbar = () => {
  const { editor } = useToolbar()
  const isMobile = useMediaQuery("(max-width: 640px)")
  const handleAlign = (value: string) => {
    editor?.chain().focus().setTextAlign(value).run()
  }

  const isDisabled = editor?.isActive("image") ?? editor?.isActive("video") ?? !editor ?? false

  const currentTextAlign = () => {
    if (editor?.isActive({ textAlign: "left" })) {
      return "left"
    }
    if (editor?.isActive({ textAlign: "center" })) {
      return "center"
    }
    if (editor?.isActive({ textAlign: "right" })) {
      return "right"
    }
    if (editor?.isActive({ textAlign: "justify" })) {
      return "justify"
    }

    return "left"
  }

  const alignmentOptions = [
    {
      name: "왼쪽 정렬",
      value: "left",
      icon: <AlignLeft className="h-4 w-4" />,
    },
    {
      name: "가운데 정렬",
      value: "center",
      icon: <AlignCenter className="h-4 w-4" />,
    },
    {
      name: "오른쪽 정렬",
      value: "right",
      icon: <AlignRight className="h-4 w-4" />,
    },
    {
      name: "기본 정렬",
      value: "justify",
      icon: <AlignJustify className="h-4 w-4" />,
    },
  ]

  const findIndex = (value: string) => {
    return alignmentOptions.findIndex((option) => option.value === value)
  }

  if (isMobile) {
    return (
      <MobileToolbarGroup label={alignmentOptions[findIndex(currentTextAlign())]?.name ?? "Left Align"}>
        {alignmentOptions.map((option, index) => (
          <MobileToolbarItem
            key={index}
            onClick={() => handleAlign(option.value)}
            active={currentTextAlign() === option.value}
          >
            <span className="mr-2">{option.icon}</span>
            {option.name}
          </MobileToolbarItem>
        ))}
      </MobileToolbarGroup>
    )
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger disabled={isDisabled} asChild>
            <Button variant="ghost" size="sm" className="h-8 w-max font-normal">
              <span className="mr-2">{alignmentOptions[findIndex(currentTextAlign())]?.icon}</span>
              {alignmentOptions[findIndex(currentTextAlign())]?.name}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Text Alignment</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        loop
        onCloseAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        <DropdownMenuGroup className=" w-40">
          {alignmentOptions.map((option, index) => (
            <DropdownMenuItem
              onSelect={() => {
                handleAlign(option.value)
              }}
              key={index}
            >
              <span className="mr-2">{option.icon}</span>
              {option.name}

              {option.value === currentTextAlign() && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

