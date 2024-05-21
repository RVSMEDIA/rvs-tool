const express = require('express');
const path = require('path');
const os = require('os');
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
var newpdf = require("pdf-creator-node");
const puppeteer = require('puppeteer');

const {fetch_data} = require('./controllers/messages.controller');

const friendsRouter = require('./routes/friends.routes');

const messagesRouter = require('./routes/messages.routes');
const { response } = require('express');

const api_key = 'D7H8FOFSDV5607BVG0X98IL3XRTCVZNTXFC6U3SGC0P70D6H2IRDFI2WEF9PZECCMFJ9SC946S4G3FOP';

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


function createSlug(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
           .replace(/\s+/g, '-') // collapse whitespace and replace by -
           .replace(/-+/g, '-'); // collapse dashes

  return str;
}


const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // add leading zero if necessary
  const day = String(date.getDate()).padStart(2, '0'); // add leading zero if necessary

  const folderName = `${year}-${month}-${day}`;
  // const downloadDir = app.getPath('downloads');
  const downloadDir = path.join(os.homedir(), 'Downloads');

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
      });

      const resultsJSON = JSON.stringify(results);

      console.log(resultsJSON);

      res.render('generate-salary-slips', { results: resultsJSON});

    });
});


app.post('/create-html', function(req, res) {

  // Render the Handlebars template with the data
  const dd = req.body.data;
  const id = req.body.id;
  const headers = req.body.headers;
  const data =  {
    data: dd,
    headers: headers,
    image_url: 'http://localhost:3005/logo.png',
  };


  
  console.log(data._1)
  // res.send(data);
  
  // const template = fs.readFileSync('template.ejs', 'utf-8');

  const templatePath = path.join(__dirname, 'template.ejs');

  const template = fs.readFileSync(templatePath, 'utf-8');
  
  const html = ejs.render(template, data);
  
  // res.send(html)
  
  var EmployeName = dd._1
  var slipmonth = dd._0
  EmployeName = createSlug(EmployeName)
  slipmonth = createSlug(slipmonth)
  var pdfFileName = `${downloadDir}/${folderName}/${EmployeName}-${slipmonth}.pdf`
  var output = `${downloadDir}/${folderName}/`

  // const filePath = 'render.html';
  const filePath = path.join(__dirname, 'render.html');

  // fs.writeFile(filePath, html, (err) => {
  //   if (err) {
  //     console.error(err);
  //   } else {
  //     console.log(`File "${filePath}" written successfully`);
  //   }
  // });

  // const options = {
  //     format: 'Letter',
  //     border: {
  //       top: '1px',
  //       right: '1px',
  //       bottom: '1px',
  //       left: '1px'
  //     },
  //     footer: {
  //       height: '15mm',
        
  //     }
  //   };

  // var options = {
  //       format: "A4",
  //       orientation: "portrait",
  //       border: "8mm",
  //       header: {
  //           height: "20mm",
  //       },
  //       // footer: {
  //       //     height: "20mm",
  //       //     contents: {
  //       //         default:'<p style="color: black; font-family:"Calibri Light", sans-serif; font-style: italic; font-weight: normal; text-decoration: underline; font-size: 10pt;">This is a system generated pay slip and does not require signature</p>'
  //       //     }
  //       // }
  //   };

  // var readhtml = fs.readFileSync('render.html', "utf8");

  // var document = {
  //   html: readhtml,
  //   data: {},
  //   path: pdfFileName,
  //   type: "",
  // };


  // pdf.create(html, options).toFile(pdfFileName, (err, res) => {
  //   if (err) return console.log(err);
  //   console.log(res); // { filename: '/app/businesscard.pdf' }
  // });

  // newpdf
  // .create(document, options)
  // .then((res) => {
  //   console.log('res', res);
  // })
  // .catch((error) => {
  //   console.error(error);
  // });

  fs.writeFile(filePath, html, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`File "${filePath}" written successfully`);
  
      // Read the file content and proceed with the code
      var readhtml = fs.readFileSync(filePath, 'utf8');
  
      var options = {
        format: "A4",
        orientation: "portrait",
        border: "8mm",
        header: {
          height: "20mm",
        },
      };
  
      var document = {
        html: readhtml,
        data: {},
        path: pdfFileName,
        type: "",
      };
  
      newpdf
        .create(document, options)
        .then((res) => {
          console.log('res', res);
        })
        .catch((error) => {
          console.error(error);
        });
  
      res.send({
        'pdfFileName': pdfFileName,
        'id': id,
        'output' : output
      });
    }
  });



  // res.send({
  //   'pdfFileName' : readhtml,
  //   'id' : id,
  // })

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







