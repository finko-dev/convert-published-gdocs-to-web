const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const cheerio = require('cheerio');
const yaml = require('js-yaml');

// output directory
DIST = 'dist'
// BASE URL
BASE = ''

const pageList = yaml.load(fs.readFileSync('./page-list.yml'));
const glinks = pageList.pageList.reduce((o,n) => ({...o, [n.url]: n}), {})
const urlList = pageList.pageList.map(item => item.url);
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
					.replaceAll(/[\s_]+/g, "-")
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

async function main() {
	// handle queue
	while (queue.length !== 0) {
		await convert_gdoc(queue.shift())
	}
	// save yaml file as a reference
	pageList.pageList = urlList.map(item => glinks[item])
	console.log(pageList)
	fs.writeFileSync('./page-list.generated.yml', yaml.dump(pageList))
}

// RUN!!
main()