const field = [
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
        key: "car_brand",
        description: "ยี่ห้อรถยนต์",
        example: "Toyota"
    },
    {
        key: "car_model",
        description: "รุ่นรถยนต์",
        example: "Corolla Altis"
    },
    {
        key: "car_year",
        description: "ปีรถยนต์",
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
    },
    {
        key: "thirdparty_injury_death_per_person",
        description: "ความรับผิดต่อชีวิตร่างกายบุคคลภายนอก(ต่อคน)",
        example: "500000"
    },
    {
        key: "thirdparty_injury_death_per_accident",
        description: "ความรับผิดต่อชีวิตร่างกายบุคคลภายนอก(ต่อคร้ัง)",
        example: "20000000"
    },
    {
        key: "thirdparty_property",
        description: "ความรับผิดต่อทรัพย์สินของบุคคลภายนอก(ต่อคร้ัง)",
        example: "2500000"
    },
    {
        key: "car_own_damage",
        description: "ความเสียหายต่อรถยนต์",
        example: "1000000"
    },
    {
        key: "car_own_damage_deductible",
        description: "ค่าเสียหายส่วนแรก(ต่อคร้ัง)",
        example: "500000"
    },
    {
        key: "car_fire_theft",
        description: "รถยนต์สูญหาย/ ไฟไหม้",
        example: "1000000"
    },
    {
        key: "additional_personal_permanent_driver_cover",
        description: "อุบัติเหตุส่วนบุคคล(ต่อคน)",
        example: "100000"
    },
    {
        key: "additional_medical_expense_cover",
        description: "ค่ารักษาพยาบาล(ต่อคน)",
        example: "100000"
    },
    {
        key: "additional_bail_bond",
        description: "การประกันตัวผู้ขับขี่(ต่อคร้ัง)",
        example: "300000"
    },
    {
        key: "additional_personal_permanent_driver_number",
        description: "จำนวนที่นั่ง (ผู้ขับขี่รวมผู้โดยสาร)",
        example: "7"
    },
]

module.exports = field