define({ "api": [
  {
    "type": "get",
    "url": "/api/branch/",
    "title": "Request Branch information",
    "name": "GetBranches",
    "group": "Branch",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Response wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.branchId",
            "description": "<p>primary Id of the branch.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.shortName",
            "description": "<p>shortname of the branch.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.fullName",
            "description": "<p>fullname of the branch.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t\t\"success\": true,\n\t\t \"data\": [\n  \t\t{\n   \t\t \"branchId\": 1,\n    \t\t \"shortName\": \"Army\",\n    \t\t \"fullName\": \"United States Army\"\n  \t\t},\n  \t\t{\n    \t\t \"branchId\": 2,\n    \t\t \"shortName\": \"Navy\",\n    \t\t \"fullName\": \"United States Navy\"\n  \t\t}]\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/branchRoute.js",
    "groupTitle": "Branch"
  },
  {
    "type": "get",
    "url": "/college/default",
    "title": "Request Default College",
    "name": "Get_Default_Colleges",
    "group": "College",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Response wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.collegeId",
            "description": "<p>College Id.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeName",
            "description": "<p>College Name.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.streetAddress",
            "description": "<p>College Address.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.city",
            "description": "<p>City.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.state",
            "description": "<p>State.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.postalCode",
            "description": "<p>Postal Code.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.phone",
            "description": "<p>Phonen Number.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.website",
            "description": "<p>College Website.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeLogo",
            "description": "<p>Url of image of college logo.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegePhoto",
            "description": "<p>Url of image of college.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": true,
            "field": "message",
            "description": "<p>Message (only returned when error occurs).</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": true,
            "field": "count",
            "description": "<p>Length of data (only retuned when success).</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [\n\t\t\t    {\n\t\t\t      \"collegeId\": 100,\n\t\t\t      \"collegeName\": \"Quinnipiac University\",\n\t\t\t      \"streetAddress\": \"275 Mt Carmel Ave\",\n\t\t\t      \"city\": \"Hamden\",\n\t\t\t      \"state\": \"CT\",\n\t\t\t      \"postalCode\": \"06518\",\n\t\t\t      \"phone\": \"203-582-8600\",\n\t\t\t      \"website\": \"http://www.qu.edu\",\n\t\t\t      \"collegeLogo\": \"https://www.collegerecon.com/assets/college-media/512_logo.jpg\",\n\t\t\t      \"collegePhoto\": \"https://www.collegerecon.com/assets/college-media/512_photo.jpg\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"collegeId\": 101,\n\t\t\t      \"collegeName\": \"Upper Iowa University\",\n\t\t\t      \"streetAddress\": \"605 Washington St\",\n\t\t\t      \"city\": \"Fayette\",\n\t\t\t      \"state\": \"IA\",\n\t\t\t      \"postalCode\": \"52142\",\n\t\t\t      \"phone\": \"(563) 425-5200\",\n\t\t\t      \"website\": \"http://www.uiu.edu\",\n\t\t\t      \"collegeLogo\": \"https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_logo.jpg\",\n\t\t\t      \"collegePhoto\": \"https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_photo.jpg\"\n\t\t\t    }],\n\t \"count\":2\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/collegeRoute.js",
    "groupTitle": "College"
  },
  {
    "type": "get",
    "url": "/college/list",
    "title": "Request all College",
    "name": "Get_all_Colleges",
    "group": "College",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Response wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.collegeId",
            "description": "<p>College Id.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeName",
            "description": "<p>College Name.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.streetAddress",
            "description": "<p>College Address.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.city",
            "description": "<p>City.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.state",
            "description": "<p>State.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.postalCode",
            "description": "<p>Postal Code.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.phone",
            "description": "<p>Phonen Number.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.website",
            "description": "<p>College Website.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeLogo",
            "description": "<p>Url of image of college logo.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegePhoto",
            "description": "<p>Url of image of college.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": true,
            "field": "message",
            "description": "<p>Message (only returned when error occurs).</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": true,
            "field": "count",
            "description": "<p>Length of data (only retuned when success).</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [\n\t\t\t    {\n\t\t\t      \"collegeId\": 100,\n\t\t\t      \"collegeName\": \"Quinnipiac University\",\n\t\t\t      \"streetAddress\": \"275 Mt Carmel Ave\",\n\t\t\t      \"city\": \"Hamden\",\n\t\t\t      \"state\": \"CT\",\n\t\t\t      \"postalCode\": \"06518\",\n\t\t\t      \"phone\": \"203-582-8600\",\n\t\t\t      \"website\": \"http://www.qu.edu\",\n\t\t\t      \"collegeLogo\": \"https://www.collegerecon.com/assets/college-media/512_logo.jpg\",\n\t\t\t      \"collegePhoto\": \"https://www.collegerecon.com/assets/college-media/512_photo.jpg\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"collegeId\": 101,\n\t\t\t      \"collegeName\": \"Upper Iowa University\",\n\t\t\t      \"streetAddress\": \"605 Washington St\",\n\t\t\t      \"city\": \"Fayette\",\n\t\t\t      \"state\": \"IA\",\n\t\t\t      \"postalCode\": \"52142\",\n\t\t\t      \"phone\": \"(563) 425-5200\",\n\t\t\t      \"website\": \"http://www.uiu.edu\",\n\t\t\t      \"collegeLogo\": \"https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_logo.jpg\",\n\t\t\t      \"collegePhoto\": \"https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_photo.jpg\"\n\t\t\t    }],\n\t \"count\":2\t\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/collegeRoute.js",
    "groupTitle": "College"
  },
  {
    "type": "post",
    "url": "/college/search",
    "title": "Search College",
    "name": "search_college",
    "group": "College",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "state",
            "description": "<p>State of college.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number[]",
            "optional": true,
            "field": "majors",
            "description": "<p>Major id's offered by college.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "religiousAffiliation",
            "description": "<p>Religious affilication.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "ethnicAffiliation",
            "description": "<p>Ethnic affiliation.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "publicOrPrivate",
            "description": "<p>Public or private college.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "yearsOffered",
            "description": "<p>Years offered eg : 2 year , 4 year.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "genderPreference",
            "description": "<p>Gender preference.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "schoolSetting",
            "description": "<p>School setting eg: urban, suburb, town, rural, online.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "provideOnlineGraduateClasses",
            "description": "<p>Offers online graduate courses.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "provideOnlineUnderGraduateClasses",
            "description": "<p>Offers online undergraduate courses.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "provideOnlineClasses",
            "description": "<p>Offers online courses.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "underGraduateTuitionFrom",
            "description": "<p>Undergraduate tuition range from.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "underGraduateTuitionTo",
            "description": "<p>Undergraduate tuition range to.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "graduateTuitionFrom",
            "description": "<p>Graduate tuition range from.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "graduateTuitionTo",
            "description": "<p>Graduate tuition range to.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "underGraduatePopulationFrom",
            "description": "<p>Undergraduate population range from.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "underGraduatePopulationTo",
            "description": "<p>Undergraduate population range to.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "graduatePopulationFrom",
            "description": "<p>Graduate population range from.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "graduatePopulationTo",
            "description": "<p>Graduate population range to.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "giStudentFrom",
            "description": "<p>GI bill student range from.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "bahTo",
            "description": "<p>B.A.H range from.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "provideSva",
            "description": "<p>Campus SVA chapter (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "provideFullTimeVeteranCounselor",
            "description": "<p>Full-Time Veteran Counselor on Campus (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "principlesOfExcellence",
            "description": "<p>Signed VA Principles of Excellence (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "associaionOnCampus",
            "description": "<p>Club/Association for Veterans (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "upwardBound",
            "description": "<p>Veteran Upward Bound Program (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "eightKeys",
            "description": "<p>8 Keys to Veterans' Success (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "rotcService",
            "description": "<p>Offers ROTC Program (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "isMemberOfSoc",
            "description": "<p>Member of S.O.C (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "aceCredit",
            "description": "<p>Offers College Credit for Military Experiences (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "clepCredit",
            "description": "<p>Awards Credit for CLEP Exam (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "dsstCredit",
            "description": "<p>Awards Credit for DSST Exam (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "inStateTuitionForActiveDuty",
            "description": "<p>Comply with The Veteran's Choice Act (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "approvedTaFunding",
            "description": "<p>Approved for TA Funding (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "yellowRibbon",
            "description": "<p>Yellow Ribbon Program (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "scholarshipsForVeterans",
            "description": "<p>Scholarships for Military (yes or no).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "reducedTuition",
            "description": "<p>Reduced Tuition for Military (yes or no).</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Response wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.collegeId",
            "description": "<p>College Id.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeName",
            "description": "<p>College Name.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.streetAddress",
            "description": "<p>College Address.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.city",
            "description": "<p>City.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.state",
            "description": "<p>State.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.postalCode",
            "description": "<p>Postal Code.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.phone",
            "description": "<p>Phonen Number.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.website",
            "description": "<p>College Website.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeLogo",
            "description": "<p>Url of image of college logo.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegePhoto",
            "description": "<p>Url of image of college.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": true,
            "field": "message",
            "description": "<p>Message (only returned when error occurs).</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": true,
            "field": "count",
            "description": "<p>Length of data (only retuned when success).</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [\n\t\t\t    {\n\t\t\t      \"collegeId\": 100,\n\t\t\t      \"collegeName\": \"Quinnipiac University\",\n\t\t\t      \"streetAddress\": \"275 Mt Carmel Ave\",\n\t\t\t      \"city\": \"Hamden\",\n\t\t\t      \"state\": \"CT\",\n\t\t\t      \"postalCode\": \"06518\",\n\t\t\t      \"phone\": \"203-582-8600\",\n\t\t\t      \"website\": \"http://www.qu.edu\",\n\t\t\t      \"collegeLogo\": \"https://www.collegerecon.com/assets/college-media/512_logo.jpg\",\n\t\t\t      \"collegePhoto\": \"https://www.collegerecon.com/assets/college-media/512_photo.jpg\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"collegeId\": 101,\n\t\t\t      \"collegeName\": \"Upper Iowa University\",\n\t\t\t      \"streetAddress\": \"605 Washington St\",\n\t\t\t      \"city\": \"Fayette\",\n\t\t\t      \"state\": \"IA\",\n\t\t\t      \"postalCode\": \"52142\",\n\t\t\t      \"phone\": \"(563) 425-5200\",\n\t\t\t      \"website\": \"http://www.uiu.edu\",\n\t\t\t      \"collegeLogo\": \"https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_logo.jpg\",\n\t\t\t      \"collegePhoto\": \"https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_photo.jpg\"\n\t\t\t    }],\n\t \"count\":2\t\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/collegeRoute.js",
    "groupTitle": "College"
  },
  {
    "type": "get",
    "url": "/college/:collegeid",
    "title": "Request College by College Id",
    "name": "search_college_by_college_id",
    "group": "College",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "collegeid",
            "description": "<p>College Id.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "data",
            "description": "<p>Response wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.collegeId",
            "description": "<p>College Id.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeName",
            "description": "<p>College Name.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.streetAddress",
            "description": "<p>College Address.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.city",
            "description": "<p>City.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.state",
            "description": "<p>State.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.postalCode",
            "description": "<p>Postal Code.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.phone",
            "description": "<p>Phonen Number.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.website",
            "description": "<p>College Website.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegeLogo",
            "description": "<p>Url of image of college logo.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.collegePhoto",
            "description": "<p>Url of image of college.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.status",
            "description": "<p>College status.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.timeZone",
            "description": "<p>College Timezone.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.fax",
            "description": "<p>College Fax.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.email",
            "description": "<p>College Email.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.overview",
            "description": "<p>College Overview.</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "data.veteranAffairs",
            "description": "<p>College veteran affairs.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.name",
            "description": "<p>Veteran Affairs Name.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.adress",
            "description": "<p>Veteran Affairs Address.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.city",
            "description": "<p>Veteran Affairs City.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.state",
            "description": "<p>Veteran Affairs State.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.postalCode",
            "description": "<p>Veteran Affairs PostalCode.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.phone",
            "description": "<p>Veteran Affairs Phone.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.fax",
            "description": "<p>Veteran Affairs Fax.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.email",
            "description": "<p>Veteran Affairs Email.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.veteranAffairs.website",
            "description": "<p>Veteran Affairs Website.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.inStateTuition",
            "description": "<p>College In state Tuition.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.outStateTuition",
            "description": "<p>College Out State Tuition.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.maleStudentCount",
            "description": "<p>Total male students.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.femaleStudentCount",
            "description": "<p>Total female students.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "data.studentPopulation",
            "description": "<p>Total students.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.religiousAffiliation",
            "description": "<p>College Religious Affiliation.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.ethnicAffiliation",
            "description": "<p>College Ethnic Affiliation.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.yearsOffered",
            "description": "<p>Year offered.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.genderPreference",
            "description": "<p>Gender Preference.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.schoolSetting",
            "description": "<p>School Setting.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.publicPrivate",
            "description": "<p>Public or Private.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.SatScore",
            "description": "<p>SAT Score.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.actScore",
            "description": "<p>ACT Score.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.gpaRange",
            "description": "<p>GPA Range.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.academicLevel",
            "description": "<p>Academic Level.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.rotc",
            "description": "<p>ROCT.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.yellowRibbon",
            "description": "<p>Yellow Ribbon.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.clepCredit",
            "description": "<p>CLEP Credit.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.dsstCredit",
            "description": "<p>DSST Credit.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.onlineClasses",
            "description": "<p>Online Classes.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.followAceCredit",
            "description": "<p>ACE Credit.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.reducedTuition",
            "description": "<p>Reduced Tutuion.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.scholarshipsForVeterans",
            "description": "<p>Scholarships For Veterans.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.inStateTuitionNoResidency",
            "description": "<p>In State Tuition No Residency.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.approvedTaFunding",
            "description": "<p>Approved TA Funding.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.principlesOfExcellence",
            "description": "<p>Principles Of Excellence.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.fullTimeVetCounselors",
            "description": "<p>FullTime Veteran Counselors.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.clubAssocCampus",
            "description": "<p>Club / Association on Campus.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.upwardBound",
            "description": "<p>Upward Bound.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.awardsAceCredit",
            "description": "<p>Awards Ace Credit.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.sva",
            "description": "<p>SVA.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.bah",
            "description": "<p>B.A.H.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.giBill",
            "description": "<p>GI Bill Students.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.eightKeys",
            "description": "<p>8 Keys to success.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.calendar",
            "description": "<p>Calendar.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.books",
            "description": "<p>Books.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.accessLevel",
            "description": "<p>Access Level.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data.majorsOffered",
            "description": "<p>Majors offered by college.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.majorsOffered.majorId",
            "description": "<p>Primary Id of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.majorsOffered.majorTitle",
            "description": "<p>Title of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.majorsOffered.description",
            "description": "<p>Description for the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": true,
            "field": "message",
            "description": "<p>Message (only returned when error occurs).</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": {\n\t\t    \"collegeName\": \"Alaska Bible College\",\n\t\t    \"streetAddress\": \"248 E Elmwood\",\n\t\t    \"city\": \"Palmer\",\n\t\t    \"state\": \"AK\",\n\t\t    \"postalCode\": \"99645\",\n\t\t    \"phone\": \"(907) 745-3201\",\n\t\t    \"website\": \"www.akbible.edu/\",\n\t\t    \"collegeLogo\": \"https://www.collegerecon.com/assets/college-media/alaska.jpg\",\n\t\t    \"collegePhoto\": \"https://www.collegerecon.com/assets/college-media/bible.jpg\",\n\t\t    \"status\": \"ACTIVE\",\n\t\t    \"timeZone\": \"America/Chicago\",\n\t\t    \"fax\": \"\",\n\t\t    \"email\": \"information@hfalliance.com\",\n\t\t    \"overview\": \"The purpose of Alaska Bible College is to exalt the Lord Jesus Christ and extend ...\",\n\t\t    \"veteranAffairs\": {\n\t\t      \"name\": \"David Ley\",\n\t\t      \"adress\": \"\",\n\t\t      \"city\": \"\",\n\t\t      \"state\": \"\",\n\t\t      \"postalCode\": \"\",\n\t\t      \"phone\": \"(800) 478-7884\",\n\t\t      \"fax\": \"\",\n\t\t      \"email\": \"\",\n\t\t      \"website\": \"http://example.com\"\n\t\t    },\n\t\t    \"inStateTuition\": 9300,\n\t\t    \"outStateTuition\": 9300,\n\t\t    \"maleStudentCount\": 45.7,\n\t\t    \"femaleStudentCount\": 54.3,\n\t\t    \"studentPopulation\": 58,\n\t\t    \"religiousAffiliation\": \"UndeNo Religious Affiliationminational\",\n\t\t    \"ethnicAffiliation\": \"No ethnic affiliation\",\n\t\t    \"yearsOffered\": \"4 Year\",\n\t\t    \"genderPreference\": \"Coed School\",\n\t\t    \"schoolSetting\": \"Town\",\n\t\t    \"publicPrivate\": \"Private\",\n\t\t    \"SatScore\": 0,\n\t\t    \"actScore\": 0,\n\t\t    \"gpaRange\": \"\",\n\t\t    \"academicLevel\": \"Level 5\",\n\t\t    \"rotc\": \"NO\",\n\t\t    \"yellowRibbon\": \"NO\",\n\t\t    \"clepCredit\": \"YES\",\n\t\t    \"dsstCredit\": \"NO\",\n\t\t    \"onlineClasses\": \"YES\",\n\t\t    \"followAceCredit\": \"NO\",\n\t\t    \"reducedTuition\": \"NO\",\n\t\t    \"scholarshipsForVeterans\": \"NO\",\n\t\t    \"inStateTuitionNoResidency\": \"NO\",\n\t\t    \"approvedTaFunding\": \"NO\",\n\t\t    \"principlesOfExcellence\": \"NO\",\n\t\t    \"fullTimeVetCounselors\": \"NO\",\n\t\t    \"clubAssocCampus\": \"NO\",\n\t\t    \"upwardBound\": \"NO\",\n\t\t    \"awardsAceCredit\": \"NO\",\n\t\t    \"sva\": \"No\",\n\t\t    \"bah\": 2148,\n\t\t    \"giBill\": 3,\n\t\t    \"eightKeys\": \"NO\",\n\t\t    \"calendar\": \"SEMESTERS\",\n\t\t    \"books\": 300,\n\t\t    \"accredit\": \"\",\n\t\t    \"accessLevel\": \"Registered\",\n\t\t    \"majorsOffered\": [\n\t\t      {\n\t\t        \"majorId\": 390201,\n\t\t        \"majorTitle\": \"Bible/Biblical Studies\",\n\t\t        \"description\": \"A program that focuses on the Christian and/or Jewish Bible and related literature, with an emphasis on understanding and interpreting the theological, doctrinal, and ethical messages contained therein  May include preparation for applying these studies i\"\n\t\t      },\n\t\t      {\n\t\t        \"majorId\": 390301,\n\t\t        \"majorTitle\": \"Missions/Missionary Studies and Missiology\",\n\t\t        \"description\": \"A program that focuses on the theory and practice of religious outreach, social service and proselytization, and that prepares individuals for mission vocations  Includes instruction in theology, evangelism, preaching, medical and social mission work, mis\"\n\t\t      },\n\t\t      {\n\t\t        \"majorId\": 390601,\n\t\t        \"majorTitle\": \"Theology/Theological Studies\",\n\t\t        \"description\": \"A program that focuses on the beliefs and doctrine of a particular religious faith from the intramural point of view of that faith  Includes instruction in systematic theology, historical theology, moral theology, doctrinal studies, dogmatics, apologetics\"\n\t\t      }\n\t\t    ]\n\t\t  },\n\t \"count\":2\t\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/collegeRoute.js",
    "groupTitle": "College"
  },
  {
    "type": "get",
    "url": "/api/levels/",
    "title": "Request Level information",
    "name": "GetLevels",
    "group": "Levels",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Response wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.levelId",
            "description": "<p>primary Id of the Level.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.levelTitle",
            "description": "<p>Title of the Level.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.levelShortTitle",
            "description": "<p>abbreviation of the Title of Provided Level.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [{\n\t\t\t      \"levelId\": 3,\n\t\t\t      \"levelTitle\": \"Associate's degree\",\n\t\t\t      \"levelShortTitle\": \"A\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"levelId\": 5,\n\t\t\t      \"levelTitle\": \"Bachelor's degree\",\n\t\t\t      \"levelShortTitle\": \"B\"\n\t\t\t    }],\n\t \"count\":2\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/levelRoute.js",
    "groupTitle": "Levels"
  },
  {
    "type": "get",
    "url": "/api/majors/",
    "title": "Request all majors information",
    "name": "getMajors",
    "group": "Majors",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request Status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Data Wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.majorId",
            "description": "<p>Primary Id of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.majorTitle",
            "description": "<p>Title of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.description",
            "description": "<p>Description for the Major.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [{\n\t\t\t      \"majorId\": 1,\n\t\t\t      \"majorTitle\": \"Agriculture, General\",\n\t\t\t      \"description\": \"A program that focuses on the general ..\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"majorId\": 15,\n\t\t\t      \"majorTitle\": \"Engineering Technology, General\",\n\t\t\t      \"description\": \"Instructional programs that prepare individuals to apply ..\"\n\t\t\t    }],\n\t \"count\":2\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/majorRoute.js",
    "groupTitle": "Majors"
  },
  {
    "type": "get",
    "url": "/api/majors/college/:collegeId",
    "title": "Request majors information by College Id",
    "name": "getMajorsByCollege",
    "group": "Majors",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "collegeId",
            "description": "<p>Filter by collegeId.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request Status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Data Wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.majorId",
            "description": "<p>Primary Id of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.majorTitle",
            "description": "<p>Title of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.description",
            "description": "<p>Description for the Major.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [{\n\t\t\t      \"majorId\": 1,\n\t\t\t      \"majorTitle\": \"Agriculture, General\",\n\t\t\t      \"description\": \"A program that focuses on the general ..\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"majorId\": 15,\n\t\t\t      \"majorTitle\": \"Engineering Technology, General\",\n\t\t\t      \"description\": \"Instructional programs that prepare individuals to apply ..\"\n\t\t\t    }],\n\t \"count\":2\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/majorRoute.js",
    "groupTitle": "Majors"
  },
  {
    "type": "get",
    "url": "/api/majors/college/:collegeId/level/:levelId",
    "title": "Request majors information by College Id and Level Id",
    "name": "getMajorsByCollegeAndLevel",
    "group": "Majors",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "collegeId",
            "description": "<p>Filter by collegeId.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "levelId",
            "description": "<p>Filter by levelId.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request Status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Data Wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.majorId",
            "description": "<p>Primary Id of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.majorTitle",
            "description": "<p>Title of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.description",
            "description": "<p>Description for the Major.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [{\n\t\t\t      \"majorId\": 1,\n\t\t\t      \"majorTitle\": \"Agriculture, General\",\n\t\t\t      \"description\": \"A program that focuses on the general ..\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"majorId\": 15,\n\t\t\t      \"majorTitle\": \"Engineering Technology, General\",\n\t\t\t      \"description\": \"Instructional programs that prepare individuals to apply ..\"\n\t\t\t    }],\n\t \"count\":2\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/majorRoute.js",
    "groupTitle": "Majors"
  },
  {
    "type": "get",
    "url": "/api/majors/level/:levelId",
    "title": "Request majors information by Level Id",
    "name": "getMajorsByLevel",
    "group": "Majors",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "levelId",
            "description": "<p>Filter by levelId.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request Status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Data Wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.majorId",
            "description": "<p>Primary Id of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.majorTitle",
            "description": "<p>Title of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.description",
            "description": "<p>Description for the Major.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [{\n\t\t\t      \"majorId\": 1,\n\t\t\t      \"majorTitle\": \"Agriculture, General\",\n\t\t\t      \"description\": \"A program that focuses on the general ..\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"majorId\": 15,\n\t\t\t      \"majorTitle\": \"Engineering Technology, General\",\n\t\t\t      \"description\": \"Instructional programs that prepare individuals to apply ..\"\n\t\t\t    }],\n\t \"count\":2\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/majorRoute.js",
    "groupTitle": "Majors"
  },
  {
    "type": "get",
    "url": "/api/majors/:title",
    "title": "Request majors by title",
    "name": "getMajorsByTitle",
    "group": "Majors",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>Filter by specified Title.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "success",
            "description": "<p>Request Status.</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Data Wrapper.</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "data.majorId",
            "description": "<p>Primary Id of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.majorTitle",
            "description": "<p>Title of the Major.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.description",
            "description": "<p>Description for the Major.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n   {\n\t  \"success\": true,\n\t  \"data\": [{\n\t\t\t      \"majorId\": 1,\n\t\t\t      \"majorTitle\": \"Agriculture, General\",\n\t\t\t      \"description\": \"A program that focuses on the general ..\"\n\t\t\t    },\n\t\t\t    {\n\t\t\t      \"majorId\": 15,\n\t\t\t      \"majorTitle\": \"Engineering Technology, General\",\n\t\t\t      \"description\": \"Instructional programs that prepare individuals to apply ..\"\n\t\t\t    }],\n\t \"count\":2\n\t }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/majorRoute.js",
    "groupTitle": "Majors"
  }
] });
