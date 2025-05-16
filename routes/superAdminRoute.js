const express = require('express');
const router = express.Router();
const superAdminService = require('../services/superAdminService');
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');

router.use(function (req, res, next) {
  // console.log('middleware is working.');
  next();
});

router.post('/superadmin/login', function (req, res) {
  superAdminService.loginSuperAdmin(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/resetpassword', function (req, res) {
  superAdminService.resetPassword(req.body.userName).then(
    function (response) {
      res.status(200).send({ status: 200, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/list', function (req, res) {
  superAdminService.listSuperAdmin().then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/list/:adminid', function (req, res) {
  superAdminService.getSuperAdmin(req.params.adminid).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/add', function (req, res) {
  superAdminService.addSuperAdmin(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/edit', function (req, res) {
  superAdminService.editSuperAdmin(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/search', function (req, res) {
  superAdminService.searchSuperAdmin(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/collegeadmin/list/:adminid', function (req, res) {
  superAdminService.getCollegeAdmin(req.params.adminid).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/collegeadmin/list', function (req, res) {
  superAdminService.listCollegeAdmin().then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/collegeadmin/add', function (req, res) {
  superAdminService.addCollegeAdmin(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/collegeadmin/edit', function (req, res) {
  superAdminService.editCollegeAdmin(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/collegeadmin/search', function (req, res) {
  superAdminService.searchCollegeAdmin(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/veteran/list', function (req, res) {
  superAdminService.listVeterans().then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/veteran/list/:state', function (req, res) {
  superAdminService.listVeteransByState(req.params.state).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/loginactivity/list', function (req, res) {
  superAdminService.listLoginActivity().then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/veteraninfo/:email', function (req, res) {
  superAdminService.getVeteranId(req.params.email).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/contactcount/:id', function (req, res) {
  superAdminService.getVeteranContactCount(req.params.id).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/deactivate/veteran/:id', function (req, res) {
  superAdminService.deactivateVeterans(req.params.id).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/veteran/messahelist/:id', function (req, res) {
  superAdminService.getVeteransMessage(req.params.id).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/college/campaignlist', function (req, res) {
  superAdminService.getCollegeCampaignList(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/college/campaignbyid/:id', function (req, res) {
  superAdminService.getCollegeCampaignById(req.params.id).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/college/campaign/addedit', function (req, res) {
  superAdminService.addeditCollegeCampaign(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/college/deletecampaign/:id', function (req, res) {
  superAdminService.deleteCampaignById(req.params.id).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/collegeadmin/listbyid/:cid', function (req, res) {
  superAdminService.listCollegeAdminByCollegeId(req.params.cid).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/superadmin/emailtemplate/sendemail', function (req, res) {
  superAdminService.sendEmailTemplateMail(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/superadmin/similar-school/:collegeId', async (req, res) => {
  try {
    const similarSchoolList = await superAdminService.getSimilarSchool(
      req.params.collegeId
    );
    res.json({ success: true, data: similarSchoolList });
  } catch (error) {
    res
      .status(error.status ? error.status : 503)
      .json({ success: false, data: null, message: 'unable to get' });
  }
});

router.post('/superadmin/add-similar-school/:collegeId', async (req, res) => {
  try {
    const similarSchoolList = await superAdminService.addSimilarSchool(
      req.params.collegeId,
      req.body
    );
    res.json({ success: true, data: similarSchoolList });
  } catch (error) {
    res
      .status(error.status ? error.status : 503)
      .json({ success: false, data: null, message: 'unable to insert' });
  }
});

router.post('/superadmin/similar-school-report', async (req, res) => {
  try {
    res.json({
      success: true,
      data: await superAdminService.getSimilarSchoolReport(req.body),
    });
  } catch (error) {
    res
      .status(error.status ? error.status : 503)
      .json({ success: false, data: null, message: 'unable to fetch' });
  }
});

router.post('/superadmin/feature-school-tracking', async (req, res) => {
  try {
    res.json({
      success: true,
      data: await superAdminService.getFeatureSchoolReport(req.body),
    });
  } catch (error) {
    res
      .status(error.status ? error.status : 503)
      .json({ success: false, data: null, message: 'unable to fetch' });
  }
});

router.post('/superadmin/report/response-code-report', async (req, res) => {
  try {
    const report = await superAdminService.getResponseCodeReport(req.body);
    successHandler(res, report, 'Fetched report successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/superadmin/program/list/:type', async (req, res) => {
  try {
    const programData = await superAdminService.getProgramData(req.params.type);
    res.json({ success: true, data: programData });
  } catch (error) {
    res.json({ success: false, data: null, message: 'unable to get' });
  }
});

router.post('/superadmin/program/delete', async (req, res) => {
  try {
    const programData = await superAdminService.getDeleteProgramData(req.body);
    res.json({ success: true, data: programData });
  } catch (error) {
    res.json({ success: false, data: null, message: 'unable to get' });
  }
});

router.get('/superadmin/program/edit/:type/:id', async (req, res) => {
  try {
    const programData = await superAdminService.getEditProgramData(
      req.params.type,
      req.params.id
    );
    res.json({ success: true, data: programData });
  } catch (error) {
    res.json({ success: false, data: null, message: 'unable to get' });
  }
});

router.post('/superadmin/program/add', async (req, res) => {
  try {
    res.json({
      success: true,
      data: await superAdminService.getAddProgramData(req.body),
    });
  } catch (error) {
    res.json({ success: false, data: null, message: 'unable to fetch' });
  }
});

router.post('/superadmin/program/edit', async (req, res) => {
  try {
    res.json({
      success: true,
      data: await superAdminService.getUpdateProgramData(req.body),
    });
  } catch (error) {
    res.json({ success: false, data: null, message: 'unable to fetch' });
  }
});

router.post('/superadmin/program/filter', async (req, res) => {
  try {
    res.json({
      success: true,
      data: await superAdminService.getFilterProgramData(req.body),
    });
  } catch (error) {
    res.json({ success: false, data: null, message: 'unable to fetch' });
  }
});

// Return router
module.exports = router;
