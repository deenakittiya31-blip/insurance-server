const connection = require('../config/database')
const { OAuth2Client } = require('google-auth-library')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

exports.register = async(req, res)=>{
    try {
        const {name, email, phone, password} = req.body

        if(!name || !email || !phone || !password){
            return res.status(400).json({msg: 'กรุณากรอกข้อมูลให้ครบ'})
        }
        
        const queryEmail = 'SELECT email FROM users WHERE email = ?';

        const [rows] = await connection.query(queryEmail, [email])

        if(rows.length > 0) {
            return res.status(409).json({ message: 'มีบัญชีผู้ใช้อยู่แล้ว' })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const query = 'INSERT INTO users(name, email, phone, password) VALUES(?, ?, ?, ?)';

        await connection.query(query, [name, email, phone, hashPassword])
        res.json({ msg: 'ลงทะเบียนสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    } 
}

exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;

        if(email.trim() == '' || password.trim() == ''){
            return res.status(400).json({msg: 'อีเมลล์หรือรหัสผ่านไม่ถูกต้อง'})
        }

        const query = 'SELECT * FROM users WHERE email = ?';

        const [rows] = await connection.query(query, [email])

        if(rows.length === 0) {
            return res.status(400).json({ message: 'ไม่พบอีเมลผู้ใช้' })
        }

        const user = rows[0]

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({message: 'รหัสผ่านไม่ถูกต้อง'})
        }

        const payload ={
            id: user.user_id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role
        }

        jwt.sign(payload, process.env.SECRET, {expiresIn: '1d'}, (err, token) => {
            if(err){
                return res.status(500).json({message: 'server errer jwt'})
            }
            res.json({payload, token})
        })

    } catch (err) {
        console.log(err.message)
        res.status(500).json({ msg: 'server error'})
    }
}

exports.loginLine = async(req, res) => {
    try {
        const { displayName, email, pictureUrl } = req.body

        let rows;
        if(email){
            [rows] = connection.query('SELECT * FROM users WHERE email = ?', [email]);
        }else {
            [rows] = await connection.query('SELECT * FROM users WHERE name = ?',[displayName]);
        }
        

        let user;

        if (rows.length === 0) {
            const [result] = await connection.query(`INSERT INTO users (name, email, image, role) VALUES (?, ?, ?, ?)`,
                [
                    displayName,
                    email || null,
                    pictureUrl || null,
                    'user'
                ]);

            // 3. ดึง user ที่เพิ่งสร้าง
            const [newUser] = await connection.query('SELECT * FROM users WHERE user_id = ?',[result.insertId]);

            user = newUser[0];
        } else {
            user = rows[0];
        }

        const payload ={
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image
        }

        jwt.sign(payload, process.env.SECRET, {expiresIn: '1d'}, (err, token) => {
            if(err){
                return res.status(500).json({message: 'server errer jwt'})
            }
            res.json({payload, token})
        })


    } catch (err) {
        console.log(err.message)
        res.status(500).json({message: 'server error'})
    }
}

exports.loginGoogle = async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: 'Missing credential' })
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payloadGoogle = ticket.getPayload()

    const {
        email,
        name,
        picture,
    } = payloadGoogle

    // 2. เช็ก user ใน DB
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email])

    let user

    if (rows.length === 0) {
      // 3. ถ้าไม่มี → สร้าง user ใหม่
      const [result] = await connection.query(`INSERT INTO users (name, email, image) VALUES (?, ?, ?, ?)`, [name, email, picture, 'user'])

      user = {
            user_id: result.insertId,
            name,
            email,
            image,
            role: 'user',
      }
    } else {
      user = rows[0]
    }

    const payload = {
            id: user.user_id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
    }

    jwt.sign(payload, process.env.SECRET, {expiresIn: '1d'}, (err, token) => {
            if(err){
                return res.status(500).json({message: 'server errer jwt'})
            }
            return res.status(200).json({payload, token})
        })

  } catch (err) {
    console.error(err)
    res.status(401).json({ message: 'Google token ไม่ถูกต้อง' })
  }
}