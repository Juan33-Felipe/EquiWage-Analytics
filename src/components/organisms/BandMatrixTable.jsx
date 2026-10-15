import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { formatCurrency, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';

function EditableCell({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full bg-transparent text-sm font-medium text-content-main text-right focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-md px-2 py-1.5 hover:bg-gray-50 focus:bg-orange-50/50 transition-colors"
    />
  );
}

export function BandMatrixTable() {
  const { bands, updateBand, addBand } = useCompensation();
  const { t } = useLanguage();

  return (
    <Card className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">{t('bands.bandMatrix')}</h3>
          <p className="text-xs text-content-muted">{t('bands.clickAnyValue')}</p>
        </div>
        <Button variant="outline" className="gap-2 text-xs shrink-0" onClick={addBand}>
          <Plus className="w-4 h-4" />
          {t('bands.addLevelRange')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs font-semibold text-content-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{t('bands.jobLevel')}</th>
              <th className="px-4 py-3 font-medium text-right whitespace-nowrap">{t('bands.minSalary')}</th>
              <th className="px-4 py-3 font-medium text-right whitespace-nowrap">{t('bands.marketMedian')}</th>
              <th className="px-4 py-3 font-medium text-right whitespace-nowrap">{t('bands.maxSalary')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {bands.map((band) => (
              <tr key={band.level} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange-50 text-primary font-bold text-sm">
                    {band.level}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <EditableCell value={band.min} onChange={(value) => updateBand(band.level, { min: value })} />
                </td>
                <td className="px-4 py-2">
                  <EditableCell value={band.median} onChange={(value) => updateBand(band.level, { median: value })} />
                </td>
                <td className="px-4 py-2">
                  <EditableCell value={band.max} onChange={(value) => updateBand(band.level, { max: value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
        <span className="text-xs text-content-muted">
          {t('bands.bandMidpoint')}{' '}
          <span className="font-semibold text-content-main">
            {t('bands.levelN', { level: 5 })} • {bands[4] ? formatCurrency(bands[4].median) : '—'}
          </span>
        </span>
        <span className="text-xs text-content-muted">
          {t('bands.span')}{' '}
          <span className="font-semibold text-content-main">
            {bands[4] ? formatCurrency(bands[4].max - bands[4].min) : '—'}
          </span>
        </span>
      </div>
    </Card>
  );
}
