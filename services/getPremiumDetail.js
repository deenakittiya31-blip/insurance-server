exports.getPremiumDetail = async(client, index_premium) => {
    const resultPremium = await client.query(
        `
        select
            ipm.premium_id,
            ipm.premium_name,
            ipm.car_lost_fire as car_fire_theft ,
            ipm.selling_price as premium_total,
            it.nametype as insurance_type,
            ipk.repair_type,
            ipk.package_id,
            ipk.car_own_damage_deductible,
            ipk.thirdparty_injury_death_per_person,
            ipk.thirdparty_injury_death_per_accident,
            ipk.thirdparty_property,
            ipk.additional_personal_permanent_driver_cover,
            ipk.additional_medical_expense_cover,
            ipk.additional_bail_bond,
            ipk.additional_personal_permanent_driver_number
        from
            insurance_premium as ipm
            inner join insurance_package as ipk on ipm.package_id = ipk.id
            inner join insurance_type as it on ipk.insurance_type = it.id
        where
            ipm.id = $1
        `
        , [Number(index_premium)])

    if (resultPremium.rows.length === 0) {
        throw new Error(`ไม่พบข้อมูล premium id: ${index_premium}`)
    }

    //ได้ object มาก่อนหนึ่ง
    const premiumData = resultPremium.rows[0]

    return premiumData
}