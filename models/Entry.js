class Entry {
  constructor(client) {
    this.client = client;
  }

  // Initialize the test_entries table
  async initialize() {
    try {
      await this.client.execute(
        'CREATE TABLE IF NOT EXISTS test_entries (apxNumber text, modelName text, track text, trackNumber text, driverName text, email text, checkInTime text, checkOutTime text, totalPrice double, PRIMARY KEY (apxNumber, checkInTime))'
      );
      console.log('Test_entries table initialized');
    } catch (err) {
      console.error('Error initializing test_entries table:', err);
      throw err;
    }
  }

  // Create a new entry with IST timestamp
  async createEntry({ apxNumber, modelName, track, trackNumber, driverName, email }) {
    const checkInTimeIST = new Date(Date.now() + (5.5 * 60 * 60 * 1000)).toString(); // UTC to IST
    const query = `
      INSERT INTO test_entries (apxNumber, modelName, track, trackNumber, driverName, email, checkInTime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [apxNumber, modelName, track, trackNumber, driverName, email, checkInTimeIST];
    await this.client.execute(query, params, { prepare: true });
    return { apxNumber, modelName, track, trackNumber, driverName, email, checkInTime: checkInTimeIST };
  }

  // Update checkout time with IST
  async updateCheckOut(apxNumber, checkInTime) {
    const checkOutTimeIST = new Date(Date.now() + (5.5 * 60 * 60 * 1000)).toString(); // UTC to IST
    const query = `
      UPDATE test_entries SET checkOutTime = ? WHERE apxNumber = ? AND checkInTime = ? IF EXISTS
    `;
    const params = [checkOutTimeIST, apxNumber, checkInTime];
    const result = await this.client.execute(query, params, { prepare: true });
    return { applied: result.rows[0]['[applied]'], checkOutTime: checkOutTimeIST };
  }

  // Fetch all entries
  async getAllEntries() {
    const query = 'SELECT * FROM test_entries';
    const result = await this.client.execute(query);
    return result.rows.map(row => ({
      apxNumber: row.apxnumber,
      modelName: row.modelname,
      track: row.track,
      trackNumber: row.tracknumber,
      driverName: row.drivername,
      email: row.email,
      checkInTime: row.checkintime,
      checkOutTime: row.checkouttime,
      totalPrice: row.totalprice
    }));
  }

  // Delete entries
  async deleteEntries(apxNumbers) {
    const query = 'DELETE FROM test_entries WHERE apxNumber = ? AND checkInTime IN (SELECT checkInTime FROM test_entries WHERE apxNumber = ?)';
    for (const apxNumber of apxNumbers) {
      const entries = await this.getAllEntries();
      const checkInTimes = entries.filter(e => e.apxNumber === apxNumber).map(e => e.checkInTime);
      await this.client.execute(query, [apxNumber, apxNumber], { prepare: true });
    }
  }
}

module.exports = Entry;
