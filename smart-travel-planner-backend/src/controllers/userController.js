import pool from '../config/database.js'; 
export async function userLogin(req, res) {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Require both name and email to login',
        required: ['name', 'email'],
      });
    }

    console.log(`Login attempt for email: ${email}`);

    
    const [existingRows] = await pool.query(
      'SELECT user_id, full_name, email FROM UserAccount WHERE email = ?',
      [email]
    );

    let user;

    if (existingRows.length > 0) {
      // user already exists
      user = existingRows[0];
      console.log(
        `Existing user found: id=${user.user_id}, name=${user.full_name}`
      );
    } else {
      
      console.log('Creating new account');
      const [insertResult] = await pool.query(
        'INSERT INTO UserAccount (full_name, email) VALUES (?, ?)',
        [name, email] 
      );

      const newUserId = insertResult.insertId;
      console.log(`New user created with id=${newUserId}`);

      const [newRows] = await pool.query(
        'SELECT user_id, full_name, email FROM UserAccount WHERE user_id = ?',
        [newUserId]
      );

      user = newRows[0];
    }

    
    const responseBody = {
      userId: user.user_id,
      name: user.full_name,   
      email: user.email,
    };

    console.log(`Successful login for userId=${user.user_id}\n`);

    return res.json(responseBody);
  } catch (err) {
    console.error('Error in userLogin:', err);
    return res.status(500).json({
      error: 'Internal server error during login.',
      message: err.message,
    });
  }
}
