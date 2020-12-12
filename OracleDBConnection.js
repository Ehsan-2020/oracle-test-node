import responseCodeHandler from './responseCodeHandler';
import oracledb from 'oracledb';
import moment from 'moment';
import dbConfig from './oracleDbConfig.js';
import { logger } from '/util/';


class DatabaseConn {

    async getValue(customerMobileNumer, endDate, startDate, isStringify = false) {

        try {

            let connection;
            console.log(`Opening Connection to the oracle db with below config`);
            console.dir(dbConfig);
            connection = await oracledb.getConnection(dbConfig);
            console.log('Obtained connection ! ');

            const result = await connection.execute(`BEGIN
                   PMCLDB.fetchcustomeraccountstatement(:inloginid, :infromdate, :intodate, :outcursor, :outresponsecode);
                 END;`,
                {
                    inloginid: customerMobileNumer, // Bind type is determined from the data.  Default direction is BIND_IN
                    infromdate: moment(startDate).format('DD-MM-YYYY'),
                    intodate: moment(endDate).format('DD-MM-YYYY'),
                    outcursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                    outresponsecode: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 80 }
                });

            console.log("resultArrayFormat", result)

            const resultSet = result.outBinds.outcursor;
            let rows = await resultSet.getRows(1000); // get numRows rows at a time

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
            if (isStringify) {
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

            return resultArrayFormat;

        } catch (err) {
            logger.error('Database connection error' + err);
            return await responseCodeHandler.getResponseCode(config.responseCode.useCases.accountStatement.database_connection, err);
        }
    }

}

export default new DatabaseConn();