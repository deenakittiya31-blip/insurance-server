module.exports = [
        {
            title: 'ข้อมูลเบี้ยประกัน',
            rows: [
                { label: 'บริษัทประกันภัย', key: 'insurance_company', field: 'company_name' },
                { label: 'ประเภทประกันภัย', key: 'insurance_type' },
                { label: 'ประเภทซ่อม', key: 'repair_type' },
                { label: 'ชื่อเบี้ยประกันภัย', key: 'premium_code' },
                { label: 'รหัสเบี้ยประกัน', key: 'quotation_number' },
            ]
        },
        {
            title: 'คุ้มครองรถเรา',
            rows: [
                { label: '  ความเสียหายต่อตัวรถยนต์', key: 'car_own_damage', format: true },
                { label: '  รถยนต์สูญหาย ไฟไหม้', key: 'car_fire_theft', format: true },
                { label: '  ความเสียหายส่วนแรก', key: 'car_own_damage_deductible', format: true },
                { label: '-', key: '', format: true },
            ]
        },
        {
            title: 'คุ้มครองคู่กรณี',
            rows: [
                { label: '  ความเสียหายต่อชีวิต ร่างกาย', key: 'thirdparty_injury_death_per_person', format: true },
                { label: '  ความเสียหายต่อชีวิต ร่างกาย สูงสุด', key: 'thirdparty_injury_death_per_accident', format: true },
                { label: '  ความเสียหายต่อทรัพย์สิน', key: 'thirdparty_property', format: true },
            ]
        },
        {
            title: 'คุ้มครองคนในรถ',
            rows: [
                { label: '  อุบัติเหตุส่วนบุคคล', key: 'additional_personal_permanent_driver_cover', format: true, seats: true },
                { label: '  รักษาพยาบาล', key: 'additional_medical_expense_cover', format: true, seats: true },
                { label: '  ประกันตัวผู้ขับขี่', key: 'additional_bail_bond', format: true },
            ]
        },
        {
            title: 'ราคาเบี้ยประกัน',
            rows: [
                { label: '  เบี้ยประกัน', key: 'premium_total', format: true },
                { label: '  พรบ.', key: 'compulsory_amount', format: true },
                {
                    label: '  เบี้ยประกันรวม พรบ.',
                    sumKeys: ['premium_total', 'compulsory_amount'],
                    format: true
                },
            ]
        },
    ];
