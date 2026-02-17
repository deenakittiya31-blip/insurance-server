const db = require('../config/database')
const { OAuth2Client } = require('google-auth-library')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const axios = require('axios')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

//ตั้งค่าเปิดปิด
exports.statusLoginWith = async(req, res) => {
    const {status} = req.body;
    const { id } = req.params;

    try {
        await db.query('UPDATE login SET status = $1 WHERE id = $2', [status, id]) 
        
        res.json({msg: 'เปลี่ยนแปลงการตั้งค่าเกี่ยวกับการล็อกอินสำเร็จ'}) 
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: 'Server error'})
    }
}

exports.getLoginWithSetting = async(req, res) => {
    try {
        const result = await db.query('select id, login_with, status from login order by id asc') 
        
        res.json({data: result.rows}) 
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: 'Server error'})
    }
}

exports.register = async(req, res)=>{
    try {
        const {name, email, first_name, last_name,  phone, password, role} = req.body

        if(!name || !email || !phone || !password || !first_name || !last_name || !role){
            return res.status(400).json({message: 'กรุณากรอกข้อมูลให้ครบ'})
        }

        const emailCheck = await db.query('SELECT email FROM users WHERE email = $1', [email])

        if(emailCheck.rows.length > 0) {
            return res.status(409).json({ message: 'มีบัญชีผู้ใช้อยู่แล้ว' })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        await db.query('INSERT INTO users(name, email, phone, password, first_name, last_name, role) VALUES($1, $2, $3, $4, $5, $6, $7)', [name, email, phone, hashPassword, first_name, last_name, role])
        res.json({ msg: 'ลงทะเบียนสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    } 
}

exports.currentUser = async(req, res) => {
    try {
        const result = await db.query('SELECT user_id, name, email, logo_url, role FROM users WHERE user_id = $1', [req.user.id])

        res.json({ user: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'server error'})
    }
}

exports.currentMember = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
          m.id,
          m.user_id,
          m.first_name,
          m.picture_url,
          m.group_name
       FROM member m
       JOIN group_member gm ON m.group_id = gm.id
       WHERE id = $1`,
      [req.user.id]
    )

    res.json({ member: result.rows[0] })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
}

exports.lineLogin = async (req, res) => {
  const { idToken } = req.body;

  console.log(idToken)
  try {

      const params = new URLSearchParams({
      id_token: idToken,
      client_id: process.env.LINE_CHANNEL_ID,
    });

    console.log("Sending to LINE:", params.toString()); 

   const response = await axios.post(
      "https://api.line.me/oauth2/v2.1/verify",
      params,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log("LINE response:", response.data); // ✅ ดู response
    const lineUserId = response.data.sub;

    // ตรวจใน database
    const member = await db.query(
      `
        select * from member where user_id = $1
      `,
      [lineUserId]
    );

    console.log("member rows:", member.rows);

    if (!member.rows[0]) {
      return res.status(401).json({ message: "not registered" });
    }

    // สร้าง jwt ของระบบคุณเอง
    jwt.sign({ id: member.rows[0].id }, process.env.SECRET, {expiresIn: '7d'}, (err, token) => {
            if(err){
                return res.status(500).json({message: 'server errer jwt'})
            }
            res.json({token})
        })

  } catch (err) {
    console.log("LINE error status:", err.response?.status);
    console.log("LINE error data:", err.response?.data); // ✅ ดู error จาก LINE
    res.status(400).json({ message: "invalid line token" });
  }
};

exports.login = async(req, res) => {
    try {
        const { email, password, captcha } = req.body;

        if (!captcha) {
            return res.status(400).json({ message: 'Captcha missing' })
        }

         // verify กับ Google
        const verifyRes = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captcha,
                },
            }
        )

        if (!verifyRes.data.success) {
            return res.status(400).json({ message: 'Captcha verification failed' })
        }

        if(email.trim() == '' || password.trim() == ''){
            return res.status(400).json({msg: 'อีเมลล์หรือรหัสผ่านไม่ถูกต้อง'})
        }

        const result  = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if(result.rows.length === 0) {
            return res.status(400).json({ message: 'ไม่พบอีเมลผู้ใช้' })
        }

        const user = result.rows[0]

        if (!user.password) {
            console.log('PASSWORD IS EMPTY:', user)
            return res.status(400).json({
                message: 'บัญชีนี้ไม่มีรหัสผ่าน'
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({message: 'รหัสผ่านไม่ถูกต้อง'})
        }

        const payload ={
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        }

        jwt.sign(payload, process.env.SECRET, {expiresIn: '1d'}, (err, token) => {
            if(err){
                return res.status(500).json({message: 'server errer jwt'})
            }
            res.json({token})
        })

    } catch (err) {
        console.log(err.message)
        res.status(500).json({ msg: 'server error'})
    }
}