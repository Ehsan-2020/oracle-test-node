process.env.ORA_SDTZ = 'UTC';
const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
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
		let sql, binds, options, result;
		console.log(`Opening Connection to the oracle db with below config`);
		console.dir(dbConfig);
		connection = await oracledb.getConnection(dbConfig);
		console.log('Obtained connection ! ');
		const stmt = await connection.execute(`select count (*) from sys.all_objects`);
		   console.log("resultArrayFormat", stmt)
		console.log(connection);
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
