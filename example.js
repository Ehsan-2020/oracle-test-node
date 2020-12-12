process.env.ORA_SDTZ = 'UTC';
const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const moment = require('moment');
const numRows = 1000;  // number of rows to return from each call to getRows()

// On Windows and macOS, you can specify the directory containing the Oracle
// Client Libraries at runtime, or before Node.js starts.  On other platforms
// the system library search path must always be set before Node.js is started.
// See the node-oracledb installation documentation.
// If the search path is not correct, you will get a DPI-1047 error.
//
// oracledb.initOracleClient({ libDir: 'C:\\instantclient_19_8' });                            // Windows
// oracledb.initOracleClient({ libDir: '/Users/your_username/Downloads/instantclient_19_8' }); // macOS
async function run(req, res) {
    let connection;
    try {
        const { query } = req;

        if (!query.customerMobileNumer)
            res.json({ success: false, message: "Please provide customer's mobile number as query parameter" });

        console.log(`Opening Connection to the oracle db with below config`);
        connection = await oracledb.getConnection(dbConfig);
        console.log('Obtained connection ! ');

        const result = await connection.execute(`BEGIN
               PMCLDB.fetchcustomeraccountstatement(:inloginid, :infromdate, :intodate, :outcursor, :outresponsecode);
             END;`,
            {
                inloginid: query.customerMobileNumer, // Bind type is determined from the data.  Default direction is BIND_IN
                infromdate: query.startDate ? moment(query.startDate).format('DD-MM-YYYY') : moment().subtract(90, "days").format('DD-MM-YYYY'),
                intodate: query.endDate ? moment(query.endDate).format('DD-MM-YYYY') : moment().format('DD-MM-YYYY'),
                outcursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                outresponsecode: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 80 }
            });
        // const stmt = await connection.execute(`select * from CUSTOMERACCOUNTSTATEMENT`);

        console.log("resultArrayFormat", result)

        console.log("Cursor metadata:");
        console.log(result.outBinds.outcursor.metaData);
        const resultSet = result.outBinds.outcursor;
        let rows = await resultSet.getRows(numRows); // get numRows rows at a time

        // always close the ResultSet
        await resultSet.close();
        let resultArrayFormat = rows.map(row => ({
            'Transaction ID': row[1],
            'Transaction DateTime': row[0],
            'Transaction Type': row[2],
            'Channel': row[3].split(',')[0].split(':')[1].trim(),
            'Description': row[3],
            'Debit': row[4],
            'Credit': row[5],
            'Remaining Balance': row[6]

        }))
        if (query.isStringify) {
            let sumBalance = 0.00;
            let sumCredit = 0.00;
            let sumDebit = 0.00;
            // console.log();
            rows.forEach((row) => {
                sumDebit += parseFloat(row[4]);
                sumCredit += parseFloat(row[5]);
                sumBalance += parseFloat(row[6]);
            });
            resultArrayFormat.push(["Total", "", "", "", "", "", sumDebit.toFixed(2), sumCredit.toFixed(2), sumBalance.toFixed(2)]);
            return resultArrayFormat.join('\n');
        }

        res.json({ success: true, data: resultArrayFormat });


    } catch (err) {
        console.log('An error occurred');
        console.error('ERROR 1', err);
        res.status(400).send(err);
    } finally {
        if (connection) {
            console.log('Finally closing connection !');
            try {
                await connection.close();
            } catch (err) {
                console.error('EEROR 2', err);
                res.status(400).send(err);
            }
        }
    }
}
module.exports.run = run;
