//server.js
//this guy MUST be at the top, especially above anything that requires database access
import dotenv from 'dotenv'; 
dotenv.config();
import express from "express";
//testing python backup
// import { exec }  from "child_process";

//use these constantly
import { createDatabasePool, queryWithRetry } from "./src/js/server-utils.js";
import { startRipDeckDataInterval } from "./src/new_rips/decks.mjs";

//only use these as new releases come out
// import { updatePackData } from "./src/new_rips/packs.mjs";
// import { updateCardData } from "./src/new_rips/cards.mjs";
// import { updateHeroData } from "./src/new_rips/heroes.mjs";
// import { updateTraits } from "./src/new_rips/traits.mjs";
// import { updateVillainSets } from "./src/new_rips/villains.mjs";

const app = express();
app.use(express.static("src"));


// Global Error Handler - This middleware function is for handling errors globally.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const pool = createDatabasePool();

// Handling pool or connection errors. It's essential to have this to catch connection errors.
pool.on('error', (err) => {
  console.error('Unexpected error on idle database connection:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      pool = createDatabasePool(); // Recreate the pool if connection lost
  } else {
      throw err; // throw error if it's another type of error
  }
});

// Middleware to handle async/await errors. It catches errors and passes them to the global error handler.
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


app.post('/increment-visit-count', asyncHandler(async (req, res, next) => {
  await queryWithRetry(pool, 'UPDATE visit_count SET count = count + 1 WHERE id = 1');
  res.status(200).send('Visit count incremented');
}));


app.get('/visit-count', asyncHandler(async (req, res) => {
  // console.log("Visit count endpoint hit");
  try {
    // Destructuring to get the rows array
    const [rows] = await queryWithRetry(pool, 'SELECT count FROM visit_count WHERE id = 1');
    // console.log("Query result:", rows);

    if (rows.length > 0) {
      // console.log("Visit count:", rows[0].count);
      res.json({ visitCount: rows[0].count });
    } else {
      // console.log("No rows found in visit_count table");
      res.status(404).send('No visit count data found');
    }
  } catch (error) {
    console.error('Error fetching visit count:', error);
    res.status(500).send('Error fetching visit count');
  }
}));


app.get('/api/calculate-synergy', asyncHandler(async (req, res) => {
  const { herocode, heroAspect, percentageType, history, packs } = req.query;
  const isSynergy = percentageType == "synergy";
  const synPerc = isSynergy ? true : false;
  let procedureCall;
  let queryParameters;
  if (herocode == "21031a") {
    procedureCall = 'CALL CalculateAdamWarlockSynergy(?, ?, ?)';
    queryParameters = [synPerc, history, packs];
  } else if (herocode == "33001a" || herocode == "18001a" || herocode == "40001a" || herocode == "50001a") { //Cyclops, Gamora, Maria Hill, and Cable
    procedureCall = 'CALL CalculateCyclopsSynergy(?, ?, ?, ?, ?)';
    queryParameters = [herocode, heroAspect, synPerc, history, packs];
  } else if (herocode == "04031a") {
    procedureCall = 'CALL CalculateSpiderWomanSynergy(?, ?, ?, ?)';
    queryParameters = [heroAspect, synPerc, history, packs];
  } else {
    procedureCall = 'CALL CalculateSynergy(?, ?, ?, ?, ?)';
    queryParameters = [herocode, heroAspect, synPerc, history, packs];
  }
  try { 
    // console.log(queryParameters);
    const result = await queryWithRetry(pool, procedureCall, queryParameters);
    const [rows, fields] = result;  // Then, if the result is as expected, you can destructure it
    res.json(rows[0]);
  } catch (error) {
    console.error(error); // Logging the error for debugging.
    res.status(500).json({ error: 'Internal Server Error' }); // Responding with a 500 status code and a generic error message.
  }
}));


