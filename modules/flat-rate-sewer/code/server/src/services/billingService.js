const BillingRepository = require('../repositories/billingRepository');
const RateRepository = require('../repositories/rateRepository');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

const billingRepo = new BillingRepository();
const rateRepo = new RateRepository();

class BillingService {
  /**
   * Calculate sewer charge - EXACT port of ColdFusion algorithm from FRSobjects.cfc.
   *
   * Algorithm:
   * 1. Get rates for calcDate from rateRepository
   * 2. Convert consumption to gallons: gallons = consumption * 748.1
   *    (consumption is in CCF; 1 CCF = 748.1 gallons)
   * 3. Get minimum charge (availability charge) from rates by meter size and ICL/OCL
   * 4. Loop tiers backwards: for each tier, if remaining > threshold, charge excess at tier rate
   * 5. Return minimum + tiered total
   *
   * @param {string} iclocl - 'ICL' or 'OCL' (inside/outside city limits)
   * @param {string} meterSize - meter size code (e.g., '5/8', '3/4', '1', '1.5', '2', '3', '4', '6', '8')
   * @param {number} consumption - consumption in CCF
   * @param {string} basis - billing basis (e.g., 'VOLUME', 'FLAT')
   * @param {Date|string} calcDate - date to determine which rate schedule applies
   * @returns {{ minimumCharge, tieredCharge, totalCharge, tiers }}
   */
  async calcSewerCharge(iclocl, meterSize, consumption, basis, calcDate) {
    const effectiveDate = calcDate || new Date();

    // 1. Get all rates for this date
    const allRates = await rateRepo.getRatesForDate(effectiveDate);

    // Build lookup maps from ProgramCtrl rows
    const rateMap = {};
    for (const row of allRates) {
      rateMap[row.CtrlKey] = parseFloat(row.CtrlValue) || 0;
    }

    // 2. Convert consumption from CCF to gallons for charge calculation
    //    CF code: ccf = consumption * 748.1
    //    (In the CF code, the variable name is misleading; it's actually converting TO gallons)
    const gallons = consumption * 748.1;

    // 3. Get minimum charge (availability/service charge) by meter size and ICL/OCL
    //    Key pattern: FRS_SWR_AVAIL_IOCLI_{meterSize} for ICL, FRS_SWR_AVAIL_IOCLO_{meterSize} for OCL
    const ioclSuffix = iclocl.toUpperCase() === 'OCL' ? 'IOCLO' : 'IOCLI';
    const meterSizeKey = meterSize.replace('/', '_');
    const availKey = `FRS_SWR_AVAIL_${ioclSuffix}_${meterSizeKey}`;
    const minimumCharge = rateMap[availKey] || 0;

    // 4. Get tier rates and thresholds
    //    Tiers are stored as FRS_BILL_RATE_TIERS_1, FRS_BILL_RATE_TIERS_2, etc.
    //    Each tier has a threshold (in gallons) and a rate (per gallon)
    //    Tier structure: { threshold, rate }
    //    Rate keys: FRS_BILL_RATE_{ICL|OCL}_T{n} for rate, FRS_BILL_RATE_TIERS_{n} for threshold
    const tiers = [];
    for (let i = 1; i <= 10; i++) {
      const thresholdKey = `FRS_BILL_RATE_TIERS_${i}`;
      const rateKey = `FRS_BILL_RATE_${iclocl.toUpperCase()}_T${i}`;

      if (rateMap[thresholdKey] !== undefined || rateMap[rateKey] !== undefined) {
        tiers.push({
          tier: i,
          threshold: rateMap[thresholdKey] || 0,
          rate: rateMap[rateKey] || 0,
        });
      }
    }

    // Sort tiers by threshold ascending
    tiers.sort((a, b) => a.threshold - b.threshold);

    // 5. Calculate tiered charges - loop tiers backwards
    //    For each tier, if remaining gallons > threshold, charge the excess at the tier rate
    let tieredCharge = 0;
    let remaining = gallons;
    const tierBreakdown = [];

    // Process tiers from highest to lowest
    for (let i = tiers.length - 1; i >= 0; i--) {
      const tier = tiers[i];
      if (remaining > tier.threshold) {
        const taxableAtTier = remaining - tier.threshold;
        const chargeAtTier = taxableAtTier * tier.rate;
        tieredCharge += chargeAtTier;
        remaining = tier.threshold;

        tierBreakdown.unshift({
          tier: tier.tier,
          threshold: tier.threshold,
          rate: tier.rate,
          gallons: taxableAtTier,
          charge: Math.round(chargeAtTier * 100) / 100,
        });
      }
    }

    // Any remaining below the first tier threshold
    if (remaining > 0 && tiers.length > 0) {
      const baseRate = tiers[0].rate;
      const baseCharge = remaining * baseRate;
      tieredCharge += baseCharge;
      tierBreakdown.unshift({
        tier: 0,
        threshold: 0,
        rate: baseRate,
        gallons: remaining,
        charge: Math.round(baseCharge * 100) / 100,
      });
    }

    const totalCharge = minimumCharge + Math.round(tieredCharge * 100) / 100;

    return {
      minimumCharge: Math.round(minimumCharge * 100) / 100,
      tieredCharge: Math.round(tieredCharge * 100) / 100,
      totalCharge: Math.round(totalCharge * 100) / 100,
      gallons: Math.round(gallons * 100) / 100,
      consumptionCCF: consumption,
      iclocl,
      meterSize,
      tiers: tierBreakdown,
    };
  }