app.post('/single', async(req, res) => {


const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const folderName = `${year}-${month}-${day}`;


if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
    console.log(`Created folder: ${folderName}`);
  } else {
    console.log(`Folder ${folderName} already exists.`);
  }

    const { url } = req.body


    const result = await fetchData(url);
  //   res.send(result);

  // console.log('result=====================', result);
  // return;


    fetchUrl(url)
        .then(response => {
          // console.log(`Fetch data : ${response}`)
          // console.log(response.firstName)

          const title = response.title;
          const readMdfile = response.readfile;


          const getmdfile_content = fs.readFileSync(readMdfile, 'utf-8');


          res.render('single', {
            title: 'Single post',
            postname: title,
            caption: 'File written successfully',
            article: getmdfile_content,
            currentRoute: '/single',
    
          });


        })
        .catch(err => {
          console.log(err)
        })


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


app.post('/all-links-only', async(req, res) => {
  const { url } = req.body
    // Do something with the form data, such as sending an email
    const response = await axios.get(url);
    const data = response.data;
    var $ = cheerio.load(data);
    const arr = [];
    // Use Cheerio selectors to extract data from the HTML
    $('h3.post__title.typescale-2').each((i, element) => {
        const links = $(element).find('a');
        const href = links.attr('href');
        arr.push(href);
    });  


    res.render('all-links-only', {
      title: 'All Post',
      arr: arr,
      currentRoute: '/all-links-only',
      filenames: filenames,
  });

});


app.post('/url', async function(req, res) {
  // Extract data from request body
  const url = req.body.url;
  const id = req.body.id;
  
  // Do something with the data
  console.log('url: ' + url);
  console.log('id: ' + id);
  
  var dd = await fetchData(url);

  console.log('dd', url)
  console.log('title', dd.title)
  // res.send({id: dd.id, title: dd.title});
  
  var md = await fetchUrl(url)
  .then( (response)=>{
    console.log('ddddd '+ response);
    // console.log('ddddd title '+ response.title);
    res.send({id: id, title: response.title});

  })
  .catch((err) => {
    console.log(err);
  });
  

});



app.post('/all', async(req, res) => {
  
  const { url } = req.body

  await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
          'api_key': api_key,
          'url': url,  
      } 
  }).then(function (response) {
      // handle success
      const data = response.data;
      // console.log(data);
    
        // return;
        // Do something with the form data, such as sending an email
        // const response = await axios.get(url);
        // const data = response.data;
        var $ = cheerio.load(data);
        const arr = [];
        // Use Cheerio selectors to extract data from the HTML
        $('h3.post__title.typescale-2').each((i, element) => {
            // console.log($(element).text());
            const links = $(element).find('a');
            const href = links.attr('href');
            // console.log(href);
            arr.push(href);
        });
        // res.send( `${arr}`);


        // all foreach start

        const filenames = [];

        arr.forEach((url , index) => {
          
          setTimeout( () => {
          

          }, index * 5000 );

        });

        res.render('all', {
            title: 'All Post',
            arr: arr,
            currentRoute: '/all',
            filenames: filenames,
        });


    
    }).catch(function (error) {
      // handle error
      console.error(error);
    });


});

/////////////////////////////////////////////////////////////////////

async function fetchData(url) {
  try {
      const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
          params: {
              'api_key': api_key,
              'url': url,  
          } 
      });
      return response.data;
  } catch (error) {
      // Handle error
      console.error(error);
      throw error; // Rethrow the error to handle it outside the function
  }
}


/////////////////////////////////////////////////////////////////////

