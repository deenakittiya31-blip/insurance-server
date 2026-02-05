exports.GET_DETAIL_PACKAGE = `
            SELECT 
                ip.*,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'payment_method_id', pp.payment_method_id,
                            'payment_name', pm.name_payment,
                            'discount_percent', pp.discount_percent,
                            'discount_amount', pp.discount_amount,
                            'first_payment_amount', pp.first_payment_amount
                        )
                    ) FILTER (WHERE pp.payment_method_id IS NOT NULL),
                    '[]'::jsonb
                ) AS payments,
                COALESCE(ARRAY_AGG(DISTINCT pcb.car_brand_id) FILTER (WHERE pcb.car_brand_id IS NOT NULL), '{}') AS car_brand_id,
                COALESCE(ARRAY_AGG(DISTINCT pcm.car_model_id) FILTER (WHERE pcm.car_model_id IS NOT NULL), '{}') AS car_model_id,
                COALESCE(ARRAY_AGG(DISTINCT put.car_usage_type_id) FILTER (WHERE put.car_usage_type_id IS NOT NULL), '{}') AS car_usage_type_id,
                COALESCE(ARRAY_AGG(DISTINCT pcs.compulsory_id) FILTER (WHERE pcs.compulsory_id IS NOT NULL), '{}') AS compulsory_id
            FROM insurance_package AS ip
            LEFT JOIN insurance_company AS ic ON ip.insurance_company_id = ic.id
            LEFT JOIN insurance_type AS it ON ip.insurance_type_id = it.id

            LEFT JOIN package_car_brand AS pcb ON ip.id = pcb.package_id
            LEFT JOIN car_brand AS cb ON pcb.car_brand_id = cb.id

            LEFT JOIN package_car_model AS pcm ON ip.id = pcm.package_id
            LEFT JOIN car_model AS cm ON pcm.car_model_id = cm.id

            LEFT JOIN package_usage_type AS put ON ip.id = put.package_id
            LEFT JOIN car_usage_type AS cut ON put.car_usage_type_id = cut.id
            LEFT JOIN car_type AS ct ON cut.car_type_id = ct.id
            LEFT JOIN car_usage AS cu ON cut.car_usage_id = cu.id

            LEFT JOIN package_compulsory AS pcs ON ip.id = pcs.package_id
            LEFT JOIN compulsory_insurance AS ci ON pcs.compulsory_id = ci.id

            LEFT JOIN package_payment AS pp ON ip.id = pp.package_id
            LEFT JOIN payment_methods AS pm ON pp.payment_method_id = pm.id
            WHERE ip.id = $1
            GROUP BY ip.id
        `