  /**
   * Create a new billing assessment.
   */
  async createAssessment(data, userId) {
    if (!data.accountNum) throw new Error('Account number is required');
    if (!data.billingDate) throw new Error('Billing date is required');

    const result = await billingRepo.createAssessment(data);

    await eventBus.publish(EVENT_TYPES.ASSESSMENT_CREATED, {
      assessmentId: result.AssessmentID,
      accountNum: data.accountNum,
      billingDate: data.billingDate,
      createdBy: userId,
    }, userId);

    return result;
  }

  /**
   * Review an assessment (mark as reviewed without changes).
   */
  async reviewAssessment(assessmentId, data, userId) {
    const assessment = await billingRepo.getAssessmentById(assessmentId);
    if (!assessment) throw new Error(`Assessment ${assessmentId} not found`);

    await billingRepo.progressAssessment(assessmentId, data);

    await eventBus.publish(EVENT_TYPES.ASSESSMENT_REVIEWED, {
      assessmentId,
      accountNum: assessment.AccountNum,
      reviewedBy: userId,
    }, userId);

    return billingRepo.getAssessmentById(assessmentId);
  }

  /**
   * Override assessment values (manual override of calculated charges).
   */
  async overrideAssessment(assessmentId, overrides, userId) {
    const assessment = await billingRepo.getAssessmentById(assessmentId);
    if (!assessment) throw new Error(`Assessment ${assessmentId} not found`);

    await billingRepo.progressAssessment(assessmentId, {
      incomingCCFOverride: overrides.incomingCCFOverride,
      sewerChargeOverride: overrides.sewerChargeOverride,
    });

    await eventBus.publish(EVENT_TYPES.ASSESSMENT_OVERRIDDEN, {
      assessmentId,
      accountNum: assessment.AccountNum,
      overrides,
      overriddenBy: userId,
    }, userId);

    return billingRepo.getAssessmentById(assessmentId);
  }

  /**
   * Get assessments with filters.
   */
  async getAssessments(filters) {
    return billingRepo.getAssessments(filters);
  }

  /**
   * Get detailed assessment with billing vs actual comparison.
   */
  async getAssessmentDetail(assessmentId) {
    const assessment = await billingRepo.getAssessmentById(assessmentId);
    if (!assessment) throw new Error(`Assessment ${assessmentId} not found`);

    // Get prior assessments for comparison
    const priorAssessments = await billingRepo.getPriorAssessments(
      assessment.AccountNum,
      assessment.BillingDate
    );

    // Calculate what the charge would be based on actual usage
    let calculatedCharge = null;
    if (assessment.ActualSewer && assessment.ActualSewer > 0) {
      try {
        calculatedCharge = await this.calcSewerCharge(
          'ICL', // default; would come from account record in production
          '1',   // default; would come from account record in production
          assessment.ActualSewer,
          'VOLUME',
          assessment.BillingDate
        );
      } catch (err) {
        // Rate data may not be available; that is acceptable
        calculatedCharge = { error: err.message };
      }
    }

    return {
      assessment,
      priorAssessments,
      calculatedCharge,
      comparison: {
        actualCharge: assessment.ActualCharge,
        billedCharge: assessment.SewerChargeOverride || (calculatedCharge ? calculatedCharge.totalCharge : null),
        difference: assessment.Difference,
      },
    };
  }

  /**
   * Progress assessments (batch mark as reviewed with no changes).
   */
  async progressAssessments(assessmentIds, userId) {
    const results = [];
    for (const id of assessmentIds) {
      const result = await this.reviewAssessment(id, {}, userId);
      results.push(result);
    }
    return results;
  }

  /**
   * Rollback assessments after a given date.
   */
  async rollbackAssessments(accountNum, afterDate, userId) {
    return billingRepo.rollbackPriorAssessments(accountNum, afterDate);
  }
}

module.exports = new BillingService();
