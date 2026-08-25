import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/files";

export function FileDrop({
  file,
  accept,
  onFile,
  label = "Solte o arquivo aqui ou clique para escolher",
}: {
  file: File | null;
  accept: string;
  onFile: (file: File) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | null) {
    const next = list?.[0];
    if (next) onFile(next);
  }

  function onDrag(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") setOver(true);
    if (event.type === "dragleave") setOver(false);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragEnter={onDrag}
      onDragOver={onDrag}
      onDragLeave={onDrag}
      onDrop={(event) => {
        onDrag(event);
        setOver(false);
        take(event.dataTransfer.files);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed px-4 py-7 text-center transition-colors",
        over ? "border-royal-signal bg-lavender-wash" : "border-stone-divider bg-fog-surface hover:bg-lavender-wash/60",
      )}
    >
      <Upload className="h-5 w-5 text-royal-signal" />
      {file ? (
        <>
          <p className="text-[13px] font-medium text-midnight-ink">{file.name}</p>
          <p className="text-[12px] text-ash-helper">{formatBytes(file.size)}</p>
        </>
      ) : (
        <>
          <p className="text-[13px] text-midnight-ink">{label}</p>
          <p className="text-[12px] text-ash-helper">PDF, Word, Excel, PowerPoint, imagem ou contrato · até 20 MB</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
    </button>
  );
}