function getTotalPremiumWithCompulsory(ins) {
    const premium = parseFloat(ins.fields?.premium_total || 0);
    const compulsory = parseFloat(ins.fields?.compulsory_amount || 0);
    return premium + compulsory;
}

module.exports = { getTotalPremiumWithCompulsory }