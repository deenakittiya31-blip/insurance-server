const axios = require('axios');

const LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push'
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
};

exports.pushWelcomeFlex = async(userId, display_name, picture_url) => {
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
                            url: "https://pbs.twimg.com/media/G_K0JVpbMAEVCo9?format=png&name=small",
                            size: "full",
                            aspectRatio: "9:8",
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
                                                    url: `${picture_url}`,
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

exports.sendText = async(userId, text) => {
    try {
        const res = await axios.post(LINE_PUSH_API, 
            {
                to: userId,
                messages: [
                    {
                        type: 'text',
                        text: text
                    }
                ]
            },
            { headers: LINE_HEADER }
        )

        console.log('send image success:', userId)
        return res
    } catch (error) {
        console.error('Line error: ', error.response?.data || error.message)   
    }
}

exports.sendImage = async(userId, imageUrl ) => {
    try {
        console.log('send image url:', imageUrl);
        const res = await axios.post(LINE_PUSH_API, 
            {
                to: userId,
                messages: [
                    {
                        type: 'image',
                        originalContentUrl: imageUrl ,
                        previewImageUrl: imageUrl 
                    }
                ]
            },
            { headers: LINE_HEADER }
        )

        return res
    } catch (error) {
        console.error(
            'Line error:',
            error.response?.status,
            error.response?.data
        );
    }
}

exports.getProfile = async(userId) => {
    const res = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
        headers: LINE_HEADER
    })
    return res.data
}

exports.pushOrderFlex = async(userId, data) => {
    try {
        const res = await axios.post(LINE_PUSH_API, {
            to: userId,
            messages: [
                {
                    type: "flex",     
                    altText: `คำสั่งซื้อ ${data.order_id}`,
                    contents: { 
                        type: "bubble",
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "คำสั่งซื้อ",
                                    weight: "bold",
                                    color: "#1DB446",
                                    size: "sm"
                                },
                                {
                                    type: "text",
                                    text: `${data.premium_name}`,
                                    weight: "bold",
                                    size: "lg",
                                    margin: "md"
                                },
                                {
                                    type: "text",
                                    size: "xs",
                                    color: "#aaaaaa",
                                    wrap: true,
                                    text: `รหัสแพ็กเกจ ${data.package_id}  ${data.package_name}`
                                },
                                {
                                    type: "separator",
                                    margin: "xxl"
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "บริษัท",
                                            size: "sm",
                                            color: "#555555",
                                            flex: 0
                                        },
                                        {
                                            type: "text",
                                            text: `${data.namecompany}`,
                                            size: "sm",
                                            color: "#111111",
                                            align: "end"
                                        }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "ประเภทประกัน",
                                            size: "sm",
                                            color: "#555555",
                                            flex: 0
                                        },
                                        {
                                            type: "text",
                                            text: `${data.nametype}`,
                                            size: "sm",
                                            color: "#111111",
                                            align: "end"
                                        }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "ประเภทซ่อม",
                                            size: "sm",
                                            color: "#555555",
                                            flex: 0
                                        },
                                        {
                                            type: "text",
                                            text: `${data.repair_type}`,
                                            size: "sm",
                                            color: "#111111",
                                            align: "end"
                                        }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "วิธีการชำระเงิน",
                                            size: "sm",
                                            color: "#555555"
                                        },
                                        {
                                            type: "text",
                                            text: `${data.name_payment}`,
                                            size: "sm",
                                            color: "#111111",
                                            align: "end"
                                        }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "ราคาเบี้ยเดิม",
                                            size: "sm",
                                            color: "#555555"
                                        },
                                        {
                                            type: "text",
                                            text: `${data.total_premium} บาท`,
                                            size: "sm",
                                            color: "#111111",
                                            align: "end"
                                        }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "ราคาที่ซื้อ",
                                            size: "sm",
                                            color: "#555555"
                                        },
                                        {
                                            type: "text",
                                            text: `${data.selling_price} บาท`,
                                            size: "sm",
                                            align: "end"
                                        }
                                        ]
                                    }
                                    ]
                                },
                                {
                                    type: "separator",
                                    margin: "xxl"
                                },
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    margin: "md",
                                    contents: [
                                    {
                                        type: "text",
                                        text: "ORDER ID",
                                        size: "xs",
                                        color: "#aaaaaa",
                                        flex: 0
                                    },
                                    {
                                        type: "text",
                                        text: `${data.order_id}`,
                                        color: "#aaaaaa",
                                        size: "xs",
                                        align: "end"
                                    }
                                    ]
                                }
                            ]
                        }
                    },
                    styles: {
                        footer: {
                        separator: true
                        }
                    }
                }
            ]
        },
        { headers: LINE_HEADER }
    )

    return res
    } catch (error) {
        console.error(
            'Line error:',
            error.response?.status,
            error.response?.data
        );
    }
}
