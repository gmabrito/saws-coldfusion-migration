const RateRepository = require('../repositories/rateRepository');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

const rateRepo = new RateRepository();

class RateService {
  /**
   * Get all rates effective as of a given date.
   */
  async getRates(effectiveDate) {
    const rates = await rateRepo.getRatesForDate(effectiveDate || new Date());
    return rates;
  }

  /**
   * Set or update a rate value.
   * Inserts a new ProgramCtrl row with the given effective date.
   */
  async setRate(key, value, effectiveDate, userId) {
    if (!key) throw new Error('Rate key is required');
    if (value === undefined || value === null) throw new Error('Rate value is required');
    if (!effectiveDate) throw new Error('Effective date is required');

    // Check if this key already has a value for the same effective date
    const existing = await rateRepo.getCtrlCoreValue(key, effectiveDate);
    const isNew = !existing || existing.EffectiveDate.toISOString().split('T')[0] !== new Date(effectiveDate).toISOString().split('T')[0];

    const result = await rateRepo.setCtrlCoreValue({
      ctrlType: 'CR',
      ctrlKey: key,
      ctrlValue: String(value),
      effectiveDate,
      displayValue: String(value),
    });

    const eventType = isNew ? EVENT_TYPES.RATE_CREATED : EVENT_TYPES.RATE_UPDATED;
    await eventBus.publish(eventType, {
      ctrlId: result.CtrlID,
      key,
      value,
      effectiveDate,
      setBy: userId,
    }, userId);

    return result;
  }

  /**
   * Get minimum / availability charges by meter size for a given date.
   */
  async getMinimumCharges(effectiveDate) {
    const charges = await rateRepo.getAvailabilityCharges(effectiveDate || new Date());

    // Parse into a structured format
    const parsed = {};
    for (const row of charges) {
      // Key pattern: FRS_SWR_AVAIL_IOCLI_1 or FRS_SWR_AVAIL_IOCLO_3_4
      const match = row.CtrlKey.match(/FRS_SWR_AVAIL_(IOCLI|IOCLO)_(.+)/);
      if (match) {
        const type = match[1] === 'IOCLI' ? 'ICL' : 'OCL';
        const meterSize = match[2].replace('_', '/');
        if (!parsed[meterSize]) parsed[meterSize] = {};
        parsed[meterSize][type] = parseFloat(row.CtrlValue) || 0;
      }
    }

    return parsed;
  }

  /**
   * Get rate tier thresholds and rates for a given date.
   */
  async getRateTiers(effectiveDate) {
    const tierData = await rateRepo.getTierRates(effectiveDate || new Date());

    const tiers = {};
    for (const row of tierData) {
      // Parse tier keys
      const thresholdMatch = row.CtrlKey.match(/FRS_BILL_RATE_TIERS_(\d+)/);
      const rateMatch = row.CtrlKey.match(/FRS_BILL_RATE_(ICL|OCL)_T(\d+)/);

      if (thresholdMatch) {
        const tierNum = thresholdMatch[1];
        if (!tiers[tierNum]) tiers[tierNum] = {};
        tiers[tierNum].threshold = parseFloat(row.CtrlValue) || 0;
      } else if (rateMatch) {
        const type = rateMatch[1];
        const tierNum = rateMatch[2];
        if (!tiers[tierNum]) tiers[tierNum] = {};
        if (!tiers[tierNum].rates) tiers[tierNum].rates = {};
        tiers[tierNum].rates[type] = parseFloat(row.CtrlValue) || 0;
      }
    }

    return tiers;
  }

  /**
   * Get all program control lists by type.
   */
  async getControlLists(ctrlType) {
    return rateRepo.getProgramCtrlLists(ctrlType || 'CR');
  }
}

module.exports = new RateService();
