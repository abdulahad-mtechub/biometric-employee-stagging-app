// import SQLite from 'react-native-sqlite-storage';

// const db = SQLite.openDatabase({name: 'app.db', location: 'default'});

// // Create the pending_actions table if it doesn't exist
// export const initSQLite = () => {
//   db.transaction(tx => {
//     tx.executeSql(
//       `CREATE TABLE IF NOT EXISTS pending_actions (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         type TEXT,
//         data TEXT,
//         timestamp INTEGER
//       )`,
//     );
//   });
// };

// // Save a pending POST action
// export const savePendingAction = (type, data) => {
//   return new Promise((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         'INSERT INTO pending_actions (type, data, timestamp) VALUES (?, ?, ?)',
//         [type, JSON.stringify(data), Date.now()],
//         (_, result) => resolve(result),
//         (_, error) => reject(error),
//       );
//     });
//   });
// };

// // Get all pending POST actions of a type
// export const getPendingActions = type => {
//   return new Promise((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         'SELECT * FROM pending_actions WHERE type = ?',
//         [type],
//         (_, {rows}) => resolve(rows.raw()),
//         (_, error) => reject(error),
//       );
//     });
//   });
// };

// // Remove a pending action by id
// export const removePendingAction = id => {
//   return new Promise((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         'DELETE FROM pending_actions WHERE id = ?',
//         [id],
//         (_, result) => resolve(result),
//         (_, error) => reject(error),
//       );
//     });
//   });
// };

import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({name: 'app.db', location: 'default'});

export const initSQLite = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS pending_actions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT,
          data TEXT,
          timestamp INTEGER
        )`,
        [],
        (_, result) => {
          console.log('✅ SQLite database initialized');
          resolve(result);
        },
        (_, error) => {
          console.error('❌ SQLite initialization error:', error);
          reject(error);
        },
      );
    });
  });
};

// Save pending action
export const savePendingAction = (type, data) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO pending_actions (type, data, timestamp) VALUES (?, ?, ?)',
        [type, JSON.stringify(data), Date.now()],
        (_, result) => resolve(result),
        (_, error) => reject(error),
      );
    });
  });
};

// Get pending actions
export const getPendingActions = type => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM pending_actions WHERE type = ?',
        [type],
        (_, {rows}) => resolve(rows.raw()),
        (_, error) => reject(error),
      );
    });
  });
};

// Remove pending action
export const removePendingAction = id => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM pending_actions WHERE id = ?',
        [id],
        (_, result) => resolve(result),
        (_, error) => reject(error),
      );
    });
  });
};

export const getAllPendingActions = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM pending_actions',
        [],
        (_, {rows}) => resolve(rows.raw()),
        (_, error) => reject(error),
      );
    });
  });
};