async function fetchUrl(url){

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const folderName = `${year}-${month}-${day}`;
  
  
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
    console.log(`Created folder: ${folderName}`);
  } else {
    console.log(`Folder ${folderName} already exists.`);
  }

  const respon = await fetchData(url)
  const $ = cheerio.load(respon);
  // Use Cheerio to extract data from the HTML
  var title = $('title').text();

  console.log('fetchUrl = ', url);
  console.log('fetchUrl = title', title);

  title.replace(/[^a-zA-Z0-9]/g, '');

  const slug = slugify(title, {
    lower:true,
    strict:true
  });


  const body = $('.single-body').text();
        
  const quote = $('.quote').text();
  
  const imgUrl = 'https://codelist.cc'+$('.single-body img').attr('src');
  
  let body_data = body.replace(quote, "");
  let description = body_data.replace(/&/g, '');
        
  description = description.replace(/'/g, ''); 
  description = description.replace(/&/g, 'and');  

  // description.replace('&amp;','')
  // title.replace('&amp;','')
  
  const urls = quote.split('https');
  
  // Remove the empty string at the beginning of the array
  urls.shift();
  
  // Add the "https" prefix back to each URL
  for (let i = 0; i < urls.length; i++) {
    urls[i] = 'https' + urls[i];
  }
  
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString();
  const fileName = `${slug}.md`; // replace with your file name

    // Render the view with the constants data
    const template = Handlebars.compile(fs.readFileSync('views/samplemd.hbs', 'utf8'));

    const markdown = template({
      title: title,
      formattedDate: formattedDate,
      slug: slug,
      imgUrl: imgUrl,
      description: description,
      urls: urls,
  });
  
    // Write the Markdown file
    fs.writeFileSync(`${folderName}/${fileName}`, markdown);
    const readfile = `${folderName}/${fileName}`;
  
    const getmdfile_content = fs.readFileSync(readfile, 'utf-8');

    var data = {
       readfile: readfile,
       title: title,
    }
        
    return data;
    

}


// Loop through the URLs and fetch each one


app.get('/contact', (req, res) => {
    res.send(`
      <h1>Scrape</h1>
      <form method="post" action="/contact">
        <label for="url">URL:</label>
        <input type="text" id="url" name="url"><br>
        <input type="submit" value="Send">
      </form>
    `)
    res.render('form');
  })
  
  app.post('/contact', async(req, res) => {


  res.send('dddddd');
    const { url } = req.body
    // Do something with the form data, such as sending an email
    const codelisturl = 'https://codelist.cc/pg/3/';
    const response = await axios.get(codelisturl);
    const data = response.data;
    var $ = cheerio.load(data);
    const arr = [];
    // Use Cheerio selectors to extract data from the HTML
    $('h3.post__title.typescale-2').each((i, element) => {
        // console.log($(element).text());
        const links = $(element).find('a');
        const href = links.attr('href');
        // console.log(href);
        arr.push(href);
    });

// get current date with yy-mm-dd format

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  console.log(formattedDate);

const folderName = formattedDate;

if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
    console.log(`Created folder: ${folderName}`);
  } else {
    console.log(`Folder ${folderName} already exists.`);
  }

    // start for every single 
    const fruits = ['apple', 'banana', 'orange'];

    arr.forEach(async (codelist_url) => {
      
        var code_response = await axios.get(codelist_url);
        var code_data = code_response.data;

        var $ = cheerio.load(code_data);

        var title = $('h1.entry-title').text();

        var slug = slugify(title, {
          lower:true,
          strict:true
        });
        
        var body = $('.single-body').text();
        
        var quote = $('.quote').text();
        
        var imgUrl = 'https://codelist.cc'+$('.single-body img').attr('src');
        
        let description = body.replace(quote, "");
        
        
        var urls = quote.split('https');
        
        // Remove the empty string at the beginning of the array
        urls.shift();
        
        // Add the "https" prefix back to each URL
        for (let i = 0; i < urls.length; i++) {
          urls[i] = 'https' + urls[i];
        }
        
        var currentDate = new Date();
        var formattedDate = currentDate.toISOString();
        
        console.log(formattedDate);
        
        
        // console.log(urls);

var content = `
---
title: ${title} 
date: ${formattedDate}
slug: ${slug}
image: ${imgUrl}
---
        
${description}
${urls.map((item) => `> [${item}](${item})`).join('\n')}
`;
        
        console.log('asdasd')
        
        var fileName = `${slug}.md`; // replace with your file name
        
        
        // fs.writeFile(`${folderName}/${fileName}`, content, (err) => {
        //   if (err) throw err;
        //   console.log('The file has been saved!');
        // });
        



    });




    // end for every single 
    







    // console.log('url => ', arr)
    res.render('codelist', {
        url: url,
        href: arr,
    });
    // res.send(`Thanks for contacting us! ${url}`)



    
  })


  app.get('/demo2', async function(req, res) {
      try {
          // Call the asynchronous function and await the result
          const result = await fetchData('https://codelist.cc/scripts3/252895-saas-theme-for-premium-url-shortener-v55.html');
          console.log('result=====================', result);
          res.send(result); // Send the result back to the client
      } catch (error) {
          // Handle error
          console.error(error);
          res.status(500).send('Internal Server Error'); // Send an error response
      }
  });

 app.post('/demo', function(req, res) {
    const data = {
      id: 1,
      message: 'Hello from server!'
    };
    res.json(data);
  });






app.listen(PORT, () => {
    console.log(`Listing on ${PORT} .....`);
} )