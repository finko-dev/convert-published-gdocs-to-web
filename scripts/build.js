const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const cheerio = require('cheerio');
const yaml = require('js-yaml');

const config = yaml.load(fs.readFileSync('_config.yml'));
const DIST = config.output || 'dist';
const BASE = config.base || '';
const glinks = config.pageList.reduce((o,n) => ({...o, [n.url]: n}), {})
const urlList = config.pageList.map(item => item.url);
const queue = urlList.slice();
const done = {};
const matchedStr = m => m ? m[0] : "";

// Download and convert published gdoc to html
async function convert_gdoc(url) {
	if (done[url])
		return
	console.log(url)
	// fetch
	const res = await axios.get(url);
	let body = res.data
	// start dom search
	const $ = cheerio.load(body);
	// remove script tags and <div id="banners">
	$("html").find("script,#banners").remove();
	// Iterate all <a> tags
	const reGdocPub = new RegExp('https://docs.google.com/.+?/pub');
	$("a").each(function (index, item) {
		const ref = $(item);
		let href = ref.attr('href');
		if (!href) return
		// remove google redirect
		href = href.replace(/https:\/\/www.google.com\/url\?q=(.+?)\&.*/, (a, b) => decodeURI(b))
		// find published goodle docs
		const gdocPub = matchedStr(href.match(reGdocPub));
		if (gdocPub) {
			let loc;
			if (glinks[gdocPub]) {
				loc = glinks[gdocPub].loc
			} else {
				// if page info is not in a list
				const text = ref.text()
				console.log("text: ", text);
				if (!text) {
					console.log(ref);
				}
				// use head of strings as a key/location
				const key = text
					.replace(/^.*?([\w\d\s\-]+).*$/, "$1")
					.trim()
					.replace(/[\s_]+/g, "-")
					.toLowerCase();
				if (!key) throw `Can't find a key for ${href} with "${text.slice(10)}...`
				loc = '/' + key
				// register to list/queue
				glinks[gdocPub] = { loc, url: gdocPub };
				queue.push(gdocPub);
				urlList.push(gdocPub);
			}
			href = loc;
		}
		ref.attr('href', href);
	})
	// finialize edit
	body = $.root().html();
	console.log(`    ==> ${glinks[url].loc}`);
	// save file
	try {
		const loc = glinks[url].loc;
		fs.mkdirSync(path.join(DIST, loc), {recursive: true});
		fs.writeFileSync(path.join(DIST, loc, 'index.html'), body);
		done[url] = true;
	} catch (err) {
		console.error(err);
	}
}

// handle queue
async function runQueue() {
	while (queue.length !== 0) {
		await convert_gdoc(queue.shift())
	}
}

// Post Build
async function postBuild() {
	// save yaml file as a reference
	config.pageList = urlList.map(item => glinks[item])
	console.log(config.pageList)
	fs.writeFileSync('./_config.generated.yml', yaml.dump(config))
	// save yaml of url mappings for fallback plan
	fs.writeFileSync(path.join(DIST, 'url-mappings.yml.txt'), yaml.dump(config.pageList))
}

async function main() {
	try {
		await runQueue();
		await postBuild();
	} catch (err) {
		console.error(err);
		process.exit(err?.errno || 1);
	}
}

// RUN!!
main()

