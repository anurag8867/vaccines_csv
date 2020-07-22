const express = require('express');
const bodyParser = require('body-parser');
const service = require('./service');
const fs = require('fs');
const port = 3008;
let indexesPath = './helpers/index.json';
const fileUpload = require('express-fileupload');
let app = express();

// Starting point of the server
function main() {
    app.use(fileUpload());
    app.use(bodyParser.urlencoded({ // Middleware
        extended: true
    }));
    app.use(bodyParser.json());


    app.get('/search', async (req, res) => {
        try {
            let { productCategory, developer, stageOfDevelopment } = req.query;
            let resp = await service.search({ productCategory, developer, stageOfDevelopment });

            return res.status(resp && resp.status || 200).send({ resp });
        } catch (e) {
            return res.status(e.status || 500).send({
                message: e.message,
                error: e.error || null,
            });
        }
    });


    app.put('/update', async (req, res) => {
        try {
            let { sheet } = req.files;
            let resp = await service.updateVaccineDevelopmentStatus({ sheet });

            return res.status(resp && resp.status || 200).send({ resp });
        } catch (e) {
            return res.status(e.status || 500).send({
                message: e.message,
                error: e.error || null,
            });
        }
    });



    app.use(function (req, res) {
        res.status(404).send({ url: req.originalUrl + ' not found' })
    });

    app.listen(port, err => {
        if (err) {
            return console.error(err);
        }

        //If indexes aren't created please create the indexes to achieve binary search and O(1) time complexity
        try {
            fs.readFileSync(indexesPath);
        } catch (err) {
            service.createIndexing();
        }

        return console.log(`Server is listening on ${port}`);
    });
}

main();