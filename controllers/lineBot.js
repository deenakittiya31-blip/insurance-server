const axios = require('axios');

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
};

exports.lineBotReply = async(req, res) => {
    try {
        if (req.method === "POST"){
            await reply(req.body);
            return res.status(200).send('OK')
        } else {
            return res.status(200).send(`Done`);
        }
    } catch (err) {
        console.error(err.response?.data || err.message)
        return res.status(500).send('Error')
    }
}

const reply = async(bodyResponse) => {
  return axios.post(LINE_MESSAGING_API, 
        { 
            replyToken: bodyResponse.events[0].replyToken, 
            messages: [{ type: text, text: JSON.stringify(bodyResponse) }] 
        }, 
        { 
            headers: LINE_HEADER 
        }
    )
};

