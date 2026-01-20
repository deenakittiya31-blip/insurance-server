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
            const replyToken = event.replyToken

            const welcomeMessage = {
                type: 'text',
                text: `สวัสดีค่ะ! ยินดีต้อนรับสู่ deena สามารถกดปุ่มด้านล่างเพื่อลงทะเบียนได้เลยค่ะ :)`,
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
            await reply(replyToken, welcomeMessage)
            return
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

