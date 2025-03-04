'use client';
/* eslint-disable */
// @ts-nocheck
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
  isValidUrl,
} from '@/lib/tiptap-utils';
import {
  type CommandProps,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from '@tiptap/react';
import { Image, Link, Upload, Loader2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useImageUpload } from '@/hooks/use-image-upload';
import { cn } from '@/lib/utils';

export interface ImagePlaceholderOptions {
  HTMLAttributes: Record<string, any>;
  onUpload?: (url: string) => void;
  onError?: (error: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      /**
       * Inserts an image placeholder
       */
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
  name: 'image-placeholder',

  addOptions() {
    return {
      HTMLAttributes: {},
      onUpload: () => {},
      onError: () => {},
    };
  },

  group: 'block',

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagePlaceholderComponent, {
      className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
    });
  },

  addCommands() {
    return {
      insertImagePlaceholder: () => (props: CommandProps) => {
        return props.commands.insertContent({
          type: 'image-placeholder',
        });
      },
    };
  },
});

function ImagePlaceholderComponent(props: NodeViewProps) {
  const { editor, extension, selected } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    previewUrl,
    fileInputRef,
    handleFileChange,
    handleRemove,
    uploading,
    error,
  } = useImageUpload({
    onUpload: (imageUrl) => {
      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: altText || fileInputRef.current?.files?.[0]?.name,
        })
        .run();
      handleRemove();
      setIsExpanded(false);
    },
  });

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as any);
      }
    }
  };

  const handleInsertEmbed = (e: FormEvent) => {
    e.preventDefault();
    const valid = isValidUrl(url);
    if (!valid) {
      setUrlError(true);
      return;
    }
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: altText }).run();
      setIsExpanded(false);
      setUrl('');
      setAltText('');
    }
  };

  return (
    <NodeViewWrapper className='w-full'>
      <div className='relative'>
        {!isExpanded ? (
          <div
            onClick={() => setIsExpanded(true)}
            className={cn(
              'group relative flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-all hover:bg-accent',
              selected && 'border-primary bg-primary/5',
              isDragActive && 'border-primary bg-primary/5',
              error && 'border-destructive bg-destructive/5'
            )}
          >
            <div className='rounded-full bg-background p-4 shadow-sm transition-colors group-hover:bg-accent'>
              <Image className='h-6 w-6' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-medium'>
                클릭하여 업로드하거나 이미지를 드래그 해주세요.
              </p>
              <p className='text-xs text-muted-foreground'>
                SVG, PNG, JPG, GIF
              </p>
            </div>
          </div>
        ) : (
          <div className='rounded-lg border bg-card p-4 shadow-sm'>
            <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>이미지 추가</h3>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsExpanded(false)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v: any) => setActiveTab(v)}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='upload'>
                  <Upload className='mr-2 h-4 w-4' />
                  업로드
                </TabsTrigger>
                <TabsTrigger value='url'>
                  <Link className='mr-2 h-4 w-4' />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value='upload'>
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={cn(
                    'my-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                    isDragActive && 'border-primary bg-primary/10',
                    error && 'border-destructive bg-destructive/10'
                  )}
                >
                  {previewUrl ? (
                    <div className='space-y-4'>
                      <img
                        src={previewUrl}
                        alt='Preview'
                        className='mx-auto max-h-[200px] rounded-lg object-cover'
                      />
                      <div className='space-y-2'>
                        <Input
                          value={altText}
                          onChange={(e) => setAltText(e.target.value)}
                          placeholder='대체 텍스트 (선택사항)'
                        />
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='outline'
                            onClick={handleRemove}
                            disabled={uploading}
                          >
                            삭제
                          </Button>
                          <Button disabled={uploading}>
                            {uploading && (
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            )}
                            업로드
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        onChange={handleFileChange}
                        className='hidden'
                        id='image-upload'
                      />
                      <label
                        htmlFor='image-upload'
                        className='flex cursor-pointer flex-col items-center gap-4'
                      >
                        <Upload className='h-8 w-8 text-muted-foreground' />
                        <div>
                          <p className='text-sm font-medium'>
                            클릭하여 업로드하거나 이미지를 드래그 해주세요.
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            SVG, PNG, JPG, GIF
                          </p>
                        </div>
                      </label>
                    </>
                  )}
                  {error && (
                    <p className='mt-2 text-sm text-destructive'>{error}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value='url'>
                <div className='space-y-4 py-4'>
                  <div className='space-y-2'>
                    <Input
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (urlError) setUrlError(false);
                      }}
                      placeholder='이미지 URL을 입력해주세요.'
                    />
                    {urlError && (
                      <p className='text-xs text-destructive'>
                        유효한 URL을 입력해주세요
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Input
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder='대체 텍스트 (선택사항)'
                    />
                  </div>
                  <Button
                    onClick={handleInsertEmbed}
                    className='w-full'
                    disabled={!url}
                  >
                    이미지 추가
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
