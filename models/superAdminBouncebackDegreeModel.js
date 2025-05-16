let superAdminBouncebackDegreeModel = function(degreeData, collegeList){
    let list=[];
    let degreeCollegeDataList=[];
    degreeData.forEach(function(degree)
    {	
       
         for(let i=0; i<collegeList.length;i++){
            degreeCollegeDataList.push({
                collegeId: collegeList[i].college_id,
                collegeName: collegeList[i].college_name,
                burb: collegeList[i].burb,
                displayOrder: collegeList[i].display_order
            });
         } 
        	
        list.push({
            levelId: degree.level_id,
            bucketId: degree.bucket_id,
            secBucketId: degree.secondary_bucket_id,
            secBucketTitle: degree.secondary_bucket_title,
            degreeCollegeList: degreeCollegeDataList
        });
    });
    return list;
};
  
module.exports = superAdminBouncebackDegreeModel;