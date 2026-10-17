import type { Request, Response } from 'express';
import { enrichEmployeesWithBands } from '../engines/index.js';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { bandsRepository, employeesRepository, settingsRepository } from '../repositories/index.js';
import { auditService } from '../services/index.js';

export class EmployeesController {
  /**
   * GET /api/employees
   * Lists enriched employees with optional department, level, status, and search filters.
   */
  listEmployees = (req: Request, res: Response): void => {
    const department = typeof req.query.department === 'string' ? req.query.department : undefined;
    const level = req.query.level !== undefined ? Number(req.query.level) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const rawEmployees = employeesRepository.findAll({
      department,
      level: Number.isFinite(level) ? level : undefined,
      search,
    });
    const bands = bandsRepository.findAll();
    let enriched = enrichEmployeesWithBands(rawEmployees, bands);

    if (status && status !== 'all') {
      enriched = enriched.filter((emp) => emp.status === status);
    }

    res.status(200).json({
      ok: true,
      data: {
        payrollSource: settingsRepository.getPayrollSource(),
        count: enriched.length,
        employees: enriched,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/employees
   * Inserts or updates a single employee and returns the updated audit state.
   */
  upsertEmployee = (req: Request, res: Response): void => {
    const body = (req.body || {}) as Record<string, unknown>;
    const id = String(body.id || '').trim();
    const name = String(body.name || '').trim();
    const role = String(body.role || '').trim();
    const department = String(body.department || 'Unassigned').trim();
    const level = Number(body.level);
    const currentSalary = Number(body.currentSalary);

    if (!id || !name || !role || !Number.isFinite(level) || !Number.isFinite(currentSalary) || currentSalary <= 0) {
      throw new AppError(
        'Please provide valid employee details (ID, Name, Role, Level, and a positive Current Salary).',
        {
          statusCode: 400,
          errorKey: 'employees.missingRequired',
        }
      );
    }

    employeesRepository.upsertEmployee({
      id,
      name,
      role,
      department,
      level,
      currentSalary,
    });

    const audit = auditService.getFullAuditSummary();
    res.status(200).json({
      ok: true,
      data: audit,
      timestamp: new Date().toISOString(),
    });
  };
}

export const employeesController = new EmployeesController();
