exports.createQuotation = async(client, index_company, q_id, index) => {
    const document_id = `${q_id}-${String(index + 1)}`

    // สร้าง quotation
    const quotationResult = await client.query(
        `
        INSERT INTO quotation(company_id, compare_id, doc_id) 
        VALUES ($1, $2, $3) 
        RETURNING id
        `,
        [ Number(index_company), q_id, document_id ]
    )

    const quotation_id = quotationResult.rows[0].id

    return quotation_id
}