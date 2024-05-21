const express = require('express');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const bodyParser = require('body-parser')
const slugify = require('slugify')
const Handlebars = require('handlebars');


const puppeteer = require('puppeteer');

const {fetch_data} = require('./controllers/messages.controller');

const friendsRouter = require('./routes/friends.routes');

const messagesRouter = require('./routes/messages.routes');
const { response } = require('express');



const app = express();

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



app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

const PORT = 3000;

// middleware
app.use((req, res, next) => {
    const start = Date.now();
    next();
    //actions go here......
    const delta = Date.now() - start;
    console.log(`${req.method} ${req.baseUrl}${req.url}  ${delta}ms `);

})

app.use('/site', express.static(path.join(__dirname, 'public'))  );

app.use(express.json());

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



    await fetchUrl(url)
        .then(response => {
          // console.log(`Fetch data : ${response}`)
          console.log(response.firstName)

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


app.post('/url', function(req, res) {
  // Extract data from request body
  const url = req.body.url;
  const id = req.body.id;
  
  // Do something with the data
  console.log('url: ' + url);
  console.log('id: ' + id);
  
  
  var md = fetchUrl(url)
  .then( (response)=>{
    console.log('ddddd '+ response);
    res.send({id: id, title: response.title});

  })
  .catch((err) => {
    console.log(err);
  });
  

});



app.post('/all', async(req, res) => {
  
  const { url } = req.body

  axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
          'api_key': 'CNZZVEHVGDHXP3529XN77FUAWWKGCWKBDGPFMLVFLAMPF6U61GFZE985CV2Y4BLB8X7PJENPDSCR5BW7',
          'url': url,  
      } 
  }).then(function (response) {
      // handle success
      const data = response.data;
      console.log(data);
    }).catch(function (error) {
      // handle error
      console.error(error);
    });
    


// return;
    // Do something with the form data, such as sending an email
    const response = await axios.get(url);
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
    // res.send( `${arr}`);


    // all foreach start

    const filenames = [];

    arr.forEach((url , index) => {
      
      setTimeout( () => {
       
      //  var dd = fetchUrl(url)
      //   .then(ress => {
      //     console.log(ress.title)
      //   })
      //   .catch(err => {
      //     console.log(err)
      //   })
        // console.log(`Fetch data : ${dd}`);
        // filenames.push(res);

        // fs.writeFile(`error.log`, res, (err) => {
        //   if (err) throw err;
        //   console.log('The file has been saved!');
        // });

      //   res.render('all', {
      //     title: 'All Post',
      //     arr: arr,
      //     currentRoute: '/all',
      //     filenames: filenames,
  
      // });


      }, index * 5000 );

    });

    res.render('all', {
        title: 'All Post',
        arr: arr,
        currentRoute: '/all',
        filenames: filenames,
    });


});

/////////////////////////////////////////////////////////////////////




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

  const respon = await axios.get(url)
  const $ = cheerio.load(respon.data);
  // Use Cheerio to extract data from the HTML
  var title = $('h1.entry-title').text();

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

app.get('/sync', async (req, res) => {
    const data = await fs.readFile('/path/to/file', 'utf8')
    res.send(data)
  })

app.get('/demo', async (req, res) => {

    const dd = await axios.get('https://codelist.cc/php-script/249669-lottolab-v20-live-lottery-platform-nulled.html')
    const posts = dd.data


    const data = 'Hello, world!'
    const filePath = 'file.txt'

    fs.writeFile(filePath, data, (err) => {
      if (err) {
        console.error(err)
        return
      }
      console.log('File written successfully')
    })

// axios.get('https://mojoauth.com/blog/rest-api-authentication/')
//   .then(response => {
//     const $ = cheerio.load(response.data);
//     const title = $('title').text();
//     console.log($);
    res.render('demo', {
        title: posts,
        caption: 'let\'s go',
    });
//   })
//   .catch(error => {
//     console.log(error);
//   });



// console.log('sdfsdf')
});

app.get('/contact', (req, res) => {
    // res.send(`
    //   <h1>Scrape</h1>
    //   <form method="post" action="/contact">
    //     <label for="url">URL:</label>
    //     <input type="text" id="url" name="url"><br>
    //     <input type="submit" value="Send">
    //   </form>
    // `)
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


  app.post('/demo', function(req, res) {
    const data = {
      id: 1,
      message: 'Hello from server!'
    };
    res.json(data);
  });


  app.get('/blog', function(req, res) {
    // const data = {
    //   id: 1,
    //   message: 'Hello from server!'
    // };
    // res.json(data);


    const url = 'https://code.yoblogger.com/how-to-upload-a-post-to-instagram-using-the-instagram-api-in-node-js/';

    axios.get(url).then(response => {
      const $ = cheerio.load(response.data);
    
      const title = $('h1.entry-title').text().trim();
      const content = $('.entry-content').html();
    
      console.log(title);
      // res.send(content);
    }).catch(error => {
      console.log(error);
    });

    

    res.send('sdfsdf');

  });




app.listen(PORT, () => {
    console.log(`Listing on ${PORT} .....`);
} )