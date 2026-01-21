const axios = require('axios');
const db = require('../config/database')

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
};

exports.lineBotReply = async(req, res) => {
    res.sendStatus(200)
    console.log('is work start')
    const event = req.body.events?.[0]
    if(!event) return

    try {
       if(event.type === 'follow') {
            const userId = event.source.userId
            const replyToken = event.replyToken

            //ยังไม่ลงทะเบียน
            await db.query(`
                    INSERT INTO member (user_id, is_friend, is_registered)
                    VALUES ($1, true, false)
                    ON CONFLICT (user_id) DO UPDATE
                    SET is_friend = true
                    `, [userId])

            await reply(replyToken, {
                    type: 'text',
                    text: `สวัสดีค่ะ ☺️ หากต้องการลงทะเบียนเป็นสมาชิกพิมพ์คำว่า 'สมัคร' หรือ 'ลงทะเบียน' ได้เลยค่ะ`
                })
            return
       }

        //ผู้ใช้ส่ง text มา
        if (event.type === 'message' && event.message.type === 'text') {
            const text = event.message.text.trim()
            const replyToken = event.replyToken
            const userId = event.source.userId

            if (/สมัคร|ลงทะเบียน/.test(text)) {

                const result = await db.query(`select is_registered from member where user_id = $1`, [userId])

                //ไม่พบ user
                if(result.rowCount === 0) {
                    console.log('ทำงาน ก่อนทำบันทึกลงฐาน')
                    await db.query(`
                        INSERT INTO member (user_id, is_friend, is_registered)
                        VALUES ($1, true, false)
                    `, [userId])

                    await sendRegisterButton(replyToken)
                    return
                }

                 //ถ้าลงทะเบียนแล้ว
                if (result.rows[0].is_registered) {
                    await reply(replyToken, {
                        type: 'text',
                        text: 'คุณเป็นสมาชิกอยู่แล้วค่ะ 😊'
                    })
                    return
                }  
                
                //ยังไม่ลงทะเบียนให้ส่ง LIFF ไปให้
                await sendRegisterButton(replyToken)
                return
            }

            if (text.includes('สวัสดี')) {
                console.log('before reply')
                await reply(replyToken, {
                    type: 'text',
                    text: 'ทดสอบค่ะ'
                })
                console.log('after reply')
            return
            }
        }

    } catch (err) {
        console.error(err.response?.data || err.message)
    }
}

const reply = async(replyToken, msgObj) => {
  const res = await axios.post(LINE_MESSAGING_API, 
        { 
            replyToken: replyToken, 
            messages: [msgObj] 
        }, 
        { 
            headers: LINE_HEADER 
        }
    )
    console.log('LINE reply success')
    return res
};

const sendRegisterButton = async (replyToken) => {
    const message = {
        type: 'text',
        text: 'กรุณากดปุ่มด้านล่างเพื่อลงทะเบียนเป็นสมาชิกค่ะ 😊',
        quickReply: {
            items: [
                {
                    type: 'action',
                    action: {
                        type: 'uri',
                        label: 'ลงทะเบียนสมาชิก',
                        uri: 'https://liff.line.me/2008929214-oMQadweJ'
                    }
                }
            ]
        }
    }

    await reply(replyToken, message)
}

