import type { Request, Response } from 'express';
import { enrichEmployeesWithBands } from '../engines/index.js';
import { AppError } from '../middlewares/error-handler.middleware.js';
import {
  bandsRepository,
  complianceRepository,
  employeesRepository,
  manualAdjustmentsRepository,
  settingsRepository,
} from '../repositories/index.js';
import { auditService } from '../services/index.js';

function generateNextEmployeeId(): string {
  const all = employeesRepository.findAll();
  let maxNum = 0;
  for (const emp of all) {
    const match = emp.id.match(/^EMP-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `EMP-${String(maxNum + 1).padStart(3, '0')}`;
}

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
    const legalCompliance = complianceRepository.getLegalComplianceConfig();
    const manualAdjustments = manualAdjustmentsRepository.findAll();

    let enriched = enrichEmployeesWithBands(rawEmployees, bands, {
      legalCompliance,
      manualAdjustments,
    });

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
   * GET /api/employees/:id
   * Retrieves a single employee record enriched with market band, legal compliance, and adjustments.
   */
  getEmployeeById = (req: Request, res: Response): void => {
    const id = String(req.params.id || '').trim();
    const raw = employeesRepository.findById(id);

    if (!raw) {
      throw new AppError(`Employee with ID "${id}" was not found.`, {
        statusCode: 404,
        errorKey: 'employees.notFound',
      });
    }

    const bands = bandsRepository.findAll();
    const legalCompliance = complianceRepository.getLegalComplianceConfig();
    const manualAdjustment = manualAdjustmentsRepository.findByEmployeeId(id);

    const [enriched] = enrichEmployeesWithBands([raw], bands, {
      legalCompliance,
      manualAdjustments: manualAdjustment ? [manualAdjustment] : [],
    });

    res.status(200).json({
      ok: true,
      data: enriched,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/employees
   * Creates a single employee record with validation (Feature A).
   */
  createEmployee = (req: Request, res: Response): void => {
    const body = (req.body || {}) as Record<string, unknown>;
    const name = String(body.name || body.fullName || '').trim();
    const role = String(body.role || body.jobTitle || '').trim();
    const department = String(body.department || 'Engineering').trim();
    const level = Number(body.level !== undefined ? body.level : body.jobLevel);
    const currentSalary = Number(
      body.currentSalary !== undefined
        ? body.currentSalary
        : (body.salary !== undefined ? body.salary : body.fixedBaseSalary)
    );
    let id = String(body.id || '').trim();

    if (!name || !role || !department || !Number.isFinite(level) || !Number.isFinite(currentSalary) || currentSalary <= 0) {
      throw new AppError(
        'Please provide valid employee details (Full Name, Job Title, Department, Level L1-L8, and positive Base Salary).',
        {
          statusCode: 400,
          errorKey: 'employees.invalidFields',
        }
      );
    }

    if (level < 1 || level > 8) {
      throw new AppError('Job Level must be between 1 and 8.', {
        statusCode: 400,
        errorKey: 'employees.invalidLevel',
      });
    }

    if (!id) {
      id = generateNextEmployeeId();
    } else {
      const existing = employeesRepository.findById(id);
      if (existing) {
        throw new AppError(`An employee with ID "${id}" already exists.`, {
          statusCode: 409,
          errorKey: 'employees.idConflict',
        });
      }
    }

    const newEmployee = employeesRepository.upsertEmployee({
      id,
      name,
      role,
      department,
      level,
      currentSalary,
    });

    const audit = auditService.getFullAuditSummary();

    res.status(201).json({
      ok: true,
      data: {
        employee: newEmployee,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * PUT /api/employees/:id
   * Updates an existing employee's salary, role, department, level, or manual adjustment (Feature A & B).
   */
  updateEmployee = (req: Request, res: Response): void => {
    const id = String(req.params.id || '').trim();
    const existing = employeesRepository.findById(id);

    if (!existing) {
      throw new AppError(`Employee with ID "${id}" was not found.`, {
        statusCode: 404,
        errorKey: 'employees.notFound',
      });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const name = body.name !== undefined ? String(body.name).trim() : (body.fullName !== undefined ? String(body.fullName).trim() : existing.name);
    const role = body.role !== undefined ? String(body.role).trim() : (body.jobTitle !== undefined ? String(body.jobTitle).trim() : existing.role);
    const department = body.department !== undefined ? String(body.department).trim() : existing.department;
    const level = body.level !== undefined ? Number(body.level) : (body.jobLevel !== undefined ? Number(body.jobLevel) : existing.level);
    const currentSalary = body.currentSalary !== undefined
      ? Number(body.currentSalary)
      : (body.salary !== undefined ? Number(body.salary) : (body.fixedBaseSalary !== undefined ? Number(body.fixedBaseSalary) : existing.currentSalary));

    if (!name || !role || !department || !Number.isFinite(level) || !Number.isFinite(currentSalary) || currentSalary <= 0) {
      throw new AppError(
        'Please provide valid employee details (Full Name, Job Title, Department, Level L1-L8, and positive Base Salary).',
        {
          statusCode: 400,
          errorKey: 'employees.invalidFields',
        }
      );
    }

    if (level < 1 || level > 8) {
      throw new AppError('Job Level must be between 1 and 8.', {
        statusCode: 400,
        errorKey: 'employees.invalidLevel',
      });
    }

    // Handle optional manual adjustment patch
    if (body.manualAdjustment !== undefined) {
      if (body.manualAdjustment === null) {
        manualAdjustmentsRepository.deleteAdjustment(id);
      } else if (typeof body.manualAdjustment === 'object') {
        const adj = body.manualAdjustment as Record<string, unknown>;
        const type = adj.type === 'percent' ? 'percent' : 'amount';
        const value = Number(adj.value) || 0;
        const notes = typeof adj.notes === 'string' ? adj.notes : undefined;
        let proposedSalary = currentSalary;
        if (type === 'percent') {
          proposedSalary = Math.round(currentSalary * (1 + value / 100));
        } else {
          proposedSalary = Math.round(currentSalary + value);
        }

        manualAdjustmentsRepository.upsertAdjustment({
          employeeId: id,
          type,
          value,
          proposedSalary,
          notes,
        });
      }
    }

    const updatedEmployee = employeesRepository.upsertEmployee({
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
      data: {
        employee: updatedEmployee,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * DELETE /api/employees/:id
   * Removes an employee from SQLite and recalculates all KPIs in < 1s (Feature A).
   */
  deleteEmployee = (req: Request, res: Response): void => {
    const id = String(req.params.id || '').trim();
    const existing = employeesRepository.findById(id);

    if (!existing) {
      throw new AppError(`Employee with ID "${id}" was not found.`, {
        statusCode: 404,
        errorKey: 'employees.notFound',
      });
    }

    manualAdjustmentsRepository.deleteAdjustment(id);
    const deleted = employeesRepository.deleteById(id);

    if (!deleted) {
      throw new AppError(`Failed to delete employee with ID "${id}".`, {
        statusCode: 500,
        errorKey: 'employees.deleteFailed',
      });
    }

    const audit = auditService.getFullAuditSummary();

    res.status(200).json({
      ok: true,
      data: {
        deletedId: id,
        deletedName: existing.name,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };
}

export const employeesController = new EmployeesController();
