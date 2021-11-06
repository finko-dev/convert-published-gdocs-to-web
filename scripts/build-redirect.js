const fs = require('fs/promises');
const fss = require('fs');
const path = require('path');
const axios = require('axios').default;
const yaml = require('js-yaml');

let config = {}
try {
    config = yaml.load(fss.readFileSync('_config.yml'));
} catch (err) {
    console.error(err)
}
const DIST = config.output || 'dist';
const BASE = config.base || '';
const urlMapper = config.urlMapper || 'url-mappings.yml';
const BASEURL = 'https://life.finko.dev' + '/' + BASE;

async function getUrlMap() {
    let amap = null;
    // TODO urlMapper: pageList
    if (!amap)
        amap = await getUrlMapLocalFile(urlMapper)
    if (!amap)
        amap = await getUrlMapRemoteFetch(BASEURL + '/' + urlMapper + '.txt');
    if (!amap)
        throw "No mapper found!!"
    return amap;
}

async function getUrlMapLocalFile(apath) {
    try {
        return yaml.load(await fs.readFile(apath));
    } catch (err) {
        console.error(err.message);
        return false;
    }
}

async function getUrlMapRemoteFetch(aurl) {
    const amap = await axios.get(aurl)
        .then(res => yaml.load(res.data))
        .catch(err => console.error(err.message));
    return amap || false;
    /*
    try {
        return yaml.load((await axios.get(aurl)).data);
    } catch (err) {
        console.error(err);
        return false;
    }
    */
}

async function genRedirectForCFPages(urlMap) {
    // Works only for Cloudflare Pages
    const redirectFile = path.join(DIST, '_redirects');
    const redirects = urlMap.map(m => `${m.loc} ${m.url} 302`);
    const redirectsStr = redirects.join("\n");
    await fs.mkdir(DIST, { recursive: true });
    await fs.writeFile(redirectFile, redirectsStr);
}

async function main() {
    const urlMap = await getUrlMap();
    console.log(urlMap);
    await genRedirectForCFPages(urlMap);
}

main().catch(err => {
    console.error(err);
    process.exit(err?.errorno || 1);
})

