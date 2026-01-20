const axios = require('axios');

const LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push'
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
};

exports.pushWelcomeFlex = async(userId, firstname) => {
    return axios.post(LINE_PUSH_API,
        {
            to: userId,
            messages: [
                {
                    type: 'flex',
                    altText: 'ยินดีต้อนรับสมาชิกใหม่',
                    contents: {
                        type: 'bubble',
                        body: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: `ยินดีต้อนรับ ${firstname || ''} 🎉`,
                                    weight: 'bold',
                                    size: 'lg'
                                },
                                {
                                    type: 'text',
                                    text: 'คุณสมัครสมาชิกเรียบร้อยแล้ว'
                                }
                            ]
                        }
                    }
                }
            ]
        },
        { headers: LINE_HEADER }
    )
}