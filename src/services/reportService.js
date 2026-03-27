import {API_BASE_URL} from '../Constants/Base_URL';

// Helper to get token
const getToken = () => {
  try {
    const token = global.token || null;
    return token;
  } catch (error) {
    console.log('Error getting token:', error);
    return null;
  }
};

// Generic report generator with flexible params
const generateReport = async (params) => {
  const { type, startDate, endDate, workerId, companyId, workerIds, department, showChartData = false } = params;

  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build body - only include non-undefined values
    const body = {
      type,
      startDate,
      endDate,
    };

    if (workerId !== undefined) body.workerId = workerId;
    if (companyId !== undefined) body.companyId = companyId;
    if (workerIds !== undefined) body.workerIds = workerIds;
    if (department !== undefined) body.department = department;
    if (showChartData !== undefined) body.showChartData = showChartData;

    const response = await fetch(`${API_BASE_URL}public/reports/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`API Response for ${type}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`API Error for ${type}:`, error);
    throw error;
  }
};

// Report type constants for reference:
const REPORT_TYPES = {
  SCHEDULE_COMPLIANCE: 'schedule_compliance',
  ATTENDANCE: 'attendance',
  TASK: 'task',
  WORKER_PERFORMANCE: 'worker_performance',
  WORKER_DAILY: 'worker_daily',
  DEPARTMENT_PERFORMANCE: 'department_performance',
  COMPANY_PERFORMANCE: 'company_performance',
  COMPANY_DAILY: 'company_daily',
  PAYROLL: 'payroll',
  REIMBURSEMENT: 'reimbursement',
};

// Schedule Compliance Report
export const getScheduleComplianceReport = async (startDate, endDate, workerId, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.SCHEDULE_COMPLIANCE,
    startDate,
    endDate,
    workerId,
    companyId,
    showChartData: true,
  });
};

// Attendance Report
export const getAttendanceReport = async (startDate, endDate, workerId, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.ATTENDANCE,
    startDate,
    endDate,
    workerId,
    companyId,
  });
};

// Task Report
export const getTaskReport = async (startDate, endDate, workerId, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.TASK,
    startDate,
    endDate,
    workerId,
    companyId,
  });
};

// Worker Daily Report
export const getWorkerDailyReport = async (startDate, endDate, workerId, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.WORKER_DAILY,
    startDate,
    endDate,
    workerId,
    companyId,
    showChartData: true,
  });
};

// Worker Performance Report (single worker)
export const getWorkerPerformanceReport = async (startDate, endDate, workerId, companyId, showChartData = true) => {
  return await generateReport({
    type: REPORT_TYPES.WORKER_PERFORMANCE,
    startDate,
    endDate,
    workerId,
    companyId,
    showChartData,
  });
};

// Worker Performance Report (multiple workers)
export const getWorkerPerformanceReportMultiple = async (startDate, endDate, workerIds, companyId, showChartData = true) => {
  return await generateReport({
    type: REPORT_TYPES.WORKER_PERFORMANCE,
    startDate,
    endDate,
    workerIds,
    companyId,
    showChartData,
  });
};

// Department Performance Report
export const getDepartmentPerformanceReport = async (startDate, endDate, companyId, department) => {
  return await generateReport({
    type: REPORT_TYPES.DEPARTMENT_PERFORMANCE,
    startDate,
    endDate,
    companyId,
    department,
  });
};

// Company Performance Report
export const getCompanyPerformanceReport = async (startDate, endDate, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.COMPANY_PERFORMANCE,
    startDate,
    endDate,
    companyId,
  });
};

// Company Daily Report
export const getCompanyDailyReport = async (startDate, endDate, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.COMPANY_DAILY,
    startDate,
    endDate,
    companyId,
    showChartData: true,
  });
};

// Payroll Report
export const getPayrollReport = async (startDate, endDate, workerId, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.PAYROLL,
    startDate,
    endDate,
    workerId,
    companyId,
  });
};

// Reimbursement Report
export const getReimbursementReport = async (startDate, endDate, workerId, companyId) => {
  return await generateReport({
    type: REPORT_TYPES.REIMBURSEMENT,
    startDate,
    endDate,
    workerId,
    companyId,
  });
};

export { REPORT_TYPES };

export default {
  getScheduleComplianceReport,
  getAttendanceReport,
  getTaskReport,
  getWorkerDailyReport,
  getWorkerPerformanceReport,
  getWorkerPerformanceReportMultiple,
  getDepartmentPerformanceReport,
  getCompanyPerformanceReport,
  getCompanyDailyReport,
  getPayrollReport,
  getReimbursementReport,
  REPORT_TYPES,
};
