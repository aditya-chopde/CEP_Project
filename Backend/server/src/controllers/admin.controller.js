const fs = require('fs');
const { promisify } = require('util');
const { login, logout } = require('../middleware/adminAuth');
const { REPORTS_FILE } = require('../storage/reports');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

/**
 * POST /api/admin/login
 */
const adminLogin = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Username and password are required' }
    });
  }

  const token = login(username, password);
  if (!token) {
    return res.status(401).json({
      error: { code: 'AUTH_FAILED', message: 'Invalid username or password' }
    });
  }

  res.json({ data: { token } });
};

/**
 * POST /api/admin/logout
 */
const adminLogout = (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    logout(authHeader.slice(7));
  }
  res.json({ data: { message: 'Logged out successfully' } });
};

/**
 * Read all reports from the JSON file.
 */
async function readReports() {
  try {
    const data = await readFileAsync(REPORTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Write all reports back to the JSON file.
 */
async function writeReports(reports) {
  await writeFileAsync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
}

/**
 * GET /api/admin/reports
 * Returns all reports with their status (pending / accepted / rejected).
 */
const getReports = async (req, res, next) => {
  try {
    const reports = await readReports();
    // Add default status for legacy reports that don't have one
    const enriched = reports.map((r) => ({
      ...r,
      status: r.status || 'pending'
    }));
    res.json({ data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/reports/:id
 * Body: { action: 'accept' | 'reject' }
 */
const reviewReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Action must be "accept" or "reject"' }
      });
    }

    const reports = await readReports();
    const index = reports.findIndex((r) => r.id === id);

    if (index === -1) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Report not found' }
      });
    }

    reports[index].status = action === 'accept' ? 'accepted' : 'rejected';
    reports[index].reviewedAt = new Date().toISOString();
    reports[index].reviewedBy = req.adminUser;

    await writeReports(reports);

    res.json({ data: reports[index] });
  } catch (error) {
    next(error);
  }
};

module.exports = { adminLogin, adminLogout, getReports, reviewReport };
