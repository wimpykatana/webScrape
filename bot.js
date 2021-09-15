const webUrl = 'https://www.traveloka.com/en-id/restaurants/indonesia/city/tangerang-100330';
const totalPage = 2;

/** Do Not edit any code below this line ----------------------------------------------------------------- */
const pptr = require('puppeteer');
const csvWrite = require('csv-writer').createObjectCsvWriter;
let targetUrls = [];

const cw = csvWrite({
    path: './restaurantScrap.csv',
    fieldDelimiter: ';',
    header: [
        {id: 'restoName', title: 'Nama Restaurant'},
        {id: 'restoAddr', title: 'Alamat Restaurant'},
        {id: 'restoPhone', title: 'No. Tel'},
    ]
});



const traveloka = {
    browser: null,
    page: null,

    init: async () => {

        traveloka.browser = await pptr.launch({ headless: false, args:[ '--start-maximized' ]});
        traveloka.page = await traveloka.browser.newPage();
        await traveloka.page.setViewport({ width: 1366, height: 768});
        traveloka.page.setUserAgent(
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
        );
        
    },

    start: async () => {
        console.log('begin scraping');
        await traveloka.page.goto(webUrl, { waitUntil: 'networkidle2' });
        
        let startPage = 1;
        let maxPage = totalPage;

        for(let i = startPage; i <= maxPage; i++){
            console.log('on page '+i)
            if(i == startPage){
                await traveloka.getUrlnya();
                await traveloka.page.waitForTimeout(5000);
            }else{
                await traveloka.page.click('#desktopContentV3 > div > div._2phds > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div.css-18t94o4.css-1dbjc4n.r-kdyh1x.r-1loqt21.r-mabqd8.r-61z16t.r-vkv6oe.r-10paoce.r-1e081e0.r-5njf8e.r-1otgn73.r-lrvibr');
                await traveloka.page.waitForTimeout(10000);
                await traveloka.getUrlnya();
            }
        }
        
        await traveloka.openDetail();
        
    },

    getUrlnya: async () => {
       
        const targets = await traveloka.page.$$eval('div._30ane > a', as => as.map(a => a.getAttribute('href')));
        targetUrls.push(targets);

    },

    openDetail: async () => {
        console.log('Begin detailing');

        for( const targetUrl of targetUrls.flat() ){
            
            console.log('target url: ',targetUrl);

            try {
                await traveloka.page.goto(targetUrl, { waitUntil: 'networkidle2' })
                await traveloka.page.waitForTimeout(5000);
            } catch (error) {
                console.log(error);
            }
           
            //resto name
            const restoName = await traveloka.page.$eval('#__next > div > div._2XbV5._b6-k > div:nth-child(2) > div._2phds > div:nth-child(1) > div._1sSXm._3xGQt > div._3o9EF > div > div._3nDqC > h1', el => el.textContent);
            console.log(restoName);

            //alamat
            const restoAddr = await traveloka.page.$eval('#__next > div > div._2XbV5._b6-k > div:nth-child(2) > div._2phds > div:nth-child(2) > div > div._3XInA._3GHVY > div:nth-child(2) > span', el => el.textContent);
            console.log(restoAddr);
            
            //phone number
            let isPhoneNumberAvail = null;
            let restoPhone;
            try{
                isPhoneNumberAvail = await traveloka.page.waitForSelector('#__next > div > div._2XbV5._b6-k > div:nth-child(2) > div._2phds > div:nth-child(2) > div > div._3XInA._2EZGX > div._2_aPY', {timeout: 3000});
            }catch(e){
                isPhoneNumberAvail = null;
            }

            if(isPhoneNumberAvail){
                const phoneNumber = await traveloka.page.$eval('#__next > div > div._2XbV5._b6-k > div:nth-child(2) > div._2phds > div:nth-child(2) > div > div._3XInA._2EZGX > div._2_aPY', el => el.textContent);
                const newPhoneNumber = phoneNumber.split('');
                if(newPhoneNumber[0] == '0'){
                    newPhoneNumber.splice(0,1,'62');
                }else if(newPhoneNumber[0] == '+'){
                    newPhoneNumber.shift();
                }
                console.log(newPhoneNumber.join(''));
                restoPhone = newPhoneNumber.join('');
            }

            let item = [];
            item.push({
                restoName: restoName,
                restoAddr: restoAddr,
                restoPhone: restoPhone
            });
            
            await cw.writeRecords(item).then(() => console.log('done add to csv'));
            console.log('-------------- end of detail resto');
            
        }

       
    }
}

module.exports = traveloka;