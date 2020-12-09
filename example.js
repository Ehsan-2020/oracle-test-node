process.env.ORA_SDTZ = 'UTC';
const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const numRows = 10;  // number of rows to return from each call to getRows()

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
        console.log(`Opening Connection to the oracle db with below config`);
        console.dir(dbConfig);
        connection = await oracledb.getConnection(dbConfig);
        console.log('Obtained connection ! ');
        let fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 100);
        const result = await connection.execute(`BEGIN
               PMCLDB.fetchcustomeraccountstatement(:inloginid, :infromdate, :intodate, :outcursor, :outresponsecode);
             END;`,
            {
                inloginid: '03079770309', // Bind type is determined from the data.  Default direction is BIND_IN
                infromdate: '01-OCT-2020',
                intodate: '22-NOV-2020',
                outcursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                outresponsecode: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 80 }
            });
        // const stmt = await connection.execute(`select * from CUSTOMERACCOUNTSTATEMENT`);

        console.log("resultArrayFormat", result)

        console.log("Cursor metadata:");
        console.log(result.outBinds.outcursor.metaData);



        const resultSet = result.outBinds.outcursor;
        let rows = await resultSet.getRows(); // get numRows rows at a time
            if (rows.length > 0) {
                console.log("getRows(): Got " + rows.length + " rows");
                console.log(rows);
            }

        // always close the ResultSet
        await resultSet.close();

        res.json({ success: true });


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
