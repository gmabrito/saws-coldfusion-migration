const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize, GROUPS } = require('../middleware/authorize');
const billingService = require('../services/billingService');
const EventRepository = require('../repositories/eventRepository');
const AccountRepository = require('../repositories/accountRepository');
const MeterRepository = require('../repositories/meterRepository');
const BillingRepository = require('../repositories/billingRepository');

const eventRepo = new EventRepository();
const accountRepo = new AccountRepository();
const meterRepo = new MeterRepository();
const billingRepo = new BillingRepository();

router.use(authenticate);

/**
 * GET /api/reports/assessment/:accountNum
 * Assessment report data for an account.
 * Authorize: Admin
 */
router.get(
  '/assessment/:accountNum',
  authorize([GROUPS.ADMIN]),
  [param('accountNum').notEmpty()],
  async (req, res) => {
    try {
      const accountNum = req.params.accountNum;

      const [account, meters, assessments, readings] = await Promise.all([
        accountRepo.getAccount(accountNum),
        meterRepo.getActiveMeters(accountNum),
        billingRepo.getAssessments({ accountNum }),
        meterRepo.getReadings({ accountNum }),
      ]);

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json({
        account,
        meters,
        assessments,
        readings: readings.slice(0, 24), // last 24 readings
        summary: {
          totalAssessments: assessments.length,
          pendingAssessments: assessments.filter((a) => !a.IsAssessed).length,
          completedAssessments: assessments.filter((a) => a.IsAssessed).length,
          activeMeterCount: meters.length,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/reports/events
 * Event log query.
 * Authorize: Admin
 */
router.get(
  '/events',
  authorize([GROUPS.ADMIN]),
  async (req, res) => {
    try {
      const filters = {
        type: req.query.type,
        userId: req.query.userId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit,
      };
      const events = await eventRepo.getEvents(filters);
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/reports/dashboard
 * Dashboard metrics.
 * Authorize: User+
 */
router.get(
  '/dashboard',
  authorize([GROUPS.ADMIN, GROUPS.USER, GROUPS.READONLY]),
  async (req, res) => {
    try {
      const { getDb, sql } = require('../config/database');
      const pool = await getDb();

      // Get summary metrics in parallel
      const [accountsResult, pendingResult, metersResult, recentReadingsResult] = await Promise.all([
        pool.request().query(
          `SELECT COUNT(*) AS totalAccounts,
                  SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS activeAccounts
           FROM frs.Accounts`
        ),
        pool.request().query(
          `SELECT COUNT(*) AS pendingAssessments FROM frs.BillingAssessments WHERE IsAssessed = 0`
        ),
        pool.request().query(
          `SELECT COUNT(*) AS totalMeters,
                  SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS activeMeters
           FROM frs.Meters`
        ),
        pool.request().query(
          `SELECT TOP 10 r.AccountNum, r.Serial, r.ReadingDate, r.ReadingValue, r.Consumption
           FROM frs.MeterReadings r
           ORDER BY r.EntryDate DESC`
        ),
      ]);

      res.json({
        accounts: accountsResult.recordset[0],
        assessments: pendingResult.recordset[0],
        meters: metersResult.recordset[0],
        recentReadings: recentReadingsResult.recordset,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
