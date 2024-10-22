const express = require('express');
const path = require('path');
const os = require('os');
var xlsx = require('node-xlsx');
const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const bodyParser = require('body-parser')
const slugify = require('slugify')
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const ejs = require('ejs');
const multer = require('multer');
const csv = require('csv-parser');
const upload = multer({ dest: 'uploads/' }).single('csv');
// const upload = multer({ dest: 'uploads/' }); // Directory to store uploaded files
const DELETE_TIMEOUT = 600000;

var newpdf = require("pdf-creator-node");
const fsExtra = require('fs-extra');

var rows = [];
var writeStr = "";


const {fetch_data} = require('./controllers/messages.controller');

const friendsRouter = require('./routes/friends.routes');

const messagesRouter = require('./routes/messages.routes');
const { response } = require('express');

process.env.OPENSSL_CONF = '/dev/null';
const app = express();

// Set up Handlebars
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'index',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }))

// Define a route
app.get('/', (req, res) => {
  res.render('home');
});


const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0'); // add leading zero if necessary
const day = String(date.getDate()).padStart(2, '0'); // add leading zero if necessary

const folderName = `${year}-${month}-${day}`;
// const downloadDir = app.getPath('downloads');
// const downloadDir = path.join(os.homedir(), 'Downloads');
const downloadDir = path.join(__dirname, 'temp');

console.log(`Folder "${folderName}" created successfully in "${downloadDir}"`);

