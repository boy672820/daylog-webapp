'use client';

import {
  Heading1,
  Heading2,
  Heading3,
  ListOrdered,
  List,
  Code2,
  ChevronRight,
  // Quote,
  // ImageIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CodeSquare,
  TextQuote,
} from 'lucide-react';
import { FloatingMenu } from '@tiptap/react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/core';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';

interface CommandItemType {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string;
  command: (editor: Editor) => void;
  group: string;
}

type CommandGroupType = {
  group: string;
  items: Omit<CommandItemType, 'group'>[];
};

const groups: CommandGroupType[] = [
  {
    group: '기본 블록',
    items: [
      {
        title: '텍스트 & 마크다운',
        description: '마크다운 문법을 이용해 작성을 시작하세요.',
        icon: ChevronRight,
        keywords: 'paragraph text',
        command: (editor) => editor.chain().focus().clearNodes().run(),
      },
      {
        title: '제목1',
        description: '섹션 제목 (대)',
        icon: Heading1,
        keywords: 'h1 title header',
        command: (editor) =>
          editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        title: '제목2',
        description: '섹션 제목 (중)',
        icon: Heading2,
        keywords: 'h2 subtitle',
        command: (editor) =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        title: '제목3',
        description: '섹션 제목 (소)',
        icon: Heading3,
        keywords: 'h3 subheader',
        command: (editor) =>
          editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        title: '글머리 기호 목록',
        description: '간단한 글머리 기호 목록을 생성하세요.',
        icon: List,
        keywords: 'unordered ul bullets',
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        title: '번호 매기기 목록',
        description: '번호가 매겨진 번호를 생성하세요.',
        icon: ListOrdered,
        keywords: 'numbered ol',
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        title: '코드 블록',
        description: '코드 블록을 작성하세요.',
        icon: Code2,
        keywords: 'code snippet pre',
        command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
      },
      // {
      //   title: "이미지",
      //   description: "파일을 업로드하세요.",
      //   icon: ImageIcon,
      //   keywords: "image picture photo",
      //   command: (editor) => editor.chain().focus().insertImagePlaceholder().run(),
      // },
      {
        title: '구분선',
        description: '블록을 시각적으로 나눕니다.',
        icon: Minus,
        keywords: 'horizontal rule divider',
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
  },
  {
    group: '인라인',
    items: [
      {
        title: '코드',
        description: '코드 스니펫을 작성하세요.',
        icon: CodeSquare,
        keywords: 'code inline',
        command: (editor) => editor.chain().focus().toggleCode().run(),
      },
      {
        title: '인용',
        description: '인용문을 작성하세요.',
        icon: TextQuote,
        keywords: 'blockquote quote',
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
      },
    ],
  },
  {
    group: '정렬',
    items: [
      {
        title: '왼쪽 정렬',
        description: '텍스트를 왼쪽으로 정렬하세요.',
        icon: AlignLeft,
        keywords: 'align left',
        command: (editor) => editor.chain().focus().setTextAlign('left').run(),
      },
      {
        title: '가운데 정렬',
        description: '텍스트를 가운데로 정렬하세요.',
        icon: AlignCenter,
        keywords: 'align center',
        command: (editor) =>
          editor.chain().focus().setTextAlign('center').run(),
      },
      {
        title: '오른쪽 정렬',
        description: '텍스트를 오른쪽으로 정렬하세요.',
        icon: AlignRight,
        keywords: 'align right',
        command: (editor) => editor.chain().focus().setTextAlign('right').run(),
      },
    ],
  },
];

export function TipTapFloatingMenu({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const commandRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.title
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase()) ||
              item.description
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase()) ||
              item.keywords
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase())
          ),
        }))
        .filter((group) => group.items.length > 0),
    [debouncedSearch]
  );

  const flatFilteredItems = useMemo(
    () => filteredGroups.flatMap((g) => g.items),
    [filteredGroups]
  );

  const executeCommand = useCallback(
    (commandFn: (editor: Editor) => void) => {
      if (!editor) return;

      try {
        const { from } = editor.state.selection;
        const slashCommandLength = search.length + 1;

        editor
          .chain()
          .focus()
          .deleteRange({
            from: Math.max(0, from - slashCommandLength),
            to: from,
          })
          .run();

        commandFn(editor);
      } catch (error) {
        console.error('Error executing command:', error);
      } finally {
        setIsOpen(false);
        setSearch('');
        setSelectedIndex(-1);
      }
    },
    [editor, search]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !editor) return;

      const preventDefault = () => {
        e.preventDefault();
        e.stopImmediatePropagation();
      };

      switch (e.key) {
        case 'ArrowDown':
          preventDefault();
          setSelectedIndex((prev) => {
            if (prev === -1) return 0;
            return prev < flatFilteredItems.length - 1 ? prev + 1 : 0;
          });
          break;

        case 'ArrowUp':
          preventDefault();
          setSelectedIndex((prev) => {
            if (prev === -1) return flatFilteredItems.length - 1;
            return prev > 0 ? prev - 1 : flatFilteredItems.length - 1;
          });
          break;

        case 'Enter':
          preventDefault();
          const targetIndex = selectedIndex === -1 ? 0 : selectedIndex;
          if (flatFilteredItems[targetIndex]) {
            executeCommand(flatFilteredItems[targetIndex].command);
          }
          break;

        case 'Escape':
          preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, selectedIndex, flatFilteredItems, executeCommand, editor]
  );

  useEffect(() => {
    if (!editor?.options.element) return;

    const editorElement = editor.options.element;
    const handleEditorKeyDown = (e: Event) => handleKeyDown(e as KeyboardEvent);

    editorElement.addEventListener('keydown', handleEditorKeyDown);
    return () =>
      editorElement.removeEventListener('keydown', handleEditorKeyDown);
  }, [handleKeyDown, editor]);

  // Add new effect for resetting selectedIndex
  useEffect(() => {
    setSelectedIndex(-1);
  }, [search]);

  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.focus();
    }
  }, [selectedIndex]);

  return (
    <FloatingMenu
      editor={editor}
      shouldShow={({ state }) => {
        if (!editor) return false;

        const { $from } = state.selection;
        const currentLineText = $from.parent.textBetween(
          0,
          $from.parentOffset,
          '\n',
          ' '
        );

        const isSlashCommand =
          currentLineText.startsWith('/') &&
          $from.parent.type.name !== 'codeBlock' &&
          $from.parentOffset === currentLineText.length;

        if (!isSlashCommand) {
          if (isOpen) setIsOpen(false);
          return false;
        }

        const query = currentLineText.slice(1).trim();
        if (query !== search) setSearch(query);
        if (!isOpen) setIsOpen(true);
        return true;
      }}
      tippyOptions={{
        placement: 'bottom-start',
        interactive: true,
        appendTo: () => document.body,
        onHide: () => {
          setIsOpen(false);
          setSelectedIndex(-1);
        },
      }}
    >
      <Command
        role='listbox'
        ref={commandRef}
        className='z-50 w-72 overflow-hidden rounded-lg border bg-popover shadow-lg'
      >
        <ScrollArea className='max-h-[330px]'>
          <CommandList>
            <CommandEmpty className='py-3 text-center text-sm text-muted-foreground'>
              No results found
            </CommandEmpty>

            {filteredGroups.map((group, groupIndex) => (
              <CommandGroup
                key={`${group.group}-${groupIndex}`}
                heading={
                  <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
                    {group.group}
                  </div>
                }
              >
                {group.items.map((item, itemIndex) => {
                  const flatIndex =
                    filteredGroups
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;

                  return (
                    <CommandItem
                      role='option'
                      key={`${group.group}-${item.title}-${itemIndex}`}
                      value={`${group.group}-${item.title}`}
                      onSelect={() => executeCommand(item.command)}
                      className={cn(
                        'gap-3 aria-selected:bg-accent/50',
                        flatIndex === selectedIndex ? 'bg-accent/50' : ''
                      )}
                      aria-selected={flatIndex === selectedIndex}
                      ref={(el) => {
                        itemRefs.current[flatIndex] = el;
                      }}
                      tabIndex={flatIndex === selectedIndex ? 0 : -1}
                    >
                      <div className='flex h-9 w-9 items-center justify-center rounded-md border bg-background'>
                        <item.icon className='h-4 w-4' />
                      </div>
                      <div className='flex flex-1 flex-col'>
                        <span className='text-sm font-medium'>
                          {item.title}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {item.description}
                        </span>
                      </div>
                      <kbd className='ml-auto flex h-5 items-center rounded bg-muted px-1.5 text-xs text-muted-foreground'>
                        ↵
                      </kbd>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </ScrollArea>
      </Command>
    </FloatingMenu>
  );
}
