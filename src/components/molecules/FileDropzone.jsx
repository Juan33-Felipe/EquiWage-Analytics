import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';

export function FileDropzone({
  onFile,
  status = 'idle', // 'idle' | 'loading' | 'success' | 'error'
  successMessage,
  errorMessage,
  missingColumns = [],
  hint,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();
  const displayHint = hint || t('dropzone.csvExcel');

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
          'border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary bg-orange-50/60'
            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50/60'
        )}
      >
        <div className="w-14 h-14 rounded-full bg-orange-50 text-primary flex items-center justify-center mb-4 shrink-0">
          <UploadCloud className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-content-main mb-1">
          {t('dropzone.dragDrop')}
        </p>
        <p className="text-xs text-content-muted mb-4">{displayHint}</p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          {t('dropzone.browseFile')}
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
          <span className="text-sm font-medium min-w-0 break-words">{successMessage}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 bg-red-50 border border-red-100 text-danger rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold min-w-0 break-words">{errorMessage}</span>
          </div>
          {missingColumns.length > 0 && (
            <p className="text-xs text-danger/90 mt-2 ml-7 leading-relaxed">
              {t('error.missingColumns', { columns: missingColumns.join(', ') })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
