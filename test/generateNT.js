const puppeteer = require('puppeteer');
const userConfig=require("./chrome.json")["linux"]["fireworks"]
const fs=require('fs');
const path=require('path');
let chai=require('chai');
const {direct} = require("selenium-webdriver/lib/proxy");
const {objectProperty} = require("../componentes/dataStructures/info");
/*
  Check chrome://version for details
  userdata, remote-debugging port and others
  To connect to running session user puppeteer.connect(url)
  the url is localhost and the port running the remote-debugging
 */


const testInput=true;
function random(max){
    return Math.floor(Math.random()*max);
}

(async () => {
    let switchTabAndColumn=true;

    let opts={
        headless:false,
        executablePath:userConfig.executablePath,
        //devtools: true,
        //slowMo: 250, // slow down by 250ms
        userDataDir: userConfig.userDataDir
    }
    const setTextInputValue =(async (page,selector,value)=> {
        await page.waitForSelector(selector);
        await page.evaluate((data) => {
            return document.querySelector(data.selector).value = data.value
        }, {selector, value})
    })
    let defaultMapPath="/brunocosta/Documents/Projectos/ontobrapi/9may/OntoBrAPI_9May_mapping-added.json"
    //let mapInvestigation="brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/investigation.json"
    //let mapInvestigation="brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/ontobrapi_vitis.json"
    //let mapInvestigation="brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/investigationNstudyNperson.json"
    let mapInvestigation="brunocosta/git/ontoBrAPI/ontoBrAPI-node-docker/reference_files/valores\ de\ Cópia de MIAPPEv1.1_compliant_vitis_submissionOntobrapi.json"
    let root=""
    if(process.platform=="darwin"){
            root="/Users"
    }else if(process.platform=="linux"){
        root="/home"
    }
    let mappingGeneral = fs.readFileSync(path.join(root,defaultMapPath),{encoding:"utf8"})
    let mappingInvestigation=fs.readFileSync(path.join(root,mapInvestigation),{encoding:"utf8"})
    mappingGeneral=mappingGeneral.split("/n")[0];
    mappingInvestigation=mappingInvestigation.split("/n")[0];
    let mapping=mappingInvestigation
    let element;


    //Start browser
    //const browser = await puppeteer.launch(opts);
    // Lookup on chrome session "chrome://"
    const browserURL = `http://localhost:${userConfig.port}`
    const browser = await puppeteer.connect({browserURL, defaultViewport: null})


    const pages = await browser.pages()
    const firstPage=pages[0]
    await firstPage.bringToFront();

    if(testInput==true) {
        await firstPage.goto(`http://localhost:${userConfig.serverPort}`);


        //LOAD SpreadSheet and Mapping
        await firstPage.waitForSelector('#augment-file')
        await (await firstPage.$('#augment-file')).uploadFile(path.join(root, `brunocosta/git/ontoBrAPI/ontoBrAPI-node-docker/reference_files/valores\ de\ Cópia\ de\ MIAPPEv1.1_compliant_vitis_submissionOntobrapi.ods`))
        //Takes some time till loaded works better than the wait for Selector
        await firstPage.waitForTimeout(1500);
        element = await firstPage.waitForSelector("#mapping-loading-options button.load-mapping-button")
        await element.evaluate(element => element.click())
        try {
            let jsheet=await firstPage.evaluate(()=> window.jSheet)
            chai.assert.isObject(jsheet, "Loading XLXS")
            chai.assert.isObject(jsheet, "Jsheet has workbook")
        } catch (e) {
            console.log("*** FAILED *** Loading file: ", e)
        }


        let textarea=await firstPage.waitForSelector("#loadingPanel textarea")
        await firstPage.evaluate((el,text)=> {
                el.value = text
            }
            ,textarea,mapping)
        //await setTextInputValue(firstPage, "#loadingPanel textarea", mapping)
        element = await firstPage.$('textarea');
        await element.type(" "); //For vue to update
        element = await firstPage.waitForSelector("#loadingPanel button.load-mapping-text");
        await element.click();

        if (switchTabAndColumn == false) {
            //TEST
            element = await firstPage.waitForSelector("#rId2");
            await element.click();
            await firstPage.waitForTimeout(1500);
            element = await firstPage.waitForSelector('.v-select#column-selection input')
            await element.click()
            await firstPage.waitForTimeout(1000);
            element = await firstPage.waitForSelector('.v-select#column-selection li[id$=\'__option-2\'')
            await firstPage.waitForTimeout(1000);
            await element.click();

        }
        //await firstPage.waitForTimeout(6500);
        if (true === true) {
            //Generate triples
            genNT = await firstPage.waitForSelector('button.generate-nt')
            await genNT.evaluate(b => b.click());
            //await  genNT.click();
            //await genNT.hover() //Just to bring into view
            await firstPage.evaluate(() => {
                window.scrollBy(500, window.innerHeight);
            });

            let textarea = await firstPage.waitForSelector('textarea.generated-ntriples.loaded')
            firstPage.once('load',textarea)
            await testNTs()

            async function testNTs() {
                let value = await firstPage.evaluate(el => el.textContent, textarea)
                try {
                    chai.assert.isAbove(value.length, 0, "Generating n-triples produced no triples")
                } catch (e) {
                    console.log("*** FAILED *** No triples created: ", e)
                }
                try {
                    chai.assert.isTrue(value.includes("<http://brapi.biodata.pt/raiz/Investigation_THERMAL%20REQUIREMENTS,%20DURATION%20AND%20PRECOCITY%20OF%20PHENOLOGICAL%20STAGES%20OF%20GRAPEVINE%20CULTIVARS%20OF%20THE%20PORTUGUESE%20COLLECTIONINIAV:2Portos:VitisPhenology>"), "Creation of class investigation")
                } catch (e) {
                    console.log("*** FAILED *** Investigation Class was not created successfully: ", e)
                }
            }

        }
    }
    browser.disconnect();
})();