const express = require('express');
const { requireAdmin } = require('../middleware/adminAuth');
const {
  adminLogin,
  adminLogout,
  getReports,
  reviewReport
} = require('../controllers/admin.controller');

const router = express.Router();

// Public – login
router.post('/login', adminLogin);

// Protected – require valid admin session
router.post('/logout', requireAdmin, adminLogout);
router.get('/reports', requireAdmin, getReports);
router.patch('/reports/:id', requireAdmin, reviewReport);

module.exports = router;
