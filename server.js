//server.js
//this motherfucker MUST be at the top, especially above anything that requires database access
import dotenv from 'dotenv'; 
dotenv.config();

import express from "express";

//use these constantly
import { createDatabasePool } from "./src/js/server-utils.js";
import { startRipDeckDataInterval } from "./src/new_rips/decks.mjs";

//only use these as new releases come out
// import { updatePackData } from "./src/new_rips/packs.mjs";
// import { updateCardData, updateCardUrl } from "./src/new_rips/cards.mjs";
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

async function queryWithRetry(pool, procedureCall, queryParameters = [], retries = 3) {
  while (retries--) {
    try {
      return await pool.query(procedureCall, queryParameters);
    } catch (err) {
      if (err.code === 'ECONNRESET' && retries > 0) {
        console.error('Connection reset by server, retrying...');
        await delay(3000); // delay for 3 seconds before retrying
        continue;
      }
      throw err; // if it's not ECONNRESET or no retries left, rethrow
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



app.get('/api/calculate-synergy', asyncHandler(async (req, res) => {
  const { herocode, heroAspect, percentageType, history, packs } = req.query;
  const isSynergy = percentageType == "synergy";
  const synPerc = isSynergy ? true : false;
  let procedureCall;
  let queryParameters;
  if (herocode == "21031a") {
    procedureCall = 'CALL CalculateAdamWarlockSynergy(?, ?, ?)';
    queryParameters = [synPerc, history, packs];
  } else if (herocode == "33001a" || herocode == "18001a" || herocode == "40001a") { //Cyclops, Gamora, and Cable
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
    // console.log(procedureCall);
    // console.log(queryParameters);
    // Execute the procedure with the appropriate parameters
    const result = await queryWithRetry(pool, procedureCall, queryParameters);
    // console.log(result);  // Let's see what this logs
  
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


// ripDeckData(connection)

// setInterval(() => {
//   pool.query('SELECT 1', (err) => {
//     if (err) {
//       console.error('Error pinging database:', err);
//     } else {
//       console.log('Pinged database successfully.');
//     }
//   });
// }, 2 * 60 * 1000);  // Ping every 2.5 minutes


// const twoDaysAgo = new Date();
// twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
// const formattedDate = twoDaysAgo.toISOString().slice(0, 10);



// const query = 'SELECT pack_code FROM packs';
// connection.query(query, (error, results) => {
//   if (error) throw error;
//   // Loop through results and call function for each pack code
//   results.forEach((result, index) => {
//     const packCode = result.pack_code;
//     // Set a timeout for each call to updateTraits
//     setTimeout(() => {
//       updateTraits(connection, packCode);
//     }, index * 30000); // Delay each call by 60 seconds
//   });
// });


// const query = 'SELECT pack_code FROM packs';
// connection.query(query, (error, results) => {
//   if (error) throw error;
//   // Loop through results and call function for each pack code
//   results.forEach((result, index) => {
//     const packCode = result.pack_code;
//     // Set a timeout for each call to updateTraits
//     setTimeout(() => {
//       updateVillainSets(connection, packCode);
//     }, index * 15000); // Delay each call by 60 seconds
//   });
// });











//here lies the gaggle of junk we need to do as new releases come out



// updatePackData(connection);

// updateCardData(connection, "angel");

//also will have to manually insert new heroes into hero_names.json (probably the only JSON we're keeping)
// updateHeroData(connection);


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




