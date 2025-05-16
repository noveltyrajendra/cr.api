let constantContactService = (function() {

  let Client = require('constantcontact');
  let client = new Client();
  client.useKey("zfr5u7gs8kndtaqa4n892rmc");
  client.useToken("1a80701b-34fd-4994-8461-834473ac201d");

  function addUser(contact){
    return new Promise(function(resolve, reject) {
      client.contacts.post(contact, true, function (err, res) {
        if (err) { resolve(err); }
        resolve("success");
      });
    });
  }

  return {
    addUser: addUser,
  }

})();

module.exports = constantContactService;