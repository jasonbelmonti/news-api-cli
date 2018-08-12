# News API CLI
Command-line interface for [News API](https://newsapi.org/).

Provides three commands:
+ [`sources`](#sources) wraps [/sources](https://newsapi.org/docs/endpoints/sources)
+ [`everything`](#everything) wraps [/everything](https://newsapi.org/docs/endpoints/everything)
+ **TODO**: implement `top-headlines` to wrap [/top-headlines](https://newsapi.org/docs/endpoints/top-headlines)

## Getting Started

### Make `news.js` executable
```
computer-1:repositories user$ cd news-api-cli
computer-1:news-api-cli user$ chmod +x news.js
```

### Add News API Key
Get a key [here](https://newsapi.org/register)).

Add a file called `.env` in the project root containing your News API key.

```
// contents of news-api-cli/.env
NEWS_API_KEY=YOUR-KEY-HERE
```

## Commands

### [Sources](https://newsapi.org/docs/endpoints/sources)

#### Usage

`sources [options]`

#### Options
```
  -l, --language [language]  Only return articles written in this language
  -v, --verbose              If enabled, show description, url, category, language, country
  -c, --category [category]  Only return articles relevant to this category
  -w, --write [path]         Save the result to [path] (utf-8 encoding)
  -h, --help                 output usage information
```
#### Examples

##### Retreive all english language sources and write them to `sources.json`:
```
./news.js sources -l en -w sources.json
```

##### Retreive all "business" sources and save to `sources/business.json`:
```
./news.js sources -c business -w sources/business.json
```

##### Retreive all sources and print all information:
```
./news.js sources -v
```

### Everything

#### Usage
`everything [options] [query]`

#### Options:
```
  -f, --from [from]           Articles published after date This should be in ISO 8601 format (e.g. 2018-07-07 or 2018-07-07T01:07:36)
  -t, --to [to]               Articles published before date. This should be in ISO 8601 format (e.g. 2018-07-07 or 2018-07-07T01:07:36)
  -s, --sources <sources>     A list of comma-separated news source ids
  -p, --pages <pages>         Number of pages to fetch
  -z, --page-size <pageSize>  Number of results per page (max 100)
  -v, --verbose               If enabled, show url
  -l, --language [language]   Only return articles written in this language
  -o, --order [order]         order by "relevancy", "popularity", or "publishedAt"
  -w, --write [path]          Save the result to [path]
  -h, --help                  output usage information
```

#### Examples

##### retreive up to 400 articles (4 pages of 100 results each) matching the query "gun control" from [The New York Times](https://www.nytimes.com/) from 05/01/2017 to 06/01/2017 and save to `nyt.json`:
```
./news.js everything gun control -s the-new-york-times -f 2018-05-01 -t 2018-06-01 -p 4 -z 100 -w nyt.json
```