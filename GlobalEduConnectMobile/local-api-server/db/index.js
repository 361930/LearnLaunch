/**
 * Database layer for GlobalEduConnect Local API Server
 * 
 * Provides:
 * - SQLite database initialization and connection
 * - Database schema creation
 * - Data migration handling
 * - Connection pooling
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_FILE = path.join(__dirname, '../data/gec.db');
const DB_DIR = path.dirname(DB_FILE);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Database connection
let db = null;

// Current schema version
const SCHEMA_VERSION = 1;

/**
 * Initialize database connection
 * @returns {Promise} Promise resolving when database is ready
 */
function init() {
  return new Promise((resolve, reject) => {
    // Create database connection
    db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Database connection error:', err.message);
        return reject(err);
      }
      
      console.log('Connected to SQLite database');
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Failed to enable foreign keys:', err.message);
          return reject(err);
        }
        
        // Initialize database schema
        initSchema()
          .then(() => {
            // Check and run migrations if needed
            return checkMigrations();
          })
          .then(() => {
            console.log('Database ready');
            resolve();
          })
          .catch(reject);
      });
    });
  });
}

/**
 * Close database connection
 * @returns {Promise} Promise resolving when database is closed
 */
function close() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          return reject(err);
        }
        
        console.log('Database connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Initialize database schema if not already created
 * @returns {Promise} Promise resolving when schema is ready
 */
function initSchema() {
  return new Promise((resolve, reject) => {
    // First, check if settings table exists to determine if we need to create tables
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'", (err, row) => {
      if (err) {
        return reject(err);
      }
      
      // If settings table doesn't exist, create all tables
      if (!row) {
        console.log('Initializing database schema...');
        
        // Start a transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          // Create settings table to track schema version
          db.run(`
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            )
          `);
          
          // Store schema version
          db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['schema_version', SCHEMA_VERSION.toString()]);
          
          // Users table
          db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              name TEXT NOT NULL,
              role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
              status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('active', 'pending', 'blocked')),
              profile_image TEXT,
              preferred_language TEXT DEFAULT 'en',
              timezone TEXT DEFAULT 'UTC',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Classes table
          db.run(`
            CREATE TABLE IF NOT EXISTS classes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              description TEXT,
              teacher_id INTEGER NOT NULL,
              subject TEXT NOT NULL,
              grade_level TEXT,
              cover_image TEXT,
              status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'draft')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
            )
          `);
          
          // Enrollments table (connects students to classes)
          db.run(`
            CREATE TABLE IF NOT EXISTS enrollments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              student_id INTEGER NOT NULL,
              class_id INTEGER NOT NULL,
              status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'dropped')),
              enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              completion_date TIMESTAMP,
              FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
              FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
              UNIQUE(student_id, class_id)
            )
          `);
          
          // Class Modules table
          db.run(`
            CREATE TABLE IF NOT EXISTS class_modules (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              class_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              order_index INTEGER NOT NULL,
              status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'draft', 'archived')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
            )
          `);
          
          // Lessons table
          db.run(`
            CREATE TABLE IF NOT EXISTS lessons (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              module_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              content TEXT,
              order_index INTEGER NOT NULL,
              duration_minutes INTEGER,
              status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'draft', 'archived')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (module_id) REFERENCES class_modules (id) ON DELETE CASCADE
            )
          `);
          
          // Assignments table
          db.run(`
            CREATE TABLE IF NOT EXISTS assignments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              class_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              due_date TIMESTAMP,
              points INTEGER DEFAULT 100,
              status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'draft', 'archived')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
            )
          `);
          
          // Submissions table
          db.run(`
            CREATE TABLE IF NOT EXISTS submissions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              assignment_id INTEGER NOT NULL,
              student_id INTEGER NOT NULL,
              content TEXT,
              submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              grade REAL,
              feedback TEXT,
              status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('draft', 'submitted', 'graded', 'returned')),
              FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
              FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
              UNIQUE(assignment_id, student_id)
            )
          `);
          
          // Chat messages table
          db.run(`
            CREATE TABLE IF NOT EXISTS chat_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sender_id INTEGER NOT NULL,
              class_id INTEGER,
              recipient_id INTEGER,
              message TEXT NOT NULL,
              is_read BOOLEAN DEFAULT 0,
              sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
              FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
              FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
              CHECK ((class_id IS NULL AND recipient_id IS NOT NULL) OR (class_id IS NOT NULL AND recipient_id IS NULL))
            )
          `);
          
          // Challenges table
          db.run(`
            CREATE TABLE IF NOT EXISTS challenges (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              description TEXT,
              creator_id INTEGER NOT NULL,
              start_date TIMESTAMP NOT NULL,
              end_date TIMESTAMP NOT NULL,
              category TEXT NOT NULL,
              difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
              max_participants INTEGER,
              status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
            )
          `);
          
          // Challenge participants table
          db.run(`
            CREATE TABLE IF NOT EXISTS challenge_participants (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              challenge_id INTEGER NOT NULL,
              user_id INTEGER NOT NULL,
              joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'dropped')),
              FOREIGN KEY (challenge_id) REFERENCES challenges (id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              UNIQUE(challenge_id, user_id)
            )
          `);
          
          // Donations table
          db.run(`
            CREATE TABLE IF NOT EXISTS donations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              donor_id INTEGER,
              recipient_id INTEGER NOT NULL,
              amount REAL NOT NULL,
              currency TEXT NOT NULL DEFAULT 'USD',
              message TEXT,
              status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'refunded', 'failed')),
              donation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (donor_id) REFERENCES users (id) ON DELETE SET NULL,
              FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
            )
          `);
          
          // Commit the transaction
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error creating database schema:', err.message);
              db.run('ROLLBACK');
              return reject(err);
            }
            
            console.log('Database schema initialized successfully');
            resolve();
          });
        });
      } else {
        // Schema already exists
        resolve();
      }
    });
  });
}

