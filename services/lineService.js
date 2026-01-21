const axios = require('axios');

const LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push'
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
};

exports.pushWelcomeFlex = async(userId, display_name) => {
    return axios.post(LINE_PUSH_API,
        {
            to: userId,
            messages: [
                {
                    type: 'flex',
                    altText: 'ยินดีต้อนรับสมาชิกใหม่',
                    contents: {
                        type: 'bubble',
                        hero: {
                            type: "image",
                            url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
                            size: "full",
                            aspectRatio: "20:13",
                            aspectMode: "cover"
                        },
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    contents: [
                                        {
                                            type: "box",
                                            layout: "vertical",
                                            contents: [
                                                {
                                                    type: "image",
                                                    url: "https://i.pinimg.com/736x/51/eb/5d/51eb5df04c52796463cb147b5c8e5bd0.jpg",
                                                    aspectMode: "cover",
                                                    size: "full"
                                                }
                                            ],
                                            cornerRadius: "100px",
                                            width: "72px",
                                            height: "72px"
                                        },
                                        {
                                            type: "box",
                                            layout: "vertical",
                                            contents: [
                                                {
                                                    type: "text",
                                                    text: "ยินดีต้อนรับ 🎉",
                                                    weight: "bold"
                                                },
                                                {
                                                    type: "text",
                                                    text: `คุณ ${display_name || ''}`
                                                }
                                            ],
                                            justifyContent: "center"
                                        }
                                    ],
                                    spacing: "xl",
                                    paddingAll: "20px"
                                }
                            ],
                            paddingAll: "0px"
                        }
                    }
                }
            ]
        },
        { headers: LINE_HEADER }
    )
}