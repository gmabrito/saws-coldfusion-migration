const AccountRepository = require('../repositories/accountRepository');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

const accountRepo = new AccountRepository();

class AccountService {
  /**
   * Create a new FRS account with contact info.
   */
  async createAccount(data, userId) {
    // Validate required fields
    if (!data.accountNum) throw new Error('Account number is required');
    if (!data.facilityDesc) throw new Error('Facility description is required');

    // Check for duplicate
    const existing = await accountRepo.getAccount(data.accountNum);
    if (existing) throw new Error(`Account ${data.accountNum} already exists`);

    // Create account
    data.createdBy = userId;
    const account = await accountRepo.createAccount(data);

    // Create contact if provided
    if (data.businessName || data.contactName) {
      await accountRepo.upsertContact({
        accountNum: data.accountNum,
        businessName: data.businessName,
        contactName: data.contactName,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
      });
    }

    await eventBus.publish(EVENT_TYPES.ACCOUNT_CREATED, {
      accountNum: data.accountNum,
      facilityDesc: data.facilityDesc,
      createdBy: userId,
    }, userId);

    return this.getAccount(data.accountNum);
  }

  /**
   * Update an existing account.
   */
  async updateAccount(accountNum, data, userId) {
    const existing = await accountRepo.getAccount(accountNum);
    if (!existing) throw new Error(`Account ${accountNum} not found`);

    await accountRepo.updateAccount(accountNum, data);

    await eventBus.publish(EVENT_TYPES.ACCOUNT_UPDATED, {
      accountNum,
      changes: data,
      updatedBy: userId,
    }, userId);

    return this.getAccount(accountNum);
  }

  /**
   * Get a single account with contact details.
   */
  async getAccount(accountNum) {
    const account = await accountRepo.getAccount(accountNum);
    if (!account) return null;

    const sites = await accountRepo.getSites(accountNum);
    return { ...account, sites };
  }

  /**
   * Search accounts with pagination.
   */
  async searchAccounts(filters, page, pageSize) {
    return accountRepo.listAccounts(filters, page, pageSize);
  }

  /**
   * Autocomplete name search.
   */
  async lookupByName(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return [];
    return accountRepo.lookupByName(searchTerm);
  }

  /**
   * Update contact information.
   */
  async updateContact(data, userId) {
    if (!data.accountNum) throw new Error('Account number is required');

    const result = await accountRepo.upsertContact(data);

    await eventBus.publish(EVENT_TYPES.CONTACT_UPDATED, {
      accountNum: data.accountNum,
      contactId: result.ContactID,
      updatedBy: userId,
    }, userId);

    return result;
  }
}

module.exports = new AccountService();