/**
 * Check for and apply database migrations
 * @returns {Promise} Promise resolving when migrations are complete
 */
function checkMigrations() {
  return new Promise((resolve, reject) => {
    // Get current schema version from database
    db.get('SELECT value FROM settings WHERE key = ?', ['schema_version'], (err, row) => {
      if (err) {
        console.error('Error checking schema version:', err.message);
        return reject(err);
      }
      
      if (!row) {
        console.error('Schema version not found in settings');
        return resolve(); // Skip migrations in this unlikely case
      }
      
      const currentVersion = parseInt(row.value, 10);
      
      // If database schema is outdated, run migrations
      if (currentVersion < SCHEMA_VERSION) {
        console.log(`Migrating database from version ${currentVersion} to ${SCHEMA_VERSION}`);
        
        // Apply migrations sequentially
        runMigrations(currentVersion, SCHEMA_VERSION)
          .then(() => {
            // Update schema version
            db.run('UPDATE settings SET value = ? WHERE key = ?', [SCHEMA_VERSION.toString(), 'schema_version'], (err) => {
              if (err) {
                console.error('Error updating schema version:', err.message);
                return reject(err);
              }
              
              console.log(`Database migrated to version ${SCHEMA_VERSION}`);
              resolve();
            });
          })
          .catch(reject);
      } else {
        // Schema is up to date
        console.log(`Database schema is up to date (version ${currentVersion})`);
        resolve();
      }
    });
  });
}

/**
 * Run database migrations from one version to another
 * @param {number} fromVersion - Current schema version
 * @param {number} toVersion - Target schema version
 * @returns {Promise} Promise resolving when migrations are complete
 */
function runMigrations(fromVersion, toVersion) {
  return new Promise((resolve, reject) => {
    // Currently no migrations defined since we're at version 1
    // This function will be expanded as schema versions increase
    resolve();
  });
}

