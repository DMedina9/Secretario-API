import { openDatabaseSync } from 'expo-sqlite';

class WebSQLTransaction {
  constructor(db) {
    this.db = db;
  }

  executeSql(sql, args, successCallback, errorCallback) {
    try {
      const isSelect = sql.trim().toUpperCase().startsWith("SELECT") || sql.trim().toUpperCase().startsWith("PRAGMA");
      let results;
      
      if (isSelect) {
        const rows = this.db.getAllSync(sql, args || []);
        results = {
          rows: {
            item: (i) => rows[i],
            length: rows.length,
            _array: rows
          },
          rowsAffected: 0
        };
      } else {
        const res = this.db.runSync(sql, args || []);
        results = {
          rows: {
            item: () => null,
            length: 0,
            _array: []
          },
          rowsAffected: res.changes,
          insertId: res.lastInsertRowId
        };
      }

      if (successCallback) {
        successCallback(this, results);
      }
    } catch (error) {
      if (errorCallback) {
        errorCallback(this, error);
      } else {
        console.error("Uncaught SQLite Error:", error);
      }
    }
  }
}

class WebSQLDatabase {
  constructor(name) {
    this.db = openDatabaseSync(name);
  }

  transaction(callback) {
    this.db.withTransactionSync(() => {
      const tx = new WebSQLTransaction(this.db);
      callback(tx);
    });
  }

  exec(queries, readOnly, callback) {
    try {
      const results = queries.map(q => {
        const isSelect = q.sql.trim().toUpperCase().startsWith("SELECT") || q.sql.trim().toUpperCase().startsWith("PRAGMA");
        if (isSelect) {
          const rows = this.db.getAllSync(q.sql, q.args || []);
          return { rows };
        } else {
          const res = this.db.runSync(q.sql, q.args || []);
          return { rowsAffected: res.changes, insertId: res.lastInsertRowId, rows: [] };
        }
      });
      if (callback) callback(null, results);
    } catch (err) {
      if (callback) callback(err, null);
    }
  }

  close(callback) {
    try {
      this.db.closeSync();
      if (callback) callback();
    } catch(e) {
      if (callback) callback(e);
    }
  }
}

export function openDatabase(name, version, description, size) {
  return new WebSQLDatabase(name);
}
