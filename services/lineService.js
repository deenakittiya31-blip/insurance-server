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

exports.sendImage = async(userId, imageUrl ) => {
    try {
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

        console.log('send image success:', userId)
        return res
    } catch (error) {
        console.error('Line error: ', error.response?.data || error.message)   
    }
}

exports.sendPDF = async(userId, fileUrl ) => {
    try {
        const res = await axios.post(LINE_PUSH_API, 
            {
                to: userId,
                messages: [
                    {
  type: "carousel",
  contents: [
    {
      type: "bubble",
      size: "deca",
      body: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "image",
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/330px-PDF_file_icon.svg.png",
                aspectMode: "fit",
                size: "xxs",
                align: "center"
              }
            ],
            flex: 1,
            width: "40px",
            height: "70px",
            justifyContent: "center",
            alignItems: "center"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "เอกสารใบเสนอราคา",
                wrap: false,
                align: "start",
                gravity: "center"
              },
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "download",
                  uri: fileUrl,
                  altUri: {
                    desktop: fileUrl
                  }
                },
                margin: "none",
                style: "primary",
                height: "sm",
              }
            ],
            justifyContent: "center",
            spacing: "none",
            margin: "lg"
          }
        ],
        spacing: "lg",
        paddingAll: "12px"
      },
      styles: {
        footer: {
          separator: false
        }
      }
    }
  ]
}             
                ]
            },
            { headers: LINE_HEADER }
        )

        console.log('send pdf success:', userId)
        return res
    } catch (error) {
        console.error('Line error: ', error.response?.data || error.message)   
    }
}