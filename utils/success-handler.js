const successHandler = (res, data, message = '') => {
  res.status(200).json({ success: true, data, message });
};

module.exports = {
  successHandler,
};
