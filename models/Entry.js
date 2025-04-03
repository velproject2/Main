class Entry {
  constructor(client) {
    this.client = client;
  }

  // Initialize the test_entries table (unchanged)
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

  // Create a new entry with SGT timestamp
  async createEntry({ apxNumber, modelName, track, trackNumber, driverName, email }) {
    const checkInTimeSGT = new Date(Date.now() + (8 * 60 * 60 * 1000)).toString(); // UTC to SGT
    const query = `
      INSERT INTO test_entries (apxNumber, modelName, track, trackNumber, driverName, email, checkInTime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [apxNumber, modelName, track, trackNumber, driverName, email, checkInTimeSGT];
    await this.client.execute(query, params, { prepare: true });
    return { apxNumber, modelName, track, trackNumber, driverName, email, checkInTime: checkInTimeSGT };
  }

  // Update checkout time with SGT
  async updateCheckOut(apxNumber, checkInTime) {
    const checkOutTimeSGT = new Date(Date.now() + (8 * 60 * 60 * 1000)).toString(); // UTC to SGT
    const query = `
      UPDATE test_entries SET checkOutTime = ? WHERE apxNumber = ? AND checkInTime = ? IF EXISTS
    `;
    const params = [checkOutTimeSGT, apxNumber, checkInTime];
    const result = await this.client.execute(query, params, { prepare: true });
    return { applied: result.rows[0]['[applied]'], checkOutTime: checkOutTimeSGT };
  }

  // Fetch all entries (unchanged)
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

  // Delete entries (unchanged)
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
