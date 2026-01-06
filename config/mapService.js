exports.mapToMainField = async(ocrData, mainFields) => {
    const mapped = {}

    for (const field of mainFields) {
        const code = field.field_code

        mapped[code] = ocrData?.[code] ?? null
    }

    return mapped
}