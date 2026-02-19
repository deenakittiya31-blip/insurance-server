exports.validatePremiums = (premiums) => {
    if (!premiums || premiums.length < 3) {
        const err = new Error('กรุณาเลือกแพ็กเกจให้ครบ 3 รายการ')
        err.statusCode = 400
        throw err
    }

    if (premiums.length > 3) {
        const err = new Error('เลือกได้สูงสุด 3 รายการเท่านั้น')
        err.statusCode = 400
        throw err
    }
}