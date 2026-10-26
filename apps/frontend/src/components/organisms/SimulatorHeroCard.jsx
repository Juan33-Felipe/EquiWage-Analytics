import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, TrendingUp } from 'lucide-react';
import { formatCurrency, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';

export function SimulatorHeroCard() {
  const { simulation, simulationResult } = useCompensation();
  const { t } = useLanguage();
  const targetLabel = simulation.target === 'minimum' ? t('simulator.bandMinimumP25') : t('simulator.marketMedianP50');

  return (
    <div className="relative overflow-hidden rounded-xl shadow-soft bg-gradient-to-br from-primary-hover via-primary to-primary-light text-white p-6 sm:p-8">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold shrink-0">
              <Zap className="w-3.5 h-3.5" />
              {t('simulator.instantCalculation')}
            </span>
            <span className="text-xs font-medium text-white/80">
              {t('simulator.target')} {targetLabel}
            </span>
          </div>
          <p className="text-sm font-medium text-white/90 mb-1">{t('simulator.requiredBudget')}</p>
          <motion.h2
            key={simulationResult.totalBudget}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight truncate"
          >
            {formatCurrency(simulationResult.totalBudget)}
          </motion.h2>

          <p className="text-xs text-white/80 mt-2">
            {t('simulator.perQuarter')} {formatCurrency(simulationResult.perQuarter)}
          </p>

          {/* Detailed Budget Breakdown Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/20 text-xs">
            {simulationResult.legalComplianceCost > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-950/60 text-orange-200 border border-orange-400/40 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                Piso Legal: {formatCurrency(simulationResult.legalComplianceCost)}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 text-white border border-white/20 font-medium">
              Nivelación de Banda: {formatCurrency(simulationResult.bandLevelingCost || (simulationResult.totalBudget - (simulationResult.legalComplianceCost || 0) - (simulationResult.manualAdjustmentsCost || 0)))}
            </span>
            {simulationResult.manualAdjustmentsCost > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/25 text-white border border-white/30 font-medium">
                Ajustes Manuales: +{formatCurrency(simulationResult.manualAdjustmentsCost)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 shrink-0">
          <div className="text-center">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{simulationResult.affectedCount}</p>
            <p className="text-[11px] text-white/80">{t('simulator.employeesBenefiting')}</p>
          </div>
          <div className="text-center">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(simulationResult.averageAdjustment)}</p>
            <p className="text-[11px] text-white/80">{t('simulator.averageIncrease')}</p>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-black/5 rounded-full blur-2xl translate-y-1/3" />
    </div>
  );
}
