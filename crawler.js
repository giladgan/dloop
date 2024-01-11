const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const envs = {  }
const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
return !!urlPattern.test(urlString);
}
process.argv.slice(2).forEach(arg=>{
    const [key,value] =arg.split("=")
    envs[key] = value || true
})

async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

function extractData(html,url,depth,level) {
    const $ = cheerio.load(html);
    const images = []
    const links = []
    if ( depth && level< depth){
    $('html a').each(function () {
        if (isValidUrl(url)){
        links.push($(this).attr('href'));
        }
    });
   }
    $('img').each(function () {
        images.push({
            imageUrl: $(this).attr('src'),
            sourceUrl: url, // the page url this image was found on
            depth // the depth of the source at which this image was found on
        });
    });

    return {images,links}
}

async function startCrawlPage(pageUrl,pageDepth) {
    const pwait = { w: true }
    process.stdout.write("wait.")
    const doWait = () => {
        if (pwait.w === true) {
            process.stdout.write('.')
            setTimeout(doWait, 1000);
        }
    }
    doWait()
 
    pwait.w = false
    const data = await crawlPage(pageUrl,pageDepth);
    const content = JSON.stringify({ results:data});
    try {
         fs.writeFileSync('./results.json', content);
         //file written successfully
         } catch (err) {
         console.error(err);
         }

}

async function crawlPage(url,depth=0,level=0) {
    let results = []
    try {
       const html = await fetchHTML(url);
       const data = extractData(html,url,depth,level);

    //     console.log(data.links.length)
       let children = [];

  if(data.links.length>0){
    
   //children =  await Promise.all(data.links.map((link)=>crawlPage(link,depth,Number(level+1)))() )
  }
   results=[...data.images,...children]
     
    } catch (error) {
        console.error(`Failed to crawl "${url}": ${error.message}`);
    }
   return results
}
const pageUrl= envs['url']
const pageDepth= envs['depth']
startCrawlPage(pageUrl,pageDepth);