import { BAND_STATUS, GAP_SEVERITY, INEQUITY_THRESHOLD } from '@equiwage/shared';
import type {
  EnrichedEmployee,
  GapSeverity,
  InequityFlaggedEmployee,
} from '@equiwage/shared';

export interface RoleLevelInequityGroup {
  role: string;
  level: number;
  peerCount: number;
  lowestSalary: number;
  highestSalary: number;
  averageSalary: number;
  spread: number;
  severity: GapSeverity;
  employees: InequityFlaggedEmployee[];
}

/**
 * Detects internal salary inequities (RF-004):
 * Identifies employees within the same role and job level whose salary spread
 * ((highest - lowest) / lowest) exceeds INEQUITY_THRESHOLD (10%).
 */
export function detectInternalInequities(
  enrichedEmployees: EnrichedEmployee[],
  threshold: number = INEQUITY_THRESHOLD
): {
  flaggedEmployees: InequityFlaggedEmployee[];
  flaggedIds: Set<string>;
  groups: RoleLevelInequityGroup[];
} {
  const groupedByRoleLevel = new Map<string, EnrichedEmployee[]>();

  for (const employee of enrichedEmployees) {
    const key = `${employee.role}__${employee.level}`;
    const bucket = groupedByRoleLevel.get(key);
    if (bucket) {
      bucket.push(employee);
    } else {
      groupedByRoleLevel.set(key, [employee]);
    }
  }

  const flaggedEmployees: InequityFlaggedEmployee[] = [];
  const groups: RoleLevelInequityGroup[] = [];

  for (const peerGroup of groupedByRoleLevel.values()) {
    if (peerGroup.length < 2) {
      continue;
    }

    const salaries = peerGroup.map((emp) => emp.currentSalary);
    const lowestSalary = Math.min(...salaries);
    const highestSalary = Math.max(...salaries);

    if (lowestSalary <= 0) {
      continue;
    }

    const spread = (highestSalary - lowestSalary) / lowestSalary;
    if (spread <= threshold) {
      continue;
    }

    const averageSalary =
      salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;

    const groupSeverity: GapSeverity =
      spread >= threshold * 2 ? GAP_SEVERITY.CRITICAL : GAP_SEVERITY.MODERATE;

    const groupFlagged: InequityFlaggedEmployee[] = peerGroup.map((employee) => {
      const empSeverity: GapSeverity =
        employee.status === BAND_STATUS.BELOW || spread >= threshold * 2
          ? GAP_SEVERITY.CRITICAL
          : GAP_SEVERITY.MODERATE;

      const enrichedFlag: InequityFlaggedEmployee = {
        ...employee,
        spread,
        roleAverageSalary: Math.round(averageSalary),
        roleMinSalary: lowestSalary,
        roleMaxSalary: highestSalary,
        peerCount: peerGroup.length,
        severity: empSeverity,
      };

      flaggedEmployees.push(enrichedFlag);
      return enrichedFlag;
    });

    groups.push({
      role: peerGroup[0].role,
      level: peerGroup[0].level,
      peerCount: peerGroup.length,
      lowestSalary,
      highestSalary,
      averageSalary: Math.round(averageSalary),
      spread,
      severity: groupSeverity,
      employees: groupFlagged,
    });
  }

  const flaggedIds = new Set(flaggedEmployees.map((emp) => emp.id));

  return {
    flaggedEmployees,
    flaggedIds,
    groups,
  };
}
