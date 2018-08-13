#!/usr/bin/env node
// output colors
// https://www.npmjs.com/package/colors
const colors = require('colors/safe');

// file system
const fs = require('fs');

// node.js command-line interfaces made easy
// https://www.npmjs.com/package/commander
const program = require('commander');

const newsapi = require('@jasonbelmonti/news-api');

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


  _registerSources(program) {
    program
    .command('sources')
    .option('-l, --language [language]', 'Only return articles written in this language')
    .option('-v, --verbose', 'If enabled, show description, url, category, language, country')
    .option('-c, --category [category]', 'Only return articles relevant to this category')
    .option('-w, --write [path]', 'Save the result to [path]')
    .action((options) => {
      const { language, category, write, verbose } = options;
      newsapi.sources({ language, category }).then((result) => {
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

      newsapi.everything(
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
        resultPrinter('articles', [
          'title',
          'author'
        ], [
          'url'
        ])(result, verbose, write);
      })
      .catch((e) => {
        console.log(e);
      });
    });
  }

  _registerTopHeadlines(program) {
    program
    .command('topHeadlines [query]')
    .option('-u, --country [country]', 'Only return articles relevant to this country')
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

      newsapi.topHeadlines(
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
        resultPrinter('articles', [
          'title',
          'author'
        ], [
          'url'
        ])(result, verbose, write);
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