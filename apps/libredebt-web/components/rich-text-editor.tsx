"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Unlink,
  Image as ImageIcon,
  Heading1,
  Heading2,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline hover:text-blue-700 cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class:
            "max-w-full h-auto rounded-lg my-4 border border-zinc-200 dark:border-zinc-800",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[150px] focus:outline-none p-4 border border-zinc-200 dark:border-zinc-800 rounded-b-md bg-transparent",
      },
    },
    onUpdate: ({ editor }) => {
      // Pass the HTML string back to the parent state/form schema
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="w-full flex flex-col rounded-md overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 p-2 border border-b-0 border-zinc-200 dark:border-zinc-800 rounded-t-md bg-zinc-100 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition ${editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition ${editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 1 }) ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-1.5 rounded transition ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition ${editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition ${editor.isActive("orderedList") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <button
          type="button"
          onClick={addLink}
          className={`p-1.5 rounded transition ${editor.isActive("link") ? "bg-zinc-200 dark:bg-zinc-800 text-blue-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          <Link2 className="w-4 h-4" />
        </button>

        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded hover:text-red-500 text-zinc-500"
          >
            <Unlink className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded transition text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* EDITOR AREA */}
      <EditorContent editor={editor} />
    </div>
  );
}