/**
 * Run a database query
 * @param {string} sql - SQL query with placeholders
 * @param {Array} params - Parameters for the SQL query
 * @returns {Promise<Array>} Promise resolving to query results
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err.message);
        return reject(err);
      }
      
      resolve(rows);
    });
  });
}

/**
 * Run a SQL command that doesn't return data
 * @param {string} sql - SQL command with placeholders
 * @param {Array} params - Parameters for the SQL command
 * @returns {Promise<Object>} Promise resolving to result with lastID and changes
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Database run error:', err.message);
        return reject(err);
      }
      
      // Return the lastID and changes properties
      resolve({ 
        lastID: this.lastID, 
        changes: this.changes 
      });
    });
  });
}

/**
 * Get a single row from the database
 * @param {string} sql - SQL query with placeholders
 * @param {Array} params - Parameters for the SQL query
 * @returns {Promise<Object>} Promise resolving to a single row or null
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Database get error:', err.message);
        return reject(err);
      }
      
      resolve(row);
    });
  });
}

/**
 * Run multiple SQL statements in a transaction
 * @param {Function} operation - Function that performs database operations
 * @returns {Promise<any>} Promise resolving to the result of the operation
 */
async function transaction(operation) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      Promise.resolve()
        .then(() => operation(db))
        .then((result) => {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              db.run('ROLLBACK');
              return reject(err);
            }
            
            resolve(result);
          });
        })
        .catch((err) => {
          console.error('Error in transaction:', err.message);
          db.run('ROLLBACK', () => {
            reject(err);
          });
        });
    });
  });
}

// Database helper functions for common operations
const helpers = {
  // Find a record by ID
  findById: async (table, id) => {
    return await get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  },
  
  // Find a record by a specific field
  findBy: async (table, field, value) => {
    return await get(`SELECT * FROM ${table} WHERE ${field} = ?`, [value]);
  },
  
  // Get all records from a table
  findAll: async (table, conditions = {}, options = {}) => {
    const { limit, offset, orderBy } = options;
    
    // Build the WHERE clause
    const whereConditions = [];
    const params = [];
    
    for (const [key, value] of Object.entries(conditions)) {
      whereConditions.push(`${key} = ?`);
      params.push(value);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Build the ORDER BY clause
    const orderClause = orderBy 
      ? `ORDER BY ${orderBy}` 
      : '';
    
    // Build the LIMIT and OFFSET clauses
    const limitClause = limit 
      ? `LIMIT ${limit}` 
      : '';
    
    const offsetClause = offset 
      ? `OFFSET ${offset}` 
      : '';
    
    // Construct the final query
    const sql = `
      SELECT * FROM ${table}
      ${whereClause}
      ${orderClause}
      ${limitClause}
      ${offsetClause}
    `;
    
    return await query(sql, params);
  },
  
  // Insert a record
  create: async (table, data) => {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
    `;
    
    const result = await run(sql, values);
    
    if (result.lastID) {
      return await get(`SELECT * FROM ${table} WHERE id = ?`, [result.lastID]);
    }
    
    return null;
  },
  
  // Update a record
  update: async (table, id, data) => {
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = ?
    `;
    
    await run(sql, values);
    
    return await get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  },
  
  // Delete a record
  delete: async (table, id) => {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    await run(sql, [id]);
    return { id };
  },
  
  // Count records in a table
  count: async (table, conditions = {}) => {
    // Build the WHERE clause
    const whereConditions = [];
    const params = [];
    
    for (const [key, value] of Object.entries(conditions)) {
      whereConditions.push(`${key} = ?`);
      params.push(value);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const result = await get(`SELECT COUNT(*) as count FROM ${table} ${whereClause}`, params);
    return result.count;
  }
};

module.exports = {
  init,
  close,
  query,
  run,
  get,
  transaction,
  // Export helper functions
  ...helpers
};