app.get('/api/aspect-name', asyncHandler(async (req, res) => {
  const aspect = req.query.aspect;
  const procedureCall = `SELECT aspect_name FROM aspects WHERE aspect_id = ?`;
  const queryParameters = [aspect];
  try {
    const [rows, fields] = await queryWithRetry(pool, procedureCall, queryParameters);
    res.json(rows[0]);
  } catch (error) {
    console.error(error); // Logging the error for debugging.
    res.status(500).json({ error: 'Internal Server Error' }); // Responding with a 500 status code and a generic error message.
  }
}));


app.get('/api/get-packs', asyncHandler(async (req, res) => {
  const procedureCall = `SELECT * FROM packs`;
  try {
    // Using pool.query instead of pool.execute for non-parameterized queries.
    // Also, since you're using the Promise-based client, you should await the query instead of passing a callback.
    const [result, fields] = await queryWithRetry(pool, procedureCall);
    // Check if the result is present and not empty.
    if (!result || result.length === 0) {
      throw new Error('No result returned from the query or the table is empty.');
    }
    // If everything's fine, send back the result.
    res.json(result);
  } catch (error) {
    console.error(error); // Logging the error for debugging purposes.
    res.status(500).json({ error: 'Internal Server Error' }); // Responding with a 500 status code and a generic error message.
  }
}));


app.get('/api/staples', asyncHandler(async (req, res) => {
  const { aspect, history } = req.query;
  const procedureCall = `CALL StapleCounts(?, ?)`;
  const queryParameters = [aspect, history];
  try {
    // Execute the procedure with the appropriate parameters
    const [rows, fields] = await queryWithRetry(pool, procedureCall, queryParameters);
    res.json(rows[0]);
  } catch (error) {
    console.error(error); // Logging the error for debugging.
    res.status(500).json({ error: 'Internal Server Error' }); // Responding with a 500 status code and a generic error message.
  }
}));

// I begin with a call of ripDeckData() before setting the timer
startRipDeckDataInterval(pool); 

app.listen(3000, function() {
  console.log("Server listening on port 3000");
}); 


// Function to call the Python backup script
// function performBackup() {
//   console.log("Attempting backup");
//   exec('python src/python/backup.py', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`exec error: ${error}`);
//       return;
//     }
//     console.log(`stdout: ${stdout}`);
//     console.error(`stderr: ${stderr}`);
//   });
// }





//here lies the gaggle of junk we need to do as new releases come out


// performBackup(); // Backup the database before anything else happens

// updatePackData(pool);

// updateCardData(pool, "hercules");

// also will have to manually insert new heroes into hero_names.json (probably the only JSON we're keeping)
// before running this file and separately running json/photo.py
// updateHeroData(pool);
















//do not take this baby out of storage unless we need to repopulate the entire database
//this will grab every card from every pack in the game and take several minutes
//2463 worth of entries

// updatePackData(connection)
// .then(() => {
//   const query = 'SELECT pack_code FROM packs';
//   connection.query(query, (error, results) => {
//     if (error) throw error;
//     // Loop through results and call function for each pack code
//     results.forEach((result) => {
//       const packCode = result.pack_code;
//       updateCardData(connection, packCode);
//     });
//   });
// });

// updatePackData(connection)
// .then(() => {
//   const query = 'SELECT pack_code FROM packs';
//   connection.query(query, (error, results) => {
//     if (error) throw error;
//     // Loop through results and call function for each pack code
//     results.forEach((result) => {
//       const packCode = result.pack_code;
//       updateCardUrl(connection, packCode);
//     });
//   });
// });

// const startDate = new Date();
// startDate.setDate(startDate.getDate() - 60); // Set the start date 1000 days back

// //last date 2022-07-30
// //2021-12-17
// //310
// let currentDate = new Date(); // Start from the present day
// currentDate.setDate(currentDate.getDate() - 1); //except let's actually start with yesterday

// function task() {
//   if (currentDate >= startDate) {
//     const formattedDate = currentDate.toISOString().slice(0, 10);
//     ripDeckData(connection, formattedDate);
//     console.log(currentDate);

//     // Roll the date one day back
//     currentDate.setDate(currentDate.getDate() - 1); 

//     // Set a 60-second delay before the next iteration
//     //keep at 60000, 30000 was not enough
//     setTimeout(task, 6000);
//   }
// }

// // Start the loop
// task();