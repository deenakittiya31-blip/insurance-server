exports.GET_LIST_PREMIUM = `
    SELECT 
                ipm.id,
                ipk.package_name,
                ipk.package_id,
                ipm.premium_name,
                ipm.repair_fund_int,
                ipm.repair_fund_max,
                ipm.total_premium,
                ipm.net_income,
                ipm.selling_price,
                ipk.start_date,
                ipk.end_date,
                icp.namecompany,
                it.nametype,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'code_type', ct.code,
                            'code_usage', cut.code_usage
                        )
                    ) FILTER (WHERE ct.id IS NOT NULL),
                    '[]'::jsonb
                ) AS type
            FROM insurance_premium AS ipm
            LEFT JOIN insurance_package AS ipk ON ipm.package_id = ipk.id 
            LEFT JOIN insurance_company AS icp ON ipk.insurance_company_id = icp.id 
            LEFT JOIN insurance_type AS it ON ipk.insurance_type_id = it.id 

            LEFT JOIN package_usage_type AS put ON ipk.id = put.package_id
            LEFT JOIN car_usage_type AS cut ON put.car_usage_type_id = cut.id
            LEFT JOIN car_type AS ct ON cut.car_type_id = ct.id
`