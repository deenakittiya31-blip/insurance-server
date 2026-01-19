//ต้นแบบมาจากเทเวศ
exports.dataQuotation = [
    {
        key_name: 'quotation_number',
        description: 'เลขที่ใบเสนอราคา',
        example_value: 'QTINS2024001,  Q202601000031'
    },
    {
        key_name: 'quotation_date',
        description: 'วันที่ออกใบเสนอราคา',
        example_value: '01/01/2026,  01/01/2026 18:46:48'
    },
    {
        key_name: 'insurance_company',
        description: 'ดึงชื่อบริษัทไม่ต้องเอาคำว่า บริษัท,  จำกัด (มหาชน),  (ประเทศไทย), บจม.',
        example_value: 'คุ้มภัยโตเกียวมารีนประกันภัย,  เทเวศประกันภัย'
    },
    {
        key_name: 'repair_type',
        description: 'การซ่อม, ความคุ้มครอง',
        example_value: 'อู่ประกัน ซ่อมอู่'
    },
    {
        key_name: 'car_brand',
        description: 'ยี่ห้อรถยนต์',
        example_value: 'Toyota'
    },
    {
        key_name: 'car_model',
        description: 'รุ่นรถยนต์',
        example_value: 'Corolla Altis'
    },
    {
        key_name: 'car_year',
        description: 'ปีรถยนต์',
        example_value: '2021'
    },
    {
        key_name: 'engine_size',
        description: 'ขนาด, ขนาดเครื่องยนต์ CC',
        example_value: '1800'
    },
    {
        key_name: 'insurance_type',
        description: 'ประเภทประกันภัย, ประกันภัยรถยนต์, ความคุ้มครอง',
        example_value: 'ประเภท 1'
    },
    {
        key_name: 'coverage_amount',
        description: 'ทุนประกัน',
        example_value: '1000000 '
    },
    {
        key_name: 'premium_total',
        description: 'เบี้ยประกัน (รวมภาษีอากร), เบี้ยประกันภัย',
        example_value: '18500.00'
    },
    {
        key_name: 'thirdparty_injury_death_per_person',
        description: 'ความรับผิดต่อชีวิตร่างกายบุคคลภายนอก(ต่อคน)',
        example_value: '500000'
    },
    {
        key_name: 'thirdparty_injury_death_per_accident',
        description: 'ความรับผิดต่อชีวิตร่างกายบุคคลภายนอก(ต่อคร้ัง)',
        example_value: '20000000'
    },
    {
        key_name: 'thirdparty_property',
        description: 'ความรับผิดต่อทรัพย์สินของบุคคลภายนอก(ต่อคร้ัง)',
        example_value: '2500000'
    },
    {
        key_name: 'car_own_damage',
        description: 'ความเสียหายต่อรถยนต์',
        example_value: '1000000'
    },
    {
        key_name: 'car_own_damage_deductible',
        description: 'ค่าเสียหายส่วนแรก(ต่อครั้ง)',
        example_value: '500000'
    },
    {
        key_name: 'car_fire_theft',
        description: 'รถยนต์สูญหาย/ ไฟไหม้',
        example_value: '1000000'
    },
    {
        key_name: 'additional_personal_permanent_driver_cover',
        description: 'อุบัติเหตุส่วนบุคคล(ต่อคน)',
        example_value: '100000'
    },
    {
        key_name: 'additional_medical_expense_cover',
        description: 'ค่ารักษาพยาบาล(ต่อคน)',
        example_value: '100000'
    },
    {
        key_name: 'additional_bail_bond',
        description: 'การประกันตัวผู้ขับขี่',
        example_value: '300000'
    },
    {
        key_name: 'additional_personal_permanent_driver_number',
        description: 'จำนวนที่นั่ง (ผู้ขับขี่รวมผู้โดยสาร)',
        example_value: '7'
    },
]

exports.additional =  
    `1. ถ้ามี - ในเลขใบเสนอราคาให้เอาแต่ตัวเลขกับตัวอักษรมา
     2. ประเภทกรมธรรม์ลดให้เหลือแค่คำว่า ประเภท เคาะวรรค 1 ครั้งแล้วตามด้วยเลขประเภทกรมธรรม์
     3. ดึงข้อมูลตัวเลขโดยไม่รวมเครื่องหมายจุลภาคหรือสัญลักษณ์สกุลเงิน
     4. วันที่อยู่ในรูปแบบ DD/MM/YYYY`
