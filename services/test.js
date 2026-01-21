{
  "type": "bubble",
  "hero": {
    "type": "image",
    "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
    "size": "full",
    "aspectRatio": "20:13",
    "aspectMode": "cover"
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "image",
                "url": "https://i.pinimg.com/736x/51/eb/5d/51eb5df04c52796463cb147b5c8e5bd0.jpg",
                "aspectMode": "cover",
                "size": "full"
              }
            ],
            "cornerRadius": "100px",
            "width": "72px",
            "height": "72px"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "ยินดีต้อนรับ 🎉",
                "weight": "bold"
              },
              {
                "type": "text",
                "text": "คุณ กฤติยาภรณ์"
              }
            ],
            "justifyContent": "center"
          }
        ],
        "spacing": "xl",
        "paddingAll": "20px"
      }
    ],
    "paddingAll": "0px"
  }
}



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