'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ParseXmlResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function XmlUploader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      setIsProcessing(true);

      try {
        const xmlContent = await file.text();

        const response = await fetch('/api/xml/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xmlContent }),
        });

        const result: ParseXmlResponse = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to parse XML');
        }

        window.dispatchEvent(
          new CustomEvent('xml-parsed', { detail: result.data })
        );

        if (result.data.reports.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No Searches Found',
            description: `No valid searches found in ${file.name}`,
          });
        } else {
          toast({
            title: 'Success',
            description: `Loaded ${result.data.reports.length} searches`,
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to parse XML file',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/xml': ['.xml'] },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    window.dispatchEvent(new CustomEvent('xml-cleared'));
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-md p-3 text-center cursor-pointer
          transition-colors text-sm
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-accent/50'}
        `}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Processing...</span>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium truncate">{fileName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isDragActive ? 'Drop XML file' : 'Upload XML'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
