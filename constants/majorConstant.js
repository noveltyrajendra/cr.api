const majorConstant = {
  MAJORS_QUERY:
    "select id as majorId, title as majorTitle, description as description from majors_new where status='ACTIVE' ORDER BY title asc",

  MAJORS_BUCKET_QUERY:
    "select mn.id as majorId, mn.title as majorTitle, mn.description as description, bd.title as primaryDegree, bsd.title as secondaryDegree from majors_new mn left join bucket_secondary_degree_list bsdl on mn.id = bsdl.major_id left join bucket_secondary_degree bsd on bsdl.bucket_secondary_degree_id = bsd.id left join bucket_degree bd on bsdl.bucket_primary_degree_id = bd.id where mn.status='ACTIVE' ORDER BY mn.title asc",

  MAJORS_TITLE_QUERY:
    "select id as majorId, title as majorTitle, description as description from majors_new where status='ACTIVE' and `title` like ?",

  MAJORS_LEVEL_QUERY:
    'select distinct m.id as majorId, m.title as majorTitle, m.description as description from majors_new m INNER JOIN college_majors_new cm on ' +
    "m.id=cm.major_id INNER JOIN levels l on l.id=cm.aw_level where m.status='ACTIVE' and l.`id`= ? Order by m.title  asc",

  MAJORS_COLLEGE_QUERY:
    'select distinct m.id as majorId, m.title as majorTitle, m.description as description from majors_new m INNER JOIN college_majors_new cm on ' +
    "m.id=cm.major_id where m.status='ACTIVE' and cm.`cr_id`= ?",

  MAJORS_COLLEGE_LEVEL_QUERY:
    'select distinct m.id as majorId, m.title as majorTitle, m.description as description from majors_new m INNER JOIN college_majors_new cm on ' +
    "m.id=cm.major_id INNER JOIN levels l on l.id=cm.aw_level where m.status='ACTIVE' and cm.`cr_id`= ? and l.`id`= ? Order by m.title asc",

  MAJORS_LEVEL_MAIN_QUERY:
    "select m.id as majorId,m.title as majorTitle,m.description as description,m.status as status,gm.short_title as shortTitle from majors_new as m left join (select cmn.major_id as major_id,replace(GROUP_CONCAT(distinct(l.short_title)),',',' ') short_title from college_majors_new as cmn left join levels as l on cmn.aw_level=l.id GROUP BY major_id) as gm on m.id = gm.major_id Order by m.title asc",
  MAJORS_COLLEGE_DETAIL_QUERY:
    "select cmn.major_id as major_id,m.title as majorTitle,m.description as description,replace(GROUP_CONCAT(distinct(l.short_title)),',',',') short_title from college_majors_new as cmn left join levels as l on cmn.aw_level=l.id left join majors_new as m on cmn.major_id=m.id where cmn.cr_id = ? GROUP BY major_id Order by m.title  asc",
  MAJORS_COLLEGE_DETAIL_DESIGNATION_QUERY:
    'select cmn.major_id as majorId,m.title as majorTitle,m.description as description,l.short_title as shortTitle, cmn.online, cmn.in_person as inPerson, cmn.hybrid from college_majors_new as cmn left join levels as l on cmn.aw_level=l.id left join majors_new as m on cmn.major_id=m.id where cmn.cr_id = ? Order by m.title  asc',

  MAJORS_ID_COLLEGE_DETAIL_QUERY:
    'select distinct major_id as majorId from college_majors_new WHERE cr_id = ?',

  ACADEMIC_INTEREST_QUERY:
    "select id, HTML_UnEncode(title) as major, description from majors_new where status='ACTIVE' Order by title asc",
  ACADEMIC_INTEREST_TITLE_QUERY:
    "select id, HTML_UnEncode(title) as major, description from majors_new where status='ACTIVE' and `title` like ?",

  MAJOR_FILTER_QUERY:
    "SELECT mn.id, mn.title as name FROM majors_new mn JOIN bucket_secondary_degree_list bsdl ON mn.id = bsdl.major_id WHERE mn.status='ACTIVE' ",
};

module.exports = majorConstant;
