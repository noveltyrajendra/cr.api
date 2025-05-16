exports.DEFAULT_LEVEL_QUERY="select id as levelId, title as levelTitle, short_title as levelShortTitle from levels where status='ACTIVE' order by display_order ASC"

exports.levelConstant = {
    BACHELOR: 5,
    MASTER: 7,
    ASSOCIATE: 3,
    CERTIFICATE: 18,
    POST_BACHELOR: 6,
    POST_MASTER: 8,
    DOCTORATE: 17,
}