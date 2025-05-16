exports.GET_ALL_BRANCH_QUERY ="Select * FROM branches where status='ACTIVE' order by display_order ASC";
exports.GET_BRANCH_BYID ="Select branch_short_name,branch_full_name FROM branches where id= ?";