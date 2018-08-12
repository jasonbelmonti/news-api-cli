#!/usr/bin/env node
const configed = require('dotenv').config();

// Use the unofficial Node.js client library to integrate News API into your Node.js application
// without worrying about what's going on under the
// hood.https://newsapi.org/docs/client-libraries/node-js
const NewsAPI = require('newsapi');

// node.js command-line interfaces made easy
// https://www.npmjs.com/package/commander
const program = require('commander');

const apiKey = process.env.NEWS_API_KEY;

if(apiKey === undefined) {
  console.error('no textrazor api key defined in environment variable TEXTRAZOR_API_KEY');
  process.exit(1);
}

// expects the NEWS_API_KEY environment variable to be set to the value of your API key.
const newsapi = new NewsAPI(apiKey);

const MAX_PAGE_SIZE = 100;

// this is really more of a "result printer"
function resultPrinter(keyName, props, verboseProps) {
  return function(result, verbose, write) {
    const data = result[keyName];

    data.forEach(function(datum) {
      props.forEach(function(prop) {
        console.log(datum[prop])
      });

      if(verbose) {
        verboseProps.forEach(function(prop) {
          console.log(datum[prop]);
        });
      }

      console.log('--------------------');
    });

    console.log(`RESULTS PROCESSED: ${data.length}`);

    if(write) {
      fs.writeFileSync(write, JSON.stringify(result), 'utf8');
      console.log(`SAVE LOCATION: ${write}`);
    }
  }
}

class News {
  constructor(program) {
    if(program)

    // https://newsapi.org/docs/endpoints/sources
    this._registerSources(program);

    // https://newsapi.org/docs/endpoints/everything
    this._registerEverything(program);
  }

  everything(params, pages = 1, pageSize = 20) {
    // make a single request if we know there's only one page
    if (pages === 1) {
      return newsapi.v2.everything(Object.assign({}, { page: pages, pageSize }, params));
    } else if (pages > 1) {
      let promises = [];

      for(let i = 0; i < pages; i++) {
        const req = newsapi.v2.everything(Object.assign({}, { page: (i + 1), pageSize }, params));
        promises.push(req);
      }

      return Promise.all(promises);
    }
  }

  sources(params) {
   return newsapi.v2.sources(params);
  }

  _registerSources(program) {
    program
    .command('sources')
    .option('-l, --language [language]', 'Only return articles written in this language')
    .option('-v, --verbose', 'If enabled, show description, url, category, language, country')
    .option('-c, --category [category]', 'Only return articles relevant to this category')
    .option('-w, --write [path]', 'Save the result to [path]')
    .action((options) => {
      const { language, category, write, verbose } = options;
      this.sources({ language, category }).then((result) => {
        resultPrinter('sources', [
          'name',
          'id'
        ], [
          'description',
          'country',
          'category',
          'url'
        ])(result, verbose, write);
      });
    });
  }

  _registerEverything(program) {
    program
    .command('everything [query]')
    .option('-f, --from [from]', 'Articles published after date This should be in ISO 8601 format (e.g. 2018-07-07 or 2018-07-07T01:07:36)')
    .option('-t, --to [to]', 'Articles published before date. This should be in ISO 8601 format (e.g. 2018-07-07 or 2018-07-07T01:07:36)')
    .option('-s, --sources <sources>', 'A list of comma-separated news source ids', val => val.split(','))
    .option('-p, --pages <pages>', 'Number of pages to fetch', parseInt)
    .option('-z, --page-size <pageSize>', 'Number of results per page (max 100)', parseInt)
    .option('-v, --verbose', 'If enabled, show url')
    .option('-l, --language [language]', 'Only return articles written in this language')
    .option('-o, --order [order]', 'order by "relevancy", "popularity", or "publishedAt"')
    .option('-w, --write [path]', 'Save the result to [path]')
    .action((query, options) => {
      const {
        sources,
        language,
        order,
        write,
        verbose,
        pages,
        pageSize,
        from,
        to,
        all
      } = options;

      this.everything(
        {
          q: encodeURIComponent(query),
          sources,
          language,
          from,
          to,
          sortBy: order
        },
        pages,
        pageSize
      ).then((result) => {
        let merged = result;

        if(Array.isArray(result)) {
          let mergedArticles = [];


          result.forEach(({ articles }) => {
            mergedArticles = mergedArticles.concat(articles);
          });

          merged = {
            status: 'ok',
            totalResults: result[0].totalResults,
            articles: mergedArticles
          };
        }

        resultPrinter('articles', [
          'author',
          'title'
        ], [
          'url'
        ])(merged, verbose, write);

        console.log(`TOTAL RESULTS: ${merged.totalResults}`);
      });
    });
  }
}

// configuration
const package = require('./package.json');
program.version(package.version);

const news = new News(program);
program.parse(process.argv);

// export an instantiated singleton
module.exports = news;