fs.mkdir(`${downloadDir}/${folderName}`, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Folder "${folderName}" created successfully in "${downloadDir}"`);
  }
});

app.get('/xls-to-csv', (req, res) => {
  res.render('xls-to-csv');
});


app.post('/xls-to-csv', upload, async (req, res) => {
  const file = req.file;
  console.log('File details: ', file);

  // Check if a file was uploaded
  if (!file) {
    return res.status(400).render('xls-to-csv', { error: 'No XLS file was uploaded!' });
  }

  
  // Parse the uploaded XLS file using file.path
  var obj = xlsx.parse(file.path); 

  var rows = [];
  var writeStr = '';

  // Looping through all sheets
  for (var i = 0; i < obj.length; i++) {
    var sheet = obj[i];
    // Loop through all rows in the sheet
    for (var j = 0; j < sheet['data'].length; j++) {
      // Add the row to the rows array
      rows.push(sheet['data'][j]);
    }
  }

  // Creates the CSV string to write it to a file
  for (var i = 0; i < rows.length; i++) {
    writeStr += rows[i].join(",") + "\n";
  }


  const uploadedFilePath = file.path; // Full path of the uploaded file
  const csvFileName = `converted_${Date.now()}.csv`; // Generate a unique CSV file name
  const outputFolderPath = path.join(__dirname, 'uploads'); // Full path for the generated CSV file
  const outputFilePath = path.join(outputFolderPath, csvFileName); // Full path for the generated CSV file


  // Optionally, write the CSV to a file if you want
  // const outputFilePath = __dirname + '/uploads/output22.csv';
  fs.writeFileSync(outputFilePath, writeStr, 'utf8');

  // Delete the uploaded XLS file after processing
  // fs.unlinkSync(file);

  // res.status(200).json({ success: 'File converted successfully!', downloadPath: `/uploads/${outputFilePath}` });

  // Send a success response, optionally returning the CSV data or path to the user
  res.status(200).render('xls-to-csv', { success: 'File uploaded and converted to CSV successfully!', downloadPath: `${csvFileName}` });


  // Set a timeout to delete the file after 1 minute
  setTimeout(() => {
      const uploadsFolder = path.join(__dirname, 'uploads');
      
      // Read all files in the uploads folder
      fs.readdir(uploadsFolder, (err, files) => {
          if (err) {
              console.error('Error reading the uploads folder:', err);
              return;
          }

          // Loop through and delete each file
          files.forEach((file) => {
              const filePath = path.join(uploadsFolder, file);
              
              // Delete each file
              fs.unlink(filePath, (err) => {
                  if (err) {
                      console.error(`Error deleting file ${file}:`, err);
                  } else {
                      console.log(`File ${file} deleted from uploads folder.`);
                  }
              });
          });
      });
  }, DELETE_TIMEOUT);


});



// Route to handle CSV download
app.get('/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'uploads', fileName);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});




app.get('/biometric-calculations', (req, res) => {
  res.render('biometric-calculations');
});

app.get('/generate-salary-slips', (req, res) => {
  res.render('generate-salary-slips');
});

// Set up a route that will trigger a server crash
app.get('/crash', (req, res) => {
    throw new Error('Server crashed!');
});
  
 // Set up an uncaughtException event listener to log the error to a file
process.on('uncaughtException', (err, origin) => {
  const errorLogPath = path.join(__dirname, 'error.log');
  const errorMessage = `Error: ${err}\nOrigin: ${origin}\nStack Trace: ${err.stack}\n`;
  fs.appendFile(errorLogPath, errorMessage, (error) => {
    if (error) console.error(error);
    process.exit(1);
  });
});

app.post('/generate-salary-slips', upload, (req, res) => {

    
  const file = req.file;
  console.log('results ', file)
  // return false;
  if (!file) {
    return res.render('index', { error: 'No CSV file was uploaded!' });
  }
  if (!['text/csv', 'application/csv'].includes(file.mimetype)) {
    return res.render('index', { error: 'Only CSV files are allowed!' });
  }

  const results = [];
  const arr = [];
  fs.createReadStream(req.file.path)
    .pipe(csv({ headers: true }))
    // .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      fs.unlinkSync(req.file.path); // delete the file after reading it
      results.forEach((row, index) => {
        if(index > 0){
          console.log(row._1);
        }
        arr.push(row._1);
      });

      const resultsJSON = JSON.stringify(results);

      console.log('resultsJSON', resultsJSON);

      res.render('generate-salary-slips', { results: resultsJSON, arr: arr});

    });
});



function zipFolder(sourceFolder, outPath) {
  return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', {
          zlib: { level: 9 } // Set the compression level
      });

      output.on('close', async () => {
          console.log(`Archive created successfully. Total bytes: ${archive.pointer()}`);
          try {
              await fsExtra.remove(sourceFolder); // Remove the source folder
              console.log('Source folder deleted successfully.');
              resolve();
          } catch (err) {
              reject(`Error deleting source folder: ${err}`);
          }
      });

      archive.on('error', (err) => {
          reject(err);
      });

      archive.pipe(output);

      archive.directory(sourceFolder, false);

      archive.finalize();
  });
}

// POST endpoint to zip a folder
app.post('/make-zip', (req, res) => {
  const sourceFolderPath = req.body.sourceFolderPath;
  const zipFilePath = req.body.zipFilePath;

  if (!sourceFolderPath || !zipFilePath) {
      return res.status(400).json({ error: 'sourceFolderPath and zipFilePath are required' });
  }

  setTimeout(() => {
      zipFolder(sourceFolderPath, zipFilePath)
          .then(() => {
              console.log('Folder zipped and source folder deleted successfully.');
              res.status(200).json({ message: 'Folder zipped and source folder deleted successfully.', href: zipFilePath });
          })
          .catch((err) => {
              console.error('Error zipping folder:', err);
              res.status(500).json({ error: 'Error zipping folder' });
          });
  }, 3000); // 3 seconds delay
});

app.get('/download', (req, res) => {
  const { filePath } = req.query;
  const fullPath = path.resolve(filePath);

  // Check if the file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(err);
      res.status(404).send('File not found');
    } else {
      // Set headers to force download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(fullPath)}"`);

      // Create a read stream from the file and pipe it to the response
      const fileStream = fs.createReadStream(fullPath);
      fileStream.on('error', (err) => {
        console.error(err);
        res.status(500).send('Error reading file');
      });
      fileStream.pipe(res);
    }
  });
});




// app.use(bodyParser.json());

// app.set('view engine', 'hbs');
// app.set('views', path.join(__dirname, 'views'));

const PORT = 3000;

// middleware
app.use((req, res, next) => {
    const start = Date.now();
    next();
    //actions go here......
    const delta = Date.now() - start;
    console.log(`${req.method} ${req.baseUrl}${req.url}  ${delta}ms `);

})



// friends router start==================================start=====================================================



app.use('/friends', friendsRouter );
app.use('/messages', messagesRouter );

// friends router end==================================end=====================================================

app.get('/', (req, res) => {
    res.render('index', {
        title: 'Express.js Matery',
        caption: 'let\'s go',
    });
});

app.get('/single', (req, res) => {
    
    res.render('single', {
        title: 'Single Post',
        currentRoute: '/single',
    });
});


app.get('/all', (req, res) => {
    res.render('all', {
        title: 'All Post',
        caption: 'let\'s go',
        currentRoute: '/all',

    });
});
app.get('/all-links-only', (req, res) => {
    res.render('all-links-only', {
        title: 'All Links Only',
        caption: 'let\'s go',
        currentRoute: '/all',

    });
});




 app.post('/demo', function(req, res) {
    const data = {
      id: 1,
      message: 'Hello from server!'
    };
    res.json(data);
  });






app.listen(PORT, () => {
    console.log(`Listing on  app ${PORT} .....`);
} )