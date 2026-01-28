const axios = require('axios');
const db = require('../config/database');
const { getProfile } = require('../services/lineService');

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
};

exports.lineBotReply = async(req, res) => {
    const event = req.body.events?.[0]
    if (!event) {
      return res.sendStatus(200)
    }

    try {
       if(event.type === 'follow') {
            const userId = event.source.userId
            const replyToken = event.replyToken

            const profile = await getProfile(userId)

            await db.query(`
                    INSERT INTO member (
                        user_id, 
                        display_name,
                        picture_url,
                        is_friend, 
                        is_registered
                    )
                    VALUES ($1, $2, $3, true, false)
                    ON CONFLICT (user_id) DO UPDATE
                    SET 
                        is_friend = true,
                        display_name = EXCLUDED.display_name,
                        picture_url = EXCLUDED.picture_url
                    `, [
                        userId, 
                        profile.displayName, 
                        profile.pictureUrl])

            await reply(replyToken, {
                    type: 'text',
                    text: `สวัสดีค่ะ ☺️ หากต้องการลงทะเบียนเป็นสมาชิกพิมพ์คำว่า 'สมัคร' หรือ 'ลงทะเบียน' ได้เลยค่ะ`
                })
            return
       }

    //  กิน
    //    if(event.type === 'message' && ['text', 'image', 'video', 'file', 'location', 'sticker'].includes(event.message.type)){
    //         const timestamp = event.timestamp
    //         const userId = event.source.userId

    //         await db.query('UPDATE member SET recent_conversation = $1 WHERE user_id = $2', [timestamp, userId])
    //    }

        //ผู้ใช้ส่ง text มา
        if (event.type === 'message' && event.message.type === 'text') {
            const text = event.message.text.trim()
            const replyToken = event.replyToken
            const userId = event.source.userId

            if (/สมัคร|ลงทะเบียน/.test(text)) {

                //เช็กว่าเปิดให้ลงทะเบียนไหม
                const checkStatusRegister = await db.query(`select status from login where id = '3'`)

                if(checkStatusRegister.rowCount > 0 && checkStatusRegister.rows[0].status) {
                    //ดึงข้อมูล user
                    const result = await db.query(`select is_registered from member where user_id = $1`, [userId])

                    //ไม่พบ user
                    if(result.rowCount === 0) {

                        let displayName = null
                        let pictureUrl = null

                        try {
                            const profile = await getProfile(userId)
                            displayName = profile.displayName
                            pictureUrl = profile.pictureUrl
                        } catch (err) {
                            console.log('get profile failed', err.message)
                        }

                        await db.query(`
                            INSERT INTO member (
                                user_id, 
                                display_name,
                                picture_url,
                                is_friend, 
                                is_registered
                                )
                            VALUES ($1, $2, $3, true, false)
                        `, [userId, displayName, pictureUrl])

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
                } else {
                    await reply(replyToken, {
                        type: 'text',
                        text: 'ตอนนี้ทางเรายังไม่เปิดให้ลงทะเบียนค่ะ ขออภัยด้วยนะคะ'
                    })
                    return
                }
               
            }

            if (text.includes('สวัสดี')) {
                console.log('before reply')
                await reply(replyToken, {
                    type: 'text',
                    text: 'สวัสดีค่ะ ติดต่อเรื่องอะไรคะ'
                })
                console.log('after reply')
            return
            }
        }
    res.sendStatus(200)
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

