let collegeContactsModel = function (src) {
    let config = require('../config');
    let list = [];
  
    src.forEach(function (obj) {
      list.push({
        collegeId: obj.id,
        collegeName: obj.college_name,
        admissionEmailAddress1: obj.admission_email_address_1,
        admissionEmailAddress2: obj.admission_email_address_2,
        vetAffairsEmailAddress: obj.vet_affairs_email_address,
        marketingEmailAddress1: obj.marketing_email_address1,
        marketingEmailAddress2: obj.marketing_email_address_2,
        collegeContactExtra1: obj.contact_extra1,
        collegeContactExtra2: obj.contact_extra2,
        collegeContactExtra3: obj.contact_extra3,
        collegeContactExtra4: obj.contact_extra4,
        collegeContactExtra5: obj.contact_extra5,
        inquiryAdmissionEmail1: obj.inquiry_admission_email1,
        inquiryAdmissionEmail2: obj.inquiry_admission_email2,
        inquiryVetAffairsEmail: obj.inquiry_vet_affairs_email,
        inquiryMarketingEmail1: obj.inquiry_marketing_email1,
        inquiryMarketingEmail2: obj.inquiry_marketing_email2,
        inquiryContractExtra1: obj.inquiry_contact_extra1,
        inquiryContractExtra2: obj.inquiry_contact_extra2,
        inquiryContractExtra3: obj.inquiry_contact_extra3,
        inquiryContractExtra4: obj.inquiry_contact_extra4,
        inquiryContractExtra5: obj.inquiry_contact_extra5,
      });
  
    });
    return list;
  };
  
  module.exports = collegeContactsModel;