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
       if(event.type === 'message' && event.message.type === 'text') {
            const userMessage = event.message.text //ข้อความที่ผู้ใช้พิมพ์มา
            const replyToken = event.replyToken

            if(userMessage.includes('สวัสดี')) {
                const quickReplyMessage = {
                    type: 'text',
                    text: `สวัสดีค่ะ! ยินดีต้อนรับสู่ deena  สามารถเลือกปุ่มด้านล่างเพื่อสอบถามข้อมูลเบี้ยประกันได้เลยค่ะ :)`,
                    quickReply: {
                        items: [
                            {
                                type: 'action',
                                action: {
                                    type: 'uri',
                                    label: 'ลงทะเบียนเพื่อรับข้อมูล',
                                    uri: 'https://insuurance-client.vercel.app'
                                }
                            }
                        ]
                    }
                }

                 await reply(replyToken, quickReplyMessage)
            }
       }
    } catch (err) {
        console.error(err.response?.data || err.message)
        return res.status(500).send('Error')
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

