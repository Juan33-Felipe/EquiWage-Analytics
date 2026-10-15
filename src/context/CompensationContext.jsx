import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  MOCK_EMPLOYEES,
  MOCK_SALARY_BANDS,
  DEPARTMENTS,
  INEQUITY_THRESHOLD,
} from '../data/mockCompensationData';

const STORAGE_KEY = 'equiwage.session.v1';

const CompensationContext = createContext(null);

/** Utilidades de formato compartidas por toda la aplicación. */
export function formatCurrency(value, options = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...options,
  }).format(Number.isFinite(value) ? value : 0);
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function bandMapFromState(bands) {
  return bands.reduce((acc, band) => {
    acc[band.level] = band;
    return acc;
  }, {});
}

export function CompensationProvider({ children }) {
  const [employees, setEmployees] = useState(() => restoreSession()?.employees ?? MOCK_EMPLOYEES);
  const [bands, setBands] = useState(() => restoreSession()?.bands ?? MOCK_SALARY_BANDS);
  const [payrollSource, setPayrollSource] = useState(() => restoreSession()?.payrollSource ?? 'Sample dataset');
  const [simulation, setSimulation] = useState(() => restoreSession()?.simulation ?? {
    target: 'minimum', // 'minimum' | 'median'
    rolloutQuarters: 1,
    departments: DEPARTMENTS,
  });

  // Persistencia automática en localStorage (100% local, sin nube).
  useEffect(() => {
    const payload = { employees, bands, payrollSource, simulation };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* almacenamiento no disponible: la sesión sigue en memoria */
    }
  }, [employees, bands, payrollSource, simulation]);

  const bandMap = useMemo(() => bandMapFromState(bands), [bands]);

  /** Enriquecer empleados con banda, % de brecha y estado de auditoría. */
  const enrichedEmployees = useMemo(() => {
    return employees.map((employee) => {
      const band = bandMap[employee.level];
      if (!band) return { ...employee, band: null, gap: 0, status: 'unknown' };
      const gap = (employee.currentSalary - band.median) / band.median;
      let status = 'aligned';
      if (employee.currentSalary < band.min) status = 'below';
      else if (employee.currentSalary > band.max) status = 'above';
      return { ...employee, band, gap, status };
    });
  }, [employees, bandMap]);

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
      const spread = (highest - lowest) / lowest;
      if (spread <= INEQUITY_THRESHOLD) return;
      group.forEach((employee) => {
        flagged.push({ ...employee, spread });
      });
    });
    return flagged;
  }, [enrichedEmployees]);

  const inequityIds = useMemo(() => new Set(inequities.map((e) => e.id)), [inequities]);

  /** Cálculo del simulador, reactivo a los parámetros de política. */
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

    const byDepartment = DEPARTMENTS.map((department) => {
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

  /** Importar nómina desde un archivo validado (CSV/XLSX ya parseado a filas). */
  const importPayroll = useCallback((rows, sourceName) => {
    setEmployees(rows);
    setPayrollSource(sourceName || 'Imported dataset');
  }, []);

  /** Importar/actualizar la matriz de bandas salariales. */
  const importBands = useCallback((nextBands) => {
    setBands(
      [...nextBands]
        .map((b) => ({ level: Number(b.level), min: Number(b.min), median: Number(b.median), max: Number(b.max) }))
        .sort((a, b) => a.level - b.level)
    );
  }, []);

  const updateBand = useCallback((level, patch) => {
    setBands((prev) =>
      prev.map((band) => (band.level === level ? { ...band, ...patch } : band))
    );
  }, []);

  const addBand = useCallback(() => {
    setBands((prev) => {
      const nextLevel = prev.length ? Math.max(...prev.map((b) => b.level)) + 1 : 1;
      const last = prev[prev.length - 1];
      const base = last ? last.median : 50000;
      return [...prev, { level: nextLevel, min: base, median: Math.round(base * 1.2), max: Math.round(base * 1.4) }];
    });
  }, []);

  const updateSimulation = useCallback((patch) => {
    setSimulation((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleDepartment = useCallback((department) => {
    setSimulation((prev) => {
      const has = prev.departments.includes(department);
      return {
        ...prev,
        departments: has
          ? prev.departments.filter((d) => d !== department)
          : [...prev.departments, department],
      };
    });
  }, []);

  /** Exportar la sesión completa a un archivo .json local. */
  const exportSession = useCallback(() => {
    const payload = {
      app: 'EquiWage Analytics',
      version: 1,
      savedAt: new Date().toISOString(),
      employees,
      bands,
      payrollSource,
      simulation,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equiwage-session-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [employees, bands, payrollSource, simulation]);

  /** Restaurar una sesión desde un archivo .json local. */
  const importSession = useCallback((payload) => {
    if (!payload || !Array.isArray(payload.employees) || !Array.isArray(payload.bands)) {
      throw new Error('The selected file is not a valid EquiWage session.');
    }
    setEmployees(payload.employees);
    setBands(payload.bands);
    setPayrollSource(payload.payrollSource || 'Restored session');
    if (payload.simulation) setSimulation(payload.simulation);
  }, []);

  const resetSession = useCallback(() => {
    setEmployees(MOCK_EMPLOYEES);
    setBands(MOCK_SALARY_BANDS);
    setPayrollSource('Sample dataset');
    setSimulation({ target: 'minimum', rolloutQuarters: 1, departments: DEPARTMENTS });
  }, []);

  const value = {
    employees: enrichedEmployees,
    rawEmployees: employees,
    bands,
    bandMap,
    payrollSource,
    simulation,
    simulationResult,
    metrics,
    marketGaps,
    inequities,
    inequityIds,
    importPayroll,
    importBands,
    updateBand,
    addBand,
    updateSimulation,
    toggleDepartment,
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

function restoreSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
