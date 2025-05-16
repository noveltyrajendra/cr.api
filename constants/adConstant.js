
const adConstant = {
 TOP_AD : "SELECT * FROM advertisements WHERE ad_type = 'TOPAD' AND status='ACTIVE' ORDER BY RAND() LIMIT 2",
 SIDEBAR_AD : "SELECT * FROM advertisements WHERE ad_type = 'SIDEBAR' AND status='ACTIVE' ORDER BY RAND() LIMIT 2",
 AD_UPDATE : "UPDATE advertisements SET impressions = ? WHERE uuid = ?"
};

module.exports=adConstant; 