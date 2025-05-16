let superAdminSpecificDegreeModel = function(src){
  
    var list=[];
    src.forEach(function(obj)
    {		
        list.push({
            id: obj.id,
            collegeId:obj.college_id,
            collegeText:obj.collegename,
            levelId:obj.level_id,
            bucketId:obj.bucket_id,
            secBucketId:obj.sec_bucket_id,
            secondaryBucketTitles:obj.secondary_bucket_titles,
            newCollegeName:obj.new_college_name,
            degreeSpecificAlias:obj.degree_specific_alias,
            degreeRule:obj.degree_rule,
            degreeTitle:obj.degree_title,
            degreeDesc:obj.degree_desc,
            jobMarketReview:obj.job_market_review,
            courses:obj.courses,
            graduationRate:obj.graduation_rate,
            placementRate:obj.placement_rate,
            gmatScore: obj.gmat_score,
            avgImmediateSalary:obj.avg_immediate_salary,
            profileCollegeId: obj.college_info_id
        });
    });
    return list;
  };
  
  module.exports = superAdminSpecificDegreeModel;