const { pool } = require('../src/config/db');
const { hashPin } = require('../src/utils/hash');
const { generateId } = require('../src/utils/idGenerator');
const logger = require('../src/utils/logger');

const seedData = async () => {
  try {
    logger.info('Starting database seeding...');

    const testUsers = [
      {
        id: generateId(),
        fullName: 'Test User',
        username: 'testuser',
        pin: '1234',
        phoneNumber: '+254712345678',
        balance: 5000
      },
      {
        id: generateId(),
        fullName: 'Demo User',
        username: 'demo',
        pin: '1234',
        phoneNumber: '+254723456789',
        balance: 1000
      },
      {
        id: generateId(),
        fullName: 'Emergency User',
        username: 'emergency',
        pin: '5678',
        phoneNumber: '+254734567890',
        balance: 2500
      }
    ];

    for (const userData of testUsers) {
      const pinHash = await hashPin(userData.pin);
      
      const userResult = await pool.query(
        `INSERT INTO users (id, full_name, username, pin_hash, phone_number, status) 
         VALUES ($1, $2, $3, $4, $5, 'active') 
         RETURNING id`,
        [userData.id, userData.fullName, userData.username, pinHash, userData.phoneNumber]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        await pool.query(
          `INSERT INTO wallets (id, user_id, balance, daily_limit, monthly_limit) 
           VALUES ($1, $2, $3, 5000, 50000)`,
          [generateId(), userId, userData.balance]
        );

        logger.info(`Created user: ${userData.username} with PIN: ${userData.pin}`);
      }
    }

    logger.info('Database seeding completed successfully');
    console.log('\n=== Test Accounts Created ===');
    testUsers.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`PIN: ${user.pin}`);
      console.log(`Phone: ${user.phoneNumber}`);
      console.log(`Balance: KES ${user.balance}`);
      console.log('---');
    });

  } catch (error) {
    logger.error('Database seeding failed', { error: error.message });
    console.error('Seeding failed:', error);
    throw error;
  }
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedData };
