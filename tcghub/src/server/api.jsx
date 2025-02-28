// src/server/api.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
// CHANGE HERE
const dbPath = '/Users/ggfincke/Documents/PSU/CMPSC431W/FinalProject/tcghub/src/data/data.sqlite';

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    }
});

app.use(cors());
app.use(express.json());

app.post('/api/auth/register', async (req, res) => {
  const { username, password, bio, birthday } = req.body;

  // input validation
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    // check if username already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT uid FROM User WHERE uname = ?', [username], (err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });

    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // gen new user ID
    const uid = Date.now();

    // insert new user with hashed password
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO User (uid, uname, password, bio, birthday) 
         VALUES (?, ?, ?, ?, ?)`,
        [uid, username, hashedPassword, bio || null, birthday || null],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });

    // gen token and send response
    const token = `${uid}_${Date.now()}`;
    const userData = {
      uid,
      username,
      bio: bio || '',
      birthday: birthday || '',
    };

    res.status(201).json({
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// modify the login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    // get user and password from database
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT uid, uname, password, bio, birthday 
         FROM User 
         WHERE uname = ?`,
        [username],
        (err, user) => {
          if (err) reject(err);
          resolve(user);
        }
      );
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // gen token and send response
    const token = user.uid + '_' + Date.now();
    
    res.json({
      token,
      user: {
        uid: user.uid,
        username: user.uname,
        bio: user.bio || '',
        birthday: user.birthday || ''
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// get user data
app.get('/api/users/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
  
    const uid = token.split('_')[0];
  
    db.get(
      'SELECT uid, uname, bio, birthday FROM User WHERE uid = ?',
      [uid],
      (err, user) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
  
        if (!user) {
          res.status(401).json({ error: 'User not found' });
          return;
        }
  
        res.json({
          uid: user.uid,
          username: user.uname,
          bio: user.bio || '',        
          birthday: user.birthday || '' 
        });
      }
    );
  });

  app.put('/api/users/bio', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { bio } = req.body;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];

  db.run(
    'UPDATE User SET bio = ? WHERE uid = ?',
    [bio, uid],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      db.get(
        'SELECT uid, uname, bio, birthday FROM User WHERE uid = ?',
        [uid],
        (err, user) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({
            uid: user.uid,
            username: user.uname,
            bio: user.bio || '',
            birthday: user.birthday || ''
          });
        }
      );
    }
  );
});

// MARK: Collection Management Routes
// searching
app.get('/api/cards/search', (req, res) => {
  const { 
    query,     
    rarity,    
    expansion,     
    sortBy,   
    sortOrder 
  } = req.query;

  let sql = `
    SELECT 
      c.cname,
      c.cid,
      c.expansion,
      c.rarity,
      c.current_value
    FROM Card c
    WHERE 1=1
  `;
  
  const params = [];

  // search condition if query exists
  if (query) {
    sql += ` AND (c.cname LIKE ? OR c.expansion LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`);
  }

  // rarity filter if specified
  if (rarity && rarity !== 'all') {
    sql += ` AND c.rarity = ?`;
    params.push(rarity);
  }

  // set filter if specified
  if (expansion && expansion !== 'all') {
    sql += ` AND c.expansion = ?`;
    params.push(expansion);
  }

  // sorting
  if (sortBy) {
    sql += ` ORDER BY ${
      sortBy === 'name' ? 'c.cname' :
      sortBy === 'price' ? 'c.current_value' :
      sortBy === 'expansion' ? 'c.expansion' :
      sortBy === 'rarity' ? 'c.rarity' :
      'c.cname'
    } ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// get user's collections
app.get('/api/users/collection', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];

  db.all(
    `SELECT c.colid, c.colname, c.collection_type
     FROM Collection c
     JOIN Belongs_To bt ON c.colid = bt.colid
     WHERE bt.uid = ?
     ORDER BY 
       CASE WHEN c.collection_type = 'Wishlist' THEN 0 ELSE 1 END,
       c.colname`,
    [uid],
    (err, collections) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(collections);
    }
  );
});

// Add this new endpoint in api.jsx
// Get all cards in a collection
app.get('/api/collection/:colid/cards', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { colid } = req.params;

  // verify user owns this collection
  db.get(
    'SELECT 1 FROM Belongs_To WHERE uid = ? AND colid = ?',
    [uid, colid],
    (err, result) => {
      if (err || !result) {
        res.status(403).json({ error: 'Not authorized to view this collection' });
        return;
      }

      db.all(
        `SELECT 
          c.cid,
          c.cname,
          c.rarity,
          c.expansion,
          c.current_value,
          cc.quantity
         FROM Card_Collection cc
         JOIN Card c ON cc.cid = c.cid
         WHERE cc.colid = ?`,
        [colid],
        (err, cards) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json(cards || []);
        }
      );
    }
  );
});

// create new collection for user
app.post('/api/collection', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { colname, collection_type } = req.body;

  if (!colname || !collection_type) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // unique ID
  const colid = Date.now(); 

  db.run(
    'INSERT INTO Collection (colname, collection_type, colid) VALUES (?, ?, ?)',
    [colname, collection_type, colid],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get('SELECT uname FROM User WHERE uid = ?', [uid], (err, user) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        db.run(
          'INSERT INTO Belongs_To (uname, uid, colid) VALUES (?, ?, ?)',
          [user.uname, uid, colid],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            res.status(201).json({
              colid,
              colname,
              collection_type
            });
          }
        );
      });
    }
  );
});



// update collection name
app.put('/api/collection/:colid', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { colid } = req.params;
  const { colname } = req.body;

  // Check if wishlist
  db.get(
    'SELECT collection_type FROM Collection WHERE colid = ?',
    [colid],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (result?.collection_type === 'Wishlist') {
        res.status(403).json({ error: 'Cannot rename wishlist collection' });
        return;
      }

      // ownership
      db.get(
        'SELECT 1 FROM Belongs_To WHERE uid = ? AND colid = ?',
        [uid, colid],
        (err, result) => {
          if (err || !result) {
            res.status(403).json({ error: 'Not authorized to modify this collection' });
            return;
          }

          // collection
          db.run(
            'UPDATE Collection SET colname = ? WHERE colid = ?',
            [colname, colid],
            (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({ message: 'Collection updated successfully' });
            }
          );
        }
      );
    }
  );
});

// del collection
app.delete('/api/collection/:colid', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { colid } = req.params;

  // Check if wishlist
  db.get(
    'SELECT collection_type FROM Collection WHERE colid = ?',
    [colid],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (result?.collection_type === 'Wishlist') {
        res.status(403).json({ error: 'Cannot delete wishlist collection' });
        return;
      }

      // Verify ownership
      db.get(
        'SELECT 1 FROM Belongs_To WHERE uid = ? AND colid = ?',
        [uid, colid],
        (err, result) => {
          if (err || !result) {
            res.status(403).json({ error: 'Not authorized to modify this collection' });
            return;
          }

          // Delete collection
          db.run('DELETE FROM Belongs_To WHERE colid = ?', [colid], (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            db.run('DELETE FROM Collection WHERE colid = ?', [colid], (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({ message: 'Collection deleted successfully' });
            });
          });
        }
      );
    }
  );
});

// MARK: Card Collection Routes
// add card
app.post('/api/collection/:colid/cards', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { cname, cid, quantity } = req.body;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { colid } = req.params;

  // user check
  db.get(
      'SELECT 1 FROM Belongs_To WHERE uid = ? AND colid = ?',
      [uid, colid],
      (err, result) => {
        if (err || !result) {
          res.status(403).json({ error: 'Not authorized to modify this collection' });
          return;
        }

        // add card to the collection
        db.run(
          'INSERT INTO Card_Collection (colid, cname, cid, quantity) VALUES (?, ?, ?, ?)',
          [colid, cname, cid, 1],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.status(201).json({ message: 'Card added successfully' });
          }
        );
      }
    );
  });

// delete card from collection
app.delete('/api/collection/:colid/cards/:cid', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { colid, cid } = req.params;

  // user check
  db.get(
      'SELECT 1 FROM Belongs_To WHERE uid = ? AND colid = ?',
      [uid, colid],
      (err, result) => {
        if (err || !result) {
          res.status(403).json({ error: 'Not authorized to modify this collection' });
          return;
        }

        // del card from the collection
        db.run(
          'DELETE FROM Card_Collection WHERE colid = ? AND cid = ?',
          [colid, cid],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'Card deleted successfully' });
          }
        );
      }
    );
  });

// update card quantity
app.put('/api/collection/:colid/cards/:cid', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { quantity } = req.body;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { colid, cid } = req.params;

  // user check
  db.get(
    'SELECT 1 FROM Belongs_To WHERE uid = ? AND colid = ?',
    [uid, colid],
    (err, result) => {
      if (err || !result) {
        res.status(403).json({ error: 'Not authorized to modify this collection' });
        return;
      }

      // update card quantity in the collection
      db.run(
        'UPDATE Card_Collection SET quantity = ? WHERE colid = ? AND cid = ?',
        [quantity, colid, cid],
        (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ message: 'Card quantity updated successfully' });
        }
      );
    }
  );
});

// MARK: Shopping Platform Routes
// get all shops and their inventory
app.get('/api/shops/cards', (req, res) => {
  console.log('Fetching all shop inventory');
  
  db.all(`
    SELECT 
      s.sname as shop_name, 
      s.sid, 
      o.colid, 
      cc.cname, 
      cc.cid, 
      cc.quantity as card_quantity,
      cd.current_value,
      cd.rarity,
      cd.expansion,
      CASE 
        WHEN cc.quantity > 10 THEN 'In Stock'
        WHEN cc.quantity > 0 THEN 'Low Stock'
        ELSE 'Out of Stock'
      END as stock_status
    FROM Shop s
    JOIN Owns o ON s.sname = o.sname AND s.sid = o.sid
    JOIN Card_Collection cc ON o.colid = cc.colid
    JOIN Card cd ON cc.cname = cd.cname AND cc.cid = cd.cid
    WHERE cc.quantity > 0`,
    (err, rows) => {
      if (err) {
        console.error('Error fetching shop inventory:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// get specific shop's inventory
app.get('/api/shops/:shopId/inventory', (req, res) => {
  const { shopId } = req.params;
  
  db.all(`
    SELECT 
      cc.cname, 
      cc.cid, 
      cc.quantity as card_quantity, 
      cd.current_value, 
      cd.expansion, 
      cd.rarity,
      CASE 
        WHEN cc.quantity > 10 THEN 'In Stock'
        WHEN cc.quantity > 0 THEN 'Low Stock'
        ELSE 'Out of Stock'
      END as stock_status
    FROM Card_Collection cc
    JOIN Card cd ON cc.cname = cd.cname AND cc.cid = cd.cid
    JOIN Owns o ON cc.colid = o.colid
    WHERE o.sid = ? AND cc.quantity > 0`,
    [shopId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching shop inventory:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// get delivery status
app.get('/api/delivery/:did', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const uid = token.split('_')[0];
  const { did } = req.params;

  db.all(`
    SELECT d.*,
           json_group_array(json_object(
             'cname', t.cname,
             'quantity', t.quantity,
             'shop_name', t.sname
           )) as items
    FROM Delivery d
    LEFT JOIN Transactions t ON d.did = t.did
    WHERE d.did = ? AND (d.start_id = ? OR d.end_id = ?)
    GROUP BY d.did`,
    [did, uid, uid],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (rows.length === 0) {
        res.status(404).json({ error: 'Delivery not found' });
        return;
      }

      rows[0].items = JSON.parse(rows[0].items);
      res.json(rows[0]);
    }
  );
});

// MARK: Transaction Routes
app.post('/api/transactions', (req, res) => {
  const {
    uname, uid, user_colid, cname, cid,
    sname, sid, shop_colid, pname, pid, did
  } = req.body;

  db.run(
    `INSERT INTO Transactions (
      uname, uid, user_colid, cname, cid,
      sname, sid, shop_colid, pname, pid, did
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uname, uid, user_colid, cname, cid,
      sname, sid, shop_colid, pname, pid, did
    ],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ message: 'Transaction created successfully' });
    }
  );
});

app.put('/api/transactions/:did/status', (req, res) => {
  const { did } = req.params;
  const { status } = req.body;
  db.run(
    'UPDATE Transactions SET status = ? WHERE did = ?',
    [status, did],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Transaction status updated successfully' });
    }
  );
});

// process checkout from shopping cart
app.post('/api/transactions/checkout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const uid = token.split('_')[0];
  const { transactions } = req.body;

  if (!transactions?.length) {
    return res.status(400).json({ error: 'No transactions provided' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    try {
      // new delivery
      const did = Date.now();
      const shipping_date = new Date().toISOString().split('T')[0];
      const arrival_date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      db.run(
        'INSERT INTO Delivery (did, start_id, end_id, shipping_date, arrival_date) VALUES (?, ?, ?, ?, ?)',
        [did, uid, uid, shipping_date, arrival_date],
        function (err) {
          if (err) throw err;

          const processTransaction = (transaction) => {
            return new Promise((resolve, reject) => {
              db.get(
                `SELECT quantity FROM Card_Collection 
                 WHERE colid = (SELECT colid FROM Owns WHERE sid = ? LIMIT 1) 
                 AND cid = ?`,
                [transaction.sid, transaction.cid],
                (err, row) => {
                  if (err) return reject(err);
                  if (!row || row.uantity < transaction.quantity) {
                    return reject(new Error(`Insufficient stock for card ${transaction.cid}`));
                  }

                  // a transaction record for each card purchased
                  const inserts = [];
                  for (let i = 0; i < transaction.quantity; i++) {
                    const transid = Date.now() + Math.floor(Math.random() * 10000);
                    inserts.push(
                      new Promise((resInsert, rejInsert) => {
                        db.run(
                          `INSERT INTO Transactions (
                            transid, uname, uid, user_colid, cname, cid,
                            sname, sid, shop_colid, did
                          ) VALUES (
                            ?, (SELECT uname FROM User WHERE uid = ?),
                            ?, ?, ?, ?,
                            ?, ?, (SELECT colid FROM Owns WHERE sid = ? LIMIT 1),
                            ?
                          )`,
                          [
                            transid,
                            uid,
                            uid,
                            null,
                            transaction.cname,
                            transaction.cid,
                            transaction.shop_name,
                            transaction.sid,
                            transaction.sid,
                            did
                          ],
                          (err) => {
                            if (err) return rejInsert(err);
                            resInsert();
                          }
                        );
                      })
                    );
                  }

                  Promise.all(inserts)
                    .then(() => {
                      db.run(
                        `UPDATE Card_Collection 
                         SET quantity = quantity - ? 
                         WHERE colid = (
                           SELECT colid FROM Owns WHERE sid = ? LIMIT 1
                         ) AND cid = ?`,
                        [transaction.quantity, transaction.sid, transaction.cid],
                        (err) => {
                          if (err) return reject(err);
                          resolve();
                        }
                      );
                    })
                    .catch(reject);
                }
              );
            });
          };

          Promise.all(transactions.map(processTransaction))
            .then(() => {
              db.run('COMMIT');
              res.json({
                success: true,
                did,
                arrival_date
              });
            })
            .catch(err => {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
            });
        }
      );
    } catch (err) {
      db.run('ROLLBACK');
      res.status(500).json({ error: err.message });
    }
  });
});



// MARK: Event Routes
app.get('/api/events', (req, res) => {
  db.all(
    `SELECT * FROM Event 
     WHERE date >= date('now')
     ORDER BY date`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.get('/api/events/:eid/users', (req, res) => {
  const { eid } = req.params;
  db.all(
    'SELECT u.uname FROM User u WHERE u.eid = ?',
    [eid],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// MARK: Price Tracking / Filtering Routes
app.post('/api/cards/prices', (req, res) => {
  const { cid, value, date } = req.body;
  db.run(
    'INSERT INTO Card_Value (cid, value, date) VALUES (?, ?, ?)',
    [cid, value, date],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ message: 'Price record added successfully' });
    }
  );
});

// get price history 
app.get('/api/cards/:cid/prices/history', (req, res) => {
  const { cid } = req.params;
  db.all(
    'SELECT date, value FROM Card_Value WHERE cid = ? ORDER BY date ASC',
    [cid],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// get current price
app.get('/api/cards/:cid/prices/current', (req, res) => {
  const { cid } = req.params;
  db.get(
    'SELECT value FROM Card_Value WHERE cid = ? ORDER BY date DESC LIMIT 1',
    [cid],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    }
  );
});

// all available rarities
app.get('/api/cards/rarities', (req, res) => {
  db.all(
    'SELECT DISTINCT rarity FROM Card ORDER BY rarity',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows.map(row => row.rarity));
    }
  );
});

// all available sets
app.get('/api/cards/expansion', (req, res) => {
  db.all(
    'SELECT DISTINCT expansion FROM Card ORDER BY expansion',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows.map(row => row.expansion));
    }
  );
});

// get user's order history
app.get('/api/users/:uid/orders', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const requestUid = token.split('_')[0];
  const { uid } = req.params;

  if (requestUid !== uid) {
    return res.status(403).json({ error: 'Unauthorized to view these orders' });
  }

  const query = `
    SELECT 
      t.did,
      t.sname as shop_name,
      t.cname,
      c.current_value as price,
      d.shipping_date,
      d.arrival_date,
      CASE 
        WHEN date('now') > date(d.arrival_date) THEN 'Delivered'
        WHEN date('now') > date(d.shipping_date) THEN 'In Transit'
        ELSE 'Processing'
      END as status
    FROM Transactions t
    JOIN Delivery d ON t.did = d.did
    JOIN Card c ON t.cname = c.cname AND t.cid = c.cid
    WHERE t.uid = ?
    ORDER BY date(d.shipping_date) DESC
  `;

  db.all(query, [uid], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch order history' });
    }

    // Group by did
    const orders = rows.reduce((acc, row) => {
      if (!acc[row.did]) {
        acc[row.did] = {
          did: row.did,
          shipping_date: row.shipping_date,
          arrival_date: row.arrival_date,
          status: row.status,
          items: []
        };
      }

      acc[row.did].items.push({
        name: row.cname,       
        shop_name: row.shop_name,
        price: row.price
      });

      return acc;
    }, {});

    const orderArray = Object.values(orders).map(order => ({
      ...order,
      total: order.items.reduce((sum, item) => sum + item.price, 0)
    }));

    res.json(orderArray);
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});