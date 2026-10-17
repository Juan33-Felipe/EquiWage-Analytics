import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEPARTMENTS,
  INEQUITY_THRESHOLD,
  formatCurrency as sharedFormatCurrency,
  getInitials as sharedGetInitials,
} from '@equiwage/shared';
import { compensationApi } from '../services/compensation.api';

const CompensationContext = createContext(null);

/** Utilidades de formato compartidas por toda la aplicación. */
export const formatCurrency = sharedFormatCurrency;
export const getInitials = sharedGetInitials;

function bandMapFromState(bands) {
  return bands.reduce((acc, band) => {
    acc[band.level] = band;
    return acc;
  }, {});
}

export function CompensationProvider({ children }) {
  const [rawEmployees, setRawEmployees] = useState([]);
  const [bands, setBands] = useState([]);
  const [payrollSource, setPayrollSource] = useState('SQLite Local Database');
  const [simulation, setSimulation] = useState({
    target: 'minimum', // 'minimum' | 'median'
    rolloutQuarters: 1,
    departments: [...DEPARTMENTS],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const bandUpdateTimerRef = useRef({});

  /** Apply an AuditSummaryPayload returned by the backend SQLite server. */
  const applyBackendAuditState = useCallback((auditPayload) => {
    if (!auditPayload) return;
    if (Array.isArray(auditPayload.employees)) {
      setRawEmployees(
        auditPayload.employees.map((e) => ({
          id: e.id,
          name: e.name,
          role: e.role,
          department: e.department,
          level: Number(e.level),
          currentSalary: Number(e.currentSalary),
        }))
      );
    }
    if (Array.isArray(auditPayload.bands)) {
      setBands(
        auditPayload.bands
          .map((b) => ({
            level: Number(b.level),
            min: Number(b.min),
            median: Number(b.median),
            max: Number(b.max),
          }))
          .sort((a, b) => a.level - b.level)
      );
    }
    if (auditPayload.payrollSource) {
      setPayrollSource(auditPayload.payrollSource);
    }
    if (auditPayload.simulation) {
      setSimulation({
        target: auditPayload.simulation.target || 'minimum',
        rolloutQuarters: Number(auditPayload.simulation.rolloutQuarters) || 1,
        departments: Array.isArray(auditPayload.simulation.departments)
          ? auditPayload.simulation.departments
          : [...DEPARTMENTS],
      });
    }
    setBackendConnected(true);
    setSyncError(null);
  }, []);

  /** Manual refresh from Backend SQLite database. */
  const refreshAuditFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const auditPayload = await compensationApi.getFullAudit();
      applyBackendAuditState(auditPayload);
    } catch (error) {
      setBackendConnected(false);
      setSyncError(error?.message || 'Unable to reach local backend server.');
    } finally {
      setIsLoading(false);
    }
  }, [applyBackendAuditState]);

  useEffect(() => {
    let active = true;
    compensationApi
      .getFullAudit()
      .then((auditPayload) => {
        if (active) applyBackendAuditState(auditPayload);
      })
      .catch((error) => {
        if (active) {
          setBackendConnected(false);
          setSyncError(error?.message || 'Unable to reach local backend server.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyBackendAuditState]);

  const bandMap = useMemo(() => bandMapFromState(bands), [bands]);

  /** Enriquecer empleados con banda, % de brecha y estado de auditoría. */
  const enrichedEmployees = useMemo(() => {
    return rawEmployees.map((employee) => {
      const band = bandMap[employee.level];
      if (!band) return { ...employee, band: null, gap: 0, status: 'unknown' };
      const gap = band.median > 0 ? (employee.currentSalary - band.median) / band.median : 0;
      let status = 'aligned';
      if (employee.currentSalary < band.min) status = 'below';
      else if (employee.currentSalary > band.max) status = 'above';
      return { ...employee, band, gap, status };
    });
  }, [rawEmployees, bandMap]);

  /** Brechas de mercado: empleados por debajo del mínimo de su banda. */
  const marketGaps = useMemo(
    () => enrichedEmployees.filter((e) => e.status === 'below'),
    [enrichedEmployees]
  );

  /**
   * Inequidad interna: misma combinación cargo + nivel donde la diferencia
   * entre el mayor y el menor salario supera el 10% del menor.
   */
  const inequities = useMemo(() => {
    const groups = {};
    enrichedEmployees.forEach((employee) => {
      const key = `${employee.role}__${employee.level}`;
      groups[key] = groups[key] || [];
      groups[key].push(employee);
    });

    const flagged = [];
    Object.values(groups).forEach((group) => {
      if (group.length < 2) return;
      const salaries = group.map((e) => e.currentSalary);
      const lowest = Math.min(...salaries);
      const highest = Math.max(...salaries);
      const spread = lowest > 0 ? (highest - lowest) / lowest : 0;
      if (spread <= INEQUITY_THRESHOLD) return;
      group.forEach((employee) => {
        flagged.push({ ...employee, spread });
      });
    });
    return flagged;
  }, [enrichedEmployees]);

  const inequityIds = useMemo(() => new Set(inequities.map((e) => e.id)), [inequities]);

  /** Cálculo del simulador, reactivo a los parámetros de política (< 1s). */
  const simulationResult = useMemo(() => {
    const included = enrichedEmployees.filter(
      (e) => e.band && simulation.departments.includes(e.department)
    );

    const rows = included
      .map((employee) => {
        const targetSalary =
          simulation.target === 'minimum' ? employee.band.min : employee.band.median;
        const adjustment = Math.max(targetSalary - employee.currentSalary, 0);
        const severity =
          employee.currentSalary < employee.band.min
            ? 'critical'
            : employee.currentSalary < employee.band.median
              ? 'moderate'
              : 'none';
        return {
          ...employee,
          targetSalary,
          proposedSalary: employee.currentSalary + adjustment,
          adjustment,
          severity,
        };
      })
      .filter((row) => row.adjustment > 0)
      .sort((a, b) => b.adjustment - a.adjustment);

    const totalBudget = rows.reduce((acc, row) => acc + row.adjustment, 0);

    const allDepartments = Array.from(
      new Set([...DEPARTMENTS, ...rows.map((r) => r.department)])
    );

    const byDepartment = allDepartments
      .map((department) => {
        const deptRows = rows.filter((row) => row.department === department);
        const cost = deptRows.reduce((acc, row) => acc + row.adjustment, 0);
        return {
          department,
          cost,
          headcount: deptRows.length,
          share: totalBudget ? cost / totalBudget : 0,
        };
      })
      .filter((item) => item.cost > 0)
      .sort((a, b) => b.cost - a.cost);

    const perQuarter = totalBudget / Math.max(simulation.rolloutQuarters, 1);

    return {
      rows,
      totalBudget,
      affectedCount: rows.length,
      averageAdjustment: rows.length ? totalBudget / rows.length : 0,
      byDepartment,
      perQuarter,
    };
  }, [enrichedEmployees, simulation]);

  const metrics = useMemo(() => {
    const total = enrichedEmployees.length;
    const aligned = enrichedEmployees.filter((e) => e.status === 'aligned').length;
    const averageGap = total
      ? enrichedEmployees.reduce((acc, e) => acc + e.gap, 0) / total
      : 0;
    return {
      headcount: total,
      aligned,
      alignedRate: total ? aligned / total : 0,
      marketDisparities: marketGaps.length,
      inequityCount: inequityIds.size,
      averageGap,
      minToMedianBudget: simulationResult.totalBudget,
    };
  }, [enrichedEmployees, marketGaps, inequityIds, simulationResult]);

  /** Upload a .CSV or .XLSX payroll file directly to the backend importer. */
  const uploadPayrollFile = useCallback(
    async (file) => {
      setIsSyncing(true);
      try {
        const response = await compensationApi.uploadPayrollFile(file);
        applyBackendAuditState(response.audit);
        return {
          ok: true,
          rowCount: response.importedCount,
          sourceName: response.sourceName,
          invalidRows: response.invalidRows,
        };
      } catch (error) {
        return {
          ok: false,
          errorKey: error?.errorKey || 'employees.missingRequired',
          error: error?.message,
          missing: error?.missingColumns || [],
          details: error?.details || [],
        };
      } finally {
        setIsSyncing(false);
      }
    },
    [applyBackendAuditState]
  );

  /** Importar nómina desde filas parseadas y sincronizar con SQLite. */
  const importPayroll = useCallback(
    async (rows, sourceName) => {
      setRawEmployees(rows);
      setPayrollSource(sourceName || 'Imported dataset');
      setIsSyncing(true);
      try {
        const response = await compensationApi.importPayrollRows(rows, sourceName);
        applyBackendAuditState(response.audit);
      } catch (error) {
        setSyncError(error?.message || 'Failed to sync payroll with backend.');
      } finally {
        setIsSyncing(false);
      }
    },
    [applyBackendAuditState]
  );

  /** Upload a .CSV or .XLSX salary bands file directly to the backend importer. */
  const uploadBandsFile = useCallback(
    async (file) => {
      setIsSyncing(true);
      try {
        const response = await compensationApi.uploadBandsFile(file);
        applyBackendAuditState(response.audit);
        return {
          ok: true,
          rowCount: response.importedCount,
          sourceName: response.sourceName,
        };
      } catch (error) {
        return {
          ok: false,
          errorKey: error?.errorKey || 'error.noRanges',
          error: error?.message,
          missing: error?.missingColumns || [],
        };
      } finally {
        setIsSyncing(false);
      }
    },
    [applyBackendAuditState]
  );

  /** Importar/actualizar la matriz de bandas salariales y persistir en SQLite. */
  const importBands = useCallback(
    async (nextBands) => {
      const normalized = [...nextBands]
        .map((b) => ({
          level: Number(b.level),
          min: Number(b.min),
          median: Number(b.median),
          max: Number(b.max),
        }))
        .sort((a, b) => a.level - b.level);

      setBands(normalized);
      setIsSyncing(true);
      try {
        const auditPayload = await compensationApi.replaceBands(normalized, 'Imported salary bands');
        applyBackendAuditState(auditPayload);
      } catch (error) {
        setSyncError(error?.message || 'Failed to persist salary bands.');
      } finally {
        setIsSyncing(false);
      }
    },
    [applyBackendAuditState]
  );

  /** Actualizar un rango de banda en tiempo real y sincronizar con SQLite. */
  const updateBand = useCallback(
    (level, patch) => {
      setBands((prev) =>
        prev.map((band) => (band.level === level ? { ...band, ...patch } : band))
      );

      if (bandUpdateTimerRef.current[level]) {
        clearTimeout(bandUpdateTimerRef.current[level]);
      }

      bandUpdateTimerRef.current[level] = setTimeout(async () => {
        try {
          const auditPayload = await compensationApi.updateBand(level, patch);
          applyBackendAuditState(auditPayload);
        } catch (error) {
          setSyncError(error?.message || 'Failed to update salary band in SQLite.');
        }
      }, 220);
    },
    [applyBackendAuditState]
  );

  /** Añadir el siguiente nivel de banda salarial en SQLite. */
  const addBand = useCallback(async () => {
    setIsSyncing(true);
    try {
      const auditPayload = await compensationApi.addBand();
      applyBackendAuditState(auditPayload);
    } catch {
      // Optimistic fallback if offline
      setBands((prev) => {
        const nextLevel = prev.length ? Math.max(...prev.map((b) => b.level)) + 1 : 1;
        const last = prev[prev.length - 1];
        const base = last ? last.median : 50000;
        return [
          ...prev,
          { level: nextLevel, min: base, median: Math.round(base * 1.2), max: Math.round(base * 1.4) },
        ];
      });
    } finally {
      setIsSyncing(false);
    }
  }, [applyBackendAuditState]);

  /** Actualizar parámetros del simulador y persistir en SQLite. */
  const updateSimulation = useCallback(
    (patch) => {
      setSimulation((prev) => {
        const next = { ...prev, ...patch };
        compensationApi
          .updateSimulation(next)
          .then((auditPayload) => applyBackendAuditState(auditPayload))
          .catch(() => {});
        return next;
      });
    },
    [applyBackendAuditState]
  );

  const toggleDepartment = useCallback(
    (department) => {
      setSimulation((prev) => {
        const has = prev.departments.includes(department);
        const nextDepartments = has
          ? prev.departments.filter((d) => d !== department)
          : [...prev.departments, department];
        const next = { ...prev, departments: nextDepartments };
        compensationApi
          .updateSimulation({ departments: nextDepartments })
          .then((auditPayload) => applyBackendAuditState(auditPayload))
          .catch(() => {});
        return next;
      });
    },
    [applyBackendAuditState]
  );

  /** Aplicar los ajustes del simulador directamente a la nómina en SQLite. */
  const applySimulationScenario = useCallback(
    async (scenarioName) => {
      setIsSyncing(true);
      try {
        const auditPayload = await compensationApi.applySimulationScenario(scenarioName);
        applyBackendAuditState(auditPayload);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error?.message };
      } finally {
        setIsSyncing(false);
      }
    },
    [applyBackendAuditState]
  );

  /** Exportar la sesión completa desde el backend SQLite a un archivo .json local. */
  const exportSession = useCallback(async () => {
    try {
      const payload = await compensationApi.exportSession();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `equiwage-session-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      const fallbackPayload = {
        app: 'EquiWage Analytics',
        version: 1,
        savedAt: new Date().toISOString(),
        employees: rawEmployees,
        bands,
        payrollSource,
        simulation,
      };
      const blob = new Blob([JSON.stringify(fallbackPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `equiwage-session-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [rawEmployees, bands, payrollSource, simulation]);

  /** Restaurar una sesión desde un archivo .json local hacia SQLite. */
  const importSession = useCallback(
    async (payload) => {
      if (!payload || !Array.isArray(payload.employees) || !Array.isArray(payload.bands)) {
        throw new Error('The selected file is not a valid EquiWage session.');
      }
      setIsSyncing(true);
      try {
        const restoredAudit = await compensationApi.restoreSession(payload);
        applyBackendAuditState(restoredAudit);
      } finally {
        setIsSyncing(false);
      }
    },
    [applyBackendAuditState]
  );

  /** Restablecer la base de datos SQLite al lote inicial de ejemplo. */
  const resetSession = useCallback(async () => {
    setIsSyncing(true);
    try {
      const freshAudit = await compensationApi.resetSession();
      applyBackendAuditState(freshAudit);
    } finally {
      setIsSyncing(false);
    }
  }, [applyBackendAuditState]);

  const value = {
    employees: enrichedEmployees,
    rawEmployees,
    bands,
    bandMap,
    payrollSource,
    simulation,
    simulationResult,
    metrics,
    marketGaps,
    inequities,
    inequityIds,
    isLoading,
    isSyncing,
    backendConnected,
    syncError,
    refreshAuditFromBackend,
    uploadPayrollFile,
    uploadBandsFile,
    importPayroll,
    importBands,
    updateBand,
    addBand,
    updateSimulation,
    toggleDepartment,
    applySimulationScenario,
    exportSession,
    importSession,
    resetSession,
  };

  return <CompensationContext.Provider value={value}>{children}</CompensationContext.Provider>;
}

export function useCompensation() {
  const context = useContext(CompensationContext);
  if (!context) {
    throw new Error('useCompensation must be used within a CompensationProvider');
  }
  return context;
}
