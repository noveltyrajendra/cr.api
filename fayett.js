let Client = require('ssh2-sftp-client');
let sftp = new Client();
const fs = require('fs')
const { collegeConstant } = require('./constants/integrationConstants')
//let json2csv = require('json2csv').parse;
//let moment = require('moment');

example();

async function example() {
  /*var data =  [
    {
      "First Name": "test",
      "Last Name": "test",
      "Email": "test@test.com",
      "Address": "",
      "City": "",
      "State": "AL",
      "Postal Code": "12345",
      "Phone Number": "9805467812",
      "Military Status": "Veteran",
      "Military Branch": "Army",
      "Military Rank": "E-4",
      "Degree Level": "Bachelor's degree",
      "Degree Field": "Business, Marketing & Communications",
      "Area of Study": "Accounting & Finance",
      "JST": 'no',
      "Date Created": moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }
  ];
    const rowsWithHeader = json2csv(data, { header: true });
    fs.writeFileSync(
      `csv/fayetteville-test.csv`,
      rowsWithHeader
    );*/
    const config   = {
        //host: 'sftp.admissionpros.com',
        //port: '22',
        //username: 'fsuuser',
        // host: 'ft.technolutions.net',
        // port: '22',
        // username: 'college_recon_leads@apply.kent.edu',
        ...collegeConstant.KENT_STATE.additionalParameters,
        privateKey: fs.readFileSync( '/home/novelty/.ssh/id_rsa'),
        debug: (msg) => {
          //if (msg.startsWith('CLIENT')) {
            console.error(msg);
          //}
        }
      }
      
      //console.log("TT:",config.privateKey);
      await sftp.connect(config);
      // if(connectToSftp) {
      await sftp.fastPut(
        `csv/kent-state-veterans_1657387499118.csv`,
        `/incoming/collegerecon/kent-state-veterans_1657387499118.csv`
      );
      // } else {
      //   console.log('SFTP Connected doesnt return anything')
      // }
      sftp.end();
      // sftp.connect(config).then(async () => {
      //     console.log("SFTP Connected:");
      //     return sftp.list('/incoming/collegerecon');
      // }).then(data => {
      //   if(data){
      //     console.log("Exist:",data);
      //   }else{
      //     console.log("NotExist");
      //   }
      // }).then(async () => {
      //   await sftp.fastPut(
      //     `csv/kent-state-veterans_1657387499118.csv`,
      //     `/incoming/collegerecon/kent-state-veterans_1657387499118.csv`
      //   );
      //   console.log("SFTP file uploaded:")
      //   sftp.end();
      // })
      // .catch(err => {
      //   console.error(err.message);
      // });
}