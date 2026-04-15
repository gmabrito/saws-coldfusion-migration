const MeterRepository = require('../repositories/meterRepository');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

const meterRepo = new MeterRepository();

/**
 * Unit of measure conversion factors to CCF (hundred cubic feet).
 * 1 CCF = 748.1 gallons = 100 cubic feet
 */
const UOM_TO_CCF = {
  GAL: 1 / 748.1,     // gallons to CCF
  CF: 1 / 100,        // cubic feet to CCF
  CCF: 1,             // already CCF
  LB: 1 / 62312.5,    // pounds (water) to CCF  (~62.3125 lb/cf * 100)
};

class MeterService {
  /**
   * Add a new meter to an account.
   */
  async addMeter(data, userId) {
    if (!data.accountNum) throw new Error('Account number is required');
    if (!data.serial) throw new Error('Serial number is required');
    if (!data.functionType) throw new Error('Function type is required');

    const validFunctions = ['MAKEUP', 'BLOWDOWN', 'LOSS', 'SEWER', 'INCOMING'];
    if (!validFunctions.includes(data.functionType.toUpperCase())) {
      throw new Error(`Invalid function type. Must be one of: ${validFunctions.join(', ')}`);
    }

    const result = await meterRepo.createMeter(data);

    await eventBus.publish(EVENT_TYPES.METER_ADDED, {
      meterId: result.MeterID,
      accountNum: data.accountNum,
      serial: data.serial,
      functionType: data.functionType,
      addedBy: userId,
    }, userId);

    return result;
  }

  /**
   * Deactivate a meter.
   */
  async deactivateMeter(meterId, userId) {
    const meter = await meterRepo.getMeterById(meterId);
    if (!meter) throw new Error(`Meter ${meterId} not found`);

    await meterRepo.deactivateMeter(meterId);

    await eventBus.publish(EVENT_TYPES.METER_DEACTIVATED, {
      meterId,
      accountNum: meter.AccountNum,
      serial: meter.Serial,
      deactivatedBy: userId,
    }, userId);

    return { meterId, deactivated: true };
  }

  /**
   * Submit a meter reading.
   *
   * CRITICAL: Preserves the ColdFusion rollover detection logic:
   * - If consumption < 0 AND prior reading > 40% of meter max -> rollover
   * - If consumption < 0 AND not rollover -> reset
   * - Converts raw reading to CCF based on UOM
   */
  async submitReading(data, userId) {
    if (!data.accountNum) throw new Error('Account number is required');
    if (!data.serial) throw new Error('Serial number is required');
    if (data.readingValue === undefined) throw new Error('Reading value is required');
    if (!data.readingDate) throw new Error('Reading date is required');

    // Get meter info for UOM and max reading
    const meters = await meterRepo.getActiveMeters(data.accountNum);
    const meter = meters.find((m) => m.Serial === data.serial);
    if (!meter) throw new Error(`Active meter ${data.serial} not found for account ${data.accountNum}`);

    // Get last reading for consumption calculation
    const lastReading = await meterRepo.getLastReading(data.accountNum, data.serial);

    let consumption = 0;
    let isRollover = false;
    let isReset = false;

    if (lastReading) {
      consumption = data.readingValue - lastReading.ReadingValue;

      // CF rollover detection logic
      if (consumption < 0) {
        // Check if prior reading is more than 40% of the meter's max reading
        // This indicates the meter has rolled over (passed max and started from 0)
        if (lastReading.ReadingValue > meter.MaxReading * 0.4) {
          // Rollover: consumption = (max - prior) + current
          consumption = (meter.MaxReading - lastReading.ReadingValue) + data.readingValue;
          isRollover = true;

          await eventBus.publish(EVENT_TYPES.READING_ROLLOVER, {
            accountNum: data.accountNum,
            serial: data.serial,
            priorReading: lastReading.ReadingValue,
            currentReading: data.readingValue,
            maxReading: meter.MaxReading,
            calculatedConsumption: consumption,
          }, userId);
        } else {
          // Reset: meter was replaced or reset, treat current reading as full consumption
          consumption = data.readingValue;
          isReset = true;

          await eventBus.publish(EVENT_TYPES.READING_RESET, {
            accountNum: data.accountNum,
            serial: data.serial,
            priorReading: lastReading.ReadingValue,
            currentReading: data.readingValue,
          }, userId);
        }
      }
    } else {
      // First reading for this meter: consumption is 0
      consumption = 0;
    }

    // Convert to CCF based on meter UOM
    const uom = (meter.UOM || 'GAL').toUpperCase();
    const conversionFactor = UOM_TO_CCF[uom] || UOM_TO_CCF.GAL;
    const consumptionCCF = consumption * conversionFactor;

    // Determine which CCF field to populate based on function type
    const ccfFields = {
      makeupCCF: 0,
      blowdownCCF: 0,
      lossCCF: 0,
      sewerCCF: 0,
      incomingCCF: 0,
    };

    const functionMap = {
      MAKEUP: 'makeupCCF',
      BLOWDOWN: 'blowdownCCF',
      LOSS: 'lossCCF',
      SEWER: 'sewerCCF',
      INCOMING: 'incomingCCF',
    };

    const ccfField = functionMap[meter.FunctionType.toUpperCase()];
    if (ccfField) {
      ccfFields[ccfField] = consumptionCCF;
    }

    // Calculate percent change
    let pctChange = 0;
    if (lastReading && lastReading.Consumption && lastReading.Consumption !== 0) {
      pctChange = ((consumption - lastReading.Consumption) / lastReading.Consumption) * 100;
    }

    const readingData = {
      accountNum: data.accountNum,
      serial: data.serial,
      readingDate: data.readingDate,
      readingValue: data.readingValue,
      consumption,
      ...ccfFields,
      pctChange,
    };

    const result = await meterRepo.insertReading(readingData);

    await eventBus.publish(EVENT_TYPES.READING_SUBMITTED, {
      readingId: result.ReadingID,
      accountNum: data.accountNum,
      serial: data.serial,
      readingValue: data.readingValue,
      consumption,
      consumptionCCF,
      uom,
      isRollover,
      isReset,
      submittedBy: userId,
    }, userId);

    return {
      ...result,
      consumption,
      consumptionCCF,
      isRollover,
      isReset,
    };
  }

  /**
   * Get readings with optional filters.
   */
  async getReadings(filters) {
    return meterRepo.getReadings(filters);
  }

  /**
   * Get meters for an account.
   */
  async getMeters(accountNum) {
    return meterRepo.getMeters(accountNum);
  }

  /**
   * Recalculate readings for an account/serial.
   * Deletes existing readings and re-processes from raw data.
   */
  async recalculate(accountNum, serial) {
    // Get all current readings in chronological order before deleting
    const existingReadings = await meterRepo.getReadings({
      accountNum,
      serial,
    });

    if (existingReadings.length === 0) {
      return { recalculated: 0 };
    }

    // Sort chronologically
    existingReadings.sort((a, b) => new Date(a.ReadingDate) - new Date(b.ReadingDate));

    // Delete all readings for this meter
    await meterRepo.deleteReadings(accountNum, serial);

    // Re-insert each reading using the submitReading logic
    let count = 0;
    for (const reading of existingReadings) {
      await this.submitReading(
        {
          accountNum,
          serial,
          readingDate: reading.ReadingDate,
          readingValue: reading.ReadingValue,
        },
        'SYSTEM-RECALC'
      );
      count++;
    }

    return { recalculated: count };
  }
}

module.exports = new MeterService();
