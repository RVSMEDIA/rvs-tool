const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFileAndDownloadCSV() {
    try {
        // Create a form and append the file
        const form = new FormData();
        const filePath = path.join(__dirname, 'outputdemo.csv');  // Adjust the file path

        form.append('file', fs.createReadStream(filePath));

        // Make the POST request with the file
        const response = await axios.post('http://139.59.56.29:8000/process_csv/', form, {
            headers: {
                ...form.getHeaders() // Set proper headers for multipart/form-data
            },
            responseType: 'arraybuffer' // Ensures binary data is returned for the CSV
        });

        // Save the response data to a CSV file
        const outputFilePath = 'outputdem11212o.csv';
        fs.writeFileSync(outputFilePath, response.data);

        console.log(`CSV response saved as ${outputFilePath}`);
    } catch (error) {
        console.error('Error during file upload or CSV download:', error.message);
    }
}

uploadFileAndDownloadCSV();
