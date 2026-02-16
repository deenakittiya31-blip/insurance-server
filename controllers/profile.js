const db = require('../config/database');
const cloudinary = require('../config/cloudinary')

exports.readProfileUser = async(req, res) => {
    try {
        const user_id = req.user.id
        const role = req.user.role

        if(role === 'admin' || role === 'staff'){
            const profileResult = await db.query(`select name, email, phone, role, logo_url, logo_public_id, first_name, last_name from users where user_id = $1`, [user_id])

            return res.json({data: profileResult.rows[0]})
        } else {
            //member
            const profileResult = await db.query(
                `
                select
                    m.display_name,
                    m.first_name,
                    m.last_name,
                    m.phone,
                    m.picture_url,
                    gm.group_name
                from
                    member as m
                join group_member as gm on m.group_id = gm.id
                where
                    m.id = $1
                `, [user_id])

            return res.json({data: profileResult.rows[0]})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.updateProfileUser = async(req, res) => {
    const client = await db.connect();

    try {
    const user_id = req.user.id;
    const role = req.user.role;
    const data = req.body;

    await client.query('BEGIN');

    if (['admin', 'staff'].includes(role)) {

     const allowedFields = [
        'name',
        'email',
        'phone',
        'logo_url',
        'logo_public_id',
        'first_name',
        'last_name'
      ];

      const fields = [];
      const values = [];
      let index = 1;

      for (const key of allowedFields) {
        if (data[key] !== undefined) {
          fields.push(`${key} = $${index}`);
          values.push(data[key]);
          index++;
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      //ถ้ามีการเปลี่ยนรูป → ลบรูปเก่า
      if (data.logo_public_id) {
        const oldImage = await client.query(
          `SELECT logo_public_id FROM users WHERE user_id = $1`,
          [user_id]
        );

        const oldPublicId = oldImage.rows[0]?.logo_public_id;

        if (oldPublicId && oldPublicId !== data.logo_public_id) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      values.push(user_id);

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE user_id = $${index}
        RETURNING name, email, phone, role, logo_url, logo_public_id
      `;

      const result = await client.query(query, values);

      await client.query('COMMIT');

      return res.json({
        message: 'อัปเดตโปรไฟล์สำเร็จ',
        data: result.rows[0]
      });

    } else {

      const allowedFields = [
        'display_name',
        'first_name',
        'last_name',
        'phone',
        'picture_url'
      ];

      const fields = [];
      const values = [];
      let index = 1;

      for (const key of allowedFields) {
        if (data[key] !== undefined) {
          fields.push(`${key} = $${index}`);
          values.push(data[key]);
          index++;
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      values.push(user_id);

      const query = `
        UPDATE member
        SET ${fields.join(', ')}
        WHERE user_id = $${index}
        RETURNING display_name, first_name, last_name, phone, picture_url
      `;

      const result = await client.query(query, values);

      await client.query('COMMIT');

      return res.json({
        message: 'อัปเดตโปรไฟล์สำเร็จ',
        data: result.rows[0]
      });
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
}