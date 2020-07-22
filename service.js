const fs = require('fs');
const csv = require('csv-parser');
const converter = require('json-2-csv');
const csvToJson = require('csvtojson');
let vaccineListPath = './COVID-19 Tracker-Vaccines.csv';
let indexesPath = './helpers/index.json';
let headerNamesConfig = {
    productCategory: "Product Category",
    developer: "﻿Developer / Researcher",
    stageOfDevelopment: "Stage of Development",
    dateLastUpdated: "Date Last Updated",
};

/**
 * This function will do all the search operation required on the search columns
 * @param {productCategory, developer, stageOfDevelopment} param0
 */
function search({ productCategory, developer, stageOfDevelopment }) {
    let data = [];
    let searchIndexesFound = {};

    return new Promise((resolve, reject) => {
        fs.createReadStream(vaccineListPath)
            .pipe(csv())
            .on('data', function (row) {
                data.push(row)
            })
            .on('end', async function (row) {
                let indexedData = fs.readFileSync(indexesPath, 'utf-8');
                indexedData = JSON.parse(indexedData)

                // Search by vaccine type(product category in the csv file)
                if (productCategory) {
                    if (indexedData['productCategoryObj'] && indexedData['productCategoryObj'][productCategory]) {
                        searchIndexesFound["products"] = indexedData['productCategoryObj'][productCategory];
                    } else {
                        searchIndexesFound["products"] = [];
                    }
                }

                // Search by the developer / researcher of the vaccine
                if (developer) {
                    if (indexedData['developerObj']) {
                        if (!searchIndexesFound["developers"]) searchIndexesFound["developers"] = [];
                        for (let name in indexedData['developerObj']) {
                            if (~name.indexOf(developer)) {
                                searchIndexesFound["developers"].push(...indexedData['developerObj'][name]);
                            }
                        }
                    }
                }

                // Search by stage of development
                if (stageOfDevelopment) {
                    if (indexedData['stageOfDevelopmentObj'] && indexedData['stageOfDevelopmentObj'][stageOfDevelopment]) {
                        searchIndexesFound["stages"] = indexedData['stageOfDevelopmentObj'][stageOfDevelopment]
                    } else {
                        searchIndexesFound["stages"] = [];
                    }
                }


                let commonIndexes = getCommonIndexNumbers(searchIndexesFound);
                let resp = commonIndexes.map((value, index) => {
                    return data[index]
                })

                // sort option based on - developer name
                resp.sort((a, b) => {
                    if (a[headerNamesConfig['developer']] > b[headerNamesConfig['developer']]) return 1
                    if (a[headerNamesConfig['developer']] < b[headerNamesConfig['developer']]) return -1
                    return 0
                })

                // sort option based on - stage of development
                resp.sort((a, b) => {
                    if (a[headerNamesConfig['stageOfDevelopment']] > b[headerNamesConfig['stageOfDevelopment']]) return 1
                    if (a[headerNamesConfig['stageOfDevelopment']] < b[headerNamesConfig['stageOfDevelopment']]) return -1
                    return 0
                })

                return resolve(resp);
            })
            .on('error', function (error) {
                return reject(error);
            })
    })
}


/**
 * Selecting common index numbers from multiple arrays
 * @param {productCategory, developer, stageOfDevelopment} param0
 */
function getCommonIndexNumbers(searchIndexesFound) {
    let indexes = [];
    for (let key in searchIndexesFound) {
        indexes.push(searchIndexesFound[key])
    }
    return indexes.reduce((p, c) => p.filter(e => c.includes(e)));
}


/**
 * This function will create indexing which will be helpful for us while running the search query operation.
 * Algo behind this is same which MYSQL follows under the hood
 * @param {productCategory, developer, stageOfDevelopment} param0
 */
function createIndexing() {
    let index = 0;
    let productCategoryObj = {}, stageOfDevelopmentObj = {}, developerObj = {};
    return new Promise((resolve, reject) => {
        fs.createReadStream(vaccineListPath)
            .pipe(csv())
            .on('data', function (row) {
                //Saving the locations of the rows
                // Following the similar architecture which our DBMS follows for Indexes Concept

                // for productCategory
                if (!productCategoryObj[row[headerNamesConfig["productCategory"]]]) {
                    productCategoryObj[row[headerNamesConfig["productCategory"]]] = [index];
                } else {
                    productCategoryObj[row[headerNamesConfig["productCategory"]]].push(index);
                }

                // for stageOfDevelopment
                if (!stageOfDevelopmentObj[row[headerNamesConfig["stageOfDevelopment"]]]) {
                    stageOfDevelopmentObj[row[headerNamesConfig["stageOfDevelopment"]]] = [index];
                } else {
                    stageOfDevelopmentObj[row[headerNamesConfig["stageOfDevelopment"]]].push(index);
                }

                // for developer
                if (!developerObj[row[headerNamesConfig["developer"]]]) {
                    developerObj[row[headerNamesConfig["developer"]]] = [index];
                } else {
                    developerObj[row[headerNamesConfig["developer"]]].push(index);
                }
                index++;
            })
            .on('end', async function (row) {

                //Indexes are created, saving those indexes in index.json file located in helper folder
                await fs.writeFileSync(indexesPath, JSON.stringify({
                    productCategoryObj, stageOfDevelopmentObj, developerObj
                }));
                return resolve({ message: "Execution Successful" })
            })
            .on('error', function (error) {
                return reject(error);
            });
    });
}


/**
 * this function will update the state of development in the exisitng sheet,
 * update the updated at column date
 * update indexing as well
 * @param {*} param0 
 */
async function updateVaccineDevelopmentStatus({ sheet }) {
    let csvData = [];
    let index = 0;
    let dataToUpdate = {};
    let csvStr = sheet.data.toString();

    //Note: Indexing is already present, so need to just taken out the index number(row number from the sheet) and update the vaccine
    // development state and updated on date as well.
    let indexedData = fs.readFileSync(indexesPath, 'utf-8');
    let parsedData = JSON.parse(indexedData);

    let data = await csvToJson({
        noheader: false,
        output: "csv"
    }).fromString(csvStr);

    // Key of this object is index number of the csv file and value is data which needs to updated for Vaccine Development
    // So time complexity of O(1) can be achieved
    data.forEach((value) => {
        if (parsedData["developerObj"][value[0]]) {
            dataToUpdate[parsedData["developerObj"][value[0]]] = value[1];
        }
    })

    return new Promise((resolve, reject) => {
        fs.createReadStream(vaccineListPath)
            .pipe(csv())
            .on('data', function (row) {
                if (dataToUpdate[index]) {
                    row[headerNamesConfig["stageOfDevelopment"]] = dataToUpdate[index];

                    let date = new Date();
                    //Because Janurary is considered as 0, hence increasing the month number which is fetched from javascript timestamp
                    //updating the last updated timestamp
                    row[headerNamesConfig["dateLastUpdated"]] = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                }
                csvData.push(row)
                index++;
            })
            .on('end', async function (row) {

                // convert JSON array to CSV string
                converter.json2csv(csvData, (err, csv) => {
                    if (err) {
                        return reject(err);
                    }
                    // Update Vaccines list with updated data
                    fs.writeFileSync(vaccineListPath, csv);

                    //update indexing as well
                    createIndexing().then((data) => resolve({ message: "Execution Successful" }));
                });
            })
            .on('error', function (error) {
                return reject(error);
            });
    });
}

module.exports = {
    search, createIndexing, updateVaccineDevelopmentStatus
};
