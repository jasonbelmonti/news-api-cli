#!/usr/bin/env node
const configed = require('dotenv').config();

// output colors
// https://www.npmjs.com/package/colors
const colors = require('colors/safe');

// file system
const fs = require('fs');

// Use the unofficial Node.js client library to integrate News API into your Node.js application
// without worrying about what's going on under the hood.
// https://newsapi.org/docs/client-libraries/node-js
const NewsAPI = require('newsapi');

// node.js command-line interfaces made easy
// https://www.npmjs.com/package/commander
const program = require('commander');

const MAX_PAGE_SIZE = 100;
const apiKey = process.env.NEWS_API_KEY;

if(apiKey === undefined) {
  console.error('no News API key defined in environment variable NEWS_API_KEY');
  process.exit(1);
}

// expects the NEWS_API_KEY environment variable to be set to the value of your API key.
const newsapi = new NewsAPI(apiKey);

function clean(obj) {
  for (var propName in obj) {
    if (obj[propName] === null || obj[propName] === undefined) {
      delete obj[propName];
    }
  }
}

function resultPrinter(keyName, props, verboseProps) {
  return function(result, verbose, write) {
    const data = result[keyName];

    if(!data) {
      console.error(colors.red('no articles present in the response'))
      throw new Error('no articles present in the response')
    }

    data.forEach(function(datum) {
      props.forEach(function(prop) {
        console.log(`${prop}: ${datum[prop]}`);
      });

      if(verbose) {
        verboseProps.forEach(function(prop) {
          console.log(`${prop}: ${datum[prop]}`);
        });
      }

      console.log(colors.gray('--------------------'));
    });

    console.log(colors.green.bold(`RESULTS PROCESSED: ${data.length}`));

    if(write) {
      fs.writeFileSync(write, JSON.stringify(result), 'utf8');
      console.log(colors.inverse(`SAVED TO: ${write}`));
    }
  }
}

class News {
  constructor(program) {
    // https://newsapi.org/docs/endpoints/sources
    this._registerSources(program);

    // https://newsapi.org/docs/endpoints/everything
    this._registerEverything(program);

    // https://newsapi.org/docs/endpoints/top-headlines
    this._registerTopHeadlines(program);
  }

  everything(params) {
    return this._paginatedEndpoint('everything', params);
  }

  topHeadlines(params) {
    return this._paginatedEndpoint('topHeadlines', params);
  }

  sources(params) {
   return newsapi.v2.sources(params);
  }

  _paginatedEndpoint(name, params) {
    // remove undefined values so they are not coerced to strings
    clean(params);
    const { page = 1 } = params;

    // make a single request if we know there's only one page
    if (page === 1) {
      return newsapi.v2[name](params);
    } else if (page > 1) {
      let promises = [];

      for(let i = 0; i < pages; i++) {
        apiParams = Object.assign({ page: (i + 1), pageSize }, params);

        delete params. pages;

        const req = newsapi.v2[name](apiParams);
        promises.push(req);
      }

      return Promise.all(promises);
    }
  }

  _paginatedResponse(result, verbose, write) {
    let merged = result;

    if(Array.isArray(result)) {
      merged = {
        status: 'ok',
        totalResults: result[0].totalResults,
        articles: []
      };

      result.reduce((acc, { articles }) => {
        acc.articles = acc.articles.concat(articles);
        return acc;
      }, merged);
    }

    resultPrinter('articles', [
      'title',
      'author'
    ], [
      'url'
    ])(merged, verbose, write);

    console.log(colors.green.bold(`TOTAL RESULTS: ${merged.totalResults}`));
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
    .option('-d, --domains <domains>', 'A list of comma-separated whitelisted domains', val => val.split(','))
    .option('-p, --pages <pages>', 'Number of pages to fetch', parseInt)
    .option('-z, --page-size <pageSize>', 'Number of results per page (max 100)', parseInt)
    .option('-v, --verbose', 'If enabled, show url')
    .option('-l, --language [language]', 'Only return articles written in this language')
    .option('-o, --order [order]', 'order by "relevancy", "popularity", or "publishedAt"')
    .option('-w, --write [path]', 'Save the result to [path]')
    .action((query, options) => {
      const {
        sources,
        domains,
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
          sortBy: order,
          page: pages,
          pageSize
        }
      )
      .then((result) => {
        this._paginatedResponse(result, verbose, write);
      })
      .catch((e) => {
        console.log(e);
      });
    });
  }

  _registerTopHeadlines(program) {
    program
    .command('topHeadlines [query]')
    .option('-u, --country [country]', 'Only return articles relevant to this category')
    .option('-c, --category [category]', 'Only return articles relevant to this category')
    .option('-s, --sources <sources>', 'A list of comma-separated news source ids', val => val.split(','))
    .option('-p, --pages <pages>', 'Number of pages to fetch', parseInt)
    .option('-z, --page-size <pageSize>', 'Number of results per page (max 100)', parseInt)
    .option('-v, --verbose', 'If enabled, show url')
    .option('-w, --write [path]', 'Save the result to [path]')
    .action((query, options) => {
      const {
        country,
        category,
        sources,
        pages,
        pageSize,
        verbose,
        write
      } = options;

      this.topHeadlines(
        {
          q: encodeURIComponent(query),
          sources,
          country,
          category,
          page: pages,
          pageSize
        }
      )
      .then((result) => {
        this._paginatedResponse(result, verbose, write);
      })
      .catch((e) => {
        console.log(e);
      });
    });
  }
}

// configuration
const { version } = require('./package.json');
program.version(version);

const news = new News(program);
program.parse(process.argv);

// export an instantiated singleton
module.exports = news;