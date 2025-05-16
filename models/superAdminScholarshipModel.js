let superAdminScholarshipModel = function(src){
  
    var list=[];
    src.forEach(function(obj)
    {		
        list.push({
            id: obj.id,
            scholarshipName:obj.scholarship_name,
            recipients:obj.recipients,
            award:obj.award,
            detail:obj.detail,
            checkMilitaryBranch:obj.check_military_branch,
            checkMilitaryStatus:obj.check_military_status,
            checkStudentEthnic:obj.check_student_ethnic,
            studentEthnic:obj.student_ethnic,
            checkStudentDisability:obj.check_student_disability,
            checkAcademicStatus:obj.check_academic_status,
            checkAcademicLevel:obj.check_academic_level,
            checkDegreeSpecific:obj.check_degree_specific,
            bucket_id:obj.bucket_id,
            degreeId:obj.degree_id,
            opendateFormat: obj.open_date_format?obj.open_date_format:"mm/yyyy",
            openDate:obj.open_date,
            dateFormat: obj.date_format,
            deadline:obj.deadline,
            deadlineDate: obj.deadlinedate,
            recurringEvent: obj.recurring_event,
            website:obj.website,
            DateCreated:obj.date_created
        });
    });
    return list;
  };
  
  module.exports = superAdminScholarshipModel;