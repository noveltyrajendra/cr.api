const express = require('express');
const router = express.Router();
const careerreconCompanyService = require('../services/careerreconCompanyService');
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');
const logHandler = require('../utils/logHandler');

router.use(function (req, res, next) {
  // console.log('middleware is working.');
  next();
});

router.get('/companies', function (req, res) {
  careerreconCompanyService.getAllCompanies().then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/lookups/:type', async (req, res) => {
  try {
    const lookup = await careerreconCompanyService.getlookupData(
      req.params.type
    );
    successHandler(res, lookup, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/focus', function (req, res) {
  careerreconCompanyService.getAllFocus().then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/companies', function (req, res) {
  careerreconCompanyService.addCompanies(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/companies/:id', function (req, res) {
  careerreconCompanyService.getCompanyData(req.params.id).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/update/company', function (req, res) {
  careerreconCompanyService.updateCompany(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/delete/coompany/:id', function (req, res) {
  careerreconCompanyService.deleteCompanyData(req.params.id).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/company/logo', function (req, res) {
  careerreconCompanyService.updateCompanyLogoData(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/careerrecon/bulkimport', function (req, res) {
  careerreconCompanyService.insertCompanyData().then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'company not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

// Return router
module.exports = router;
