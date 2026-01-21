const axios = require('axios');

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
};

exports.lineBotReply = async(req, res) => {
    res.sendStatus(200)
    const event = req.body.events?.[0]
    if(!event) return

    try {
       if(event.type === 'follow') {
            await sendRegisterButton(event.replyToken)
            return
       }

        //ผู้ใช้พิมพ์ขอสมัครเอง
        if (event.type === 'message' && event.message.type === 'text') {
            const text = event.message.text
            const replyToken = event.replyToken

            if (
                text.includes('สมัคร') ||
                text.includes('ลงทะเบียน')
            ) {
                await sendRegisterButton(event.replyToken)
                return
            }
        }

       //ถ้าเป็น message ปกติ
       if(event.type === 'message' && event.message.type === 'text') {
            const userMessage = event.message.text
            const replyToken = event.replyToken

            if (userMessage.includes('สวัสดี')) {
                await reply(replyToken, {
                    type: 'text',
                    text: 'สวัสดีค่ะ 😊'
                })
            return
            }
       }
    } catch (err) {
        console.error(err.response?.data || err.message)
        // res.status(500).send('Error')
    }
}

const reply = async(replyToken, msgObj) => {
  return axios.post(LINE_MESSAGING_API, 
        { 
            replyToken: replyToken, 
            messages: [msgObj] 
        }, 
        { 
            headers: LINE_HEADER 
        }
    )
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

