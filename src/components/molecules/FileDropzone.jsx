import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../atoms/Button';

export function FileDropzone({
  onFile,
  status = 'idle', // 'idle' | 'loading' | 'success' | 'error'
  successMessage,
  errorMessage,
  missingColumns = [],
  hint = 'CSV or Excel • up to 10,000 employees',
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary bg-orange-50/60'
            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50/60'
        )}
      >
        <div className="w-14 h-14 rounded-full bg-orange-50 text-primary flex items-center justify-center mb-4">
          <UploadCloud className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-content-main mb-1">
          Drag & drop your file here
        </p>
        <p className="text-xs text-content-muted mb-4">{hint}</p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Browse File
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {status === 'success' && (
        <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-100 text-success rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 bg-red-50 border border-red-100 text-danger rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </div>
          {missingColumns.length > 0 && (
            <p className="text-xs text-danger/90 mt-2 ml-7 leading-relaxed">
              Your file is missing the following column{missingColumns.length > 1 ? 's' : ''}:{' '}
              <span className="font-semibold">{missingColumns.join(', ')}</span>. Please add
              {missingColumns.length > 1 ? ' them' : ' it'} and try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
