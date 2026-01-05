const axios = require('axios')

const api = 'https://backend.aksonocr.com/api/v1/key-extract-url'

const headers = {
            "X-API-Key": process.env.AKSON_KEY,
            "Content-Type": "application/json"
};

exports.akson = async(req, res) => {
    try {
        const {base64} = req.body;
        console.log(base64)

        if(!base64){
             return res.status(400).json({ msg: 'image ต้องเป็น base64 string' })
        }

        const payload = {
            base64Image: base64,
            customFields: [
               {
                    key: "quotation_number",
                    description: "เลขที่ใบเสนอราคาประกันรถยนต์",
                    example: "QT-INS-2024-001"
                },
                {
                    key: "quotation_date",
                    description: "วันที่ออกใบเสนอราคา",
                    example: "15/01/2024"
                },
                {
                    key: "insurance_company",
                    description: "ชื่อบริษัทประกันภัย",
                    example: "วิริยะประกันภัย"
                },
                {
                    key: "repair_type",
                    description: "ประเภทซ่อม",
                    example: "ซ่อมอู่"
                },
                {
                    key: "vehicle_brand",
                    description: "ยี่ห้อรถยนต์",
                    example: "Toyota"
                },
                {
                    key: "vehicle_model",
                    description: "รุ่นรถยนต์",
                    example: "Corolla Altis"
                },
                {
                    key: "vehicle_year",
                    description: "ปีรถ",
                    example: "2021"
                },
                {
                    key: "engine_size",
                    description: "ขนาดเครื่องยนต์ CC",
                    example: "1800"
                },
                {
                    key: "insurance_type",
                    description: "ประเภทประกันภัย",
                    example: "ชั้น 1"
                },
                {
                    key: "coverage_amount",
                    description: "ทุนประกัน",
                    example: "500000"
                },
                {
                    key: "premium_total",
                    description: "เบี้ยประกันรวม",
                    example: "18500.00"
                }
            ],
            additionalInstructions: "Extract numbers without commas or currency symbols. Dates in DD/MM/YYYY format."
        }

        const response = await axios.post(api, payload, {headers: headers})

        return res.json({
            success: true,
            data: response.data
        })

        console.log(response.data)
        
    } catch (err) {
        
    }
}

