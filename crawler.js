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
    if (depth !== 0 && level< depth){
    $('html a').each(function () {
        const newurl = $(this).attr('href')
        if (isValidUrl(newurl)){
        links.push( newurl.startsWith("/")? url+newurl:newurl);
        }
    });
   }
    $('img').each(function () {
        images.push({
            imageUrl: $(this).attr('src'),
            sourceUrl: url,
            depth:level
        });
    });

    return {images,links}
}

async function startCrawlPage(pageUrl,pageDepth) {
    const wait = { w: true }
    process.stdout.write("wait.")
    const doWait = () => {
        if (wait.w === true) {
            process.stdout.write('.')
            setTimeout(doWait, 1000);
        }
    }
    doWait()
    const data = await crawlPage(pageUrl,pageDepth);
    const content = JSON.stringify({ results:data});
    try {
         fs.writeFileSync('./results.json', content);
         //file written successfully
         } catch (err) {
         console.error(err);
         }
         wait.w = false
         process.stdout.write('\nCheck the results.json file')
      
}

async function crawlPage(url,depth=0,level=0) {
    let results = []
    try {
       const html = await fetchHTML(url);
       const data = extractData(html,url,depth,level);
       let children = [];
  if(data.links.length>0){
   children =  await Promise.all([...data.links.map((link)=>crawlPage(link,depth,level+1))] )
  }
   results=[...data.images,...children]
    } catch (error) {
       // console.error(`Failed to crawl "${url}": ${error.message}`);
    }
   return results
}
const pageUrl= envs['url']
const pageDepth= envs['depth']
startCrawlPage(pageUrl,pageDepth);