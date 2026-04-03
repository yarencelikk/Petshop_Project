const getPaginationParams = (page, per_page) => {
    const limit = per_page ? parseInt(per_page) : 20;
    const offset = page ? (parseInt(page) - 1) * limit : 0;

    return { limit, offset };
};

const getPagingData = (count, page, limit) => {
    return {
        total_items: count,
        total_pages: Math.ceil(count / limit),
        current_page: parseInt(page || 1),
        per_page: parseInt(limit)
    };
};

module.exports = { getPaginationParams, getPagingData };