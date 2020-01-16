# FBMastodon

This tool is a simple NodeJS script that allows for (incremental) importing of posts in a Facebook page to a Mastodon profile.

The planned usage of this tool is to be setup with cron in order to periodically check for new posts and import them.

# What do you need

In order to use this tool you need:

- The Facebook page to mirror: you must be in control of an account which is administrator of the page (_BEWARE_: if this account gets blocked or removed, the mirroring will break, so choose a safe account)
- A mastodon account to which to mirror
- Node.js (this has been tested only on version 10.14.2)
- A system which is permanently connected to internet and has a cron-like mechanism to periodically run tasks, or resort to run manually the task whenever you need to perform the synchronization
- An average knowledge of how to get sources from Git, install software and write JSON files

# Installation

Save the sources in the location where you want the script to run (I suggest to create a separate service account for that), and then run:

```sh
$ npm install
```

# Running

In order to run the program you first have to prepare a configuration file (see below).

There is only one mandatory option, "--conf", to pass a configuration file containing all the data to perform the import. See below for the data needed and the structure of the configuration file.

To actually run the script:

```sh
$ node src/index.js --conf $CONF_FILE
```

# Configuration

A configuration file contains various entries (each one represents the a page you want to mirror) and some settings which are shared by all the entries.

In order to add a new configuration entry, some data is needed:

- Facebook: page id (the id of the page we want to import data from) and permanent auth token (used to run the APIs)
- Mastodon auth token (used to post on Mastodon)

Below you get the instructions about how to obtain this data.

## `conf.json` format

The conf.json is structured like this:

```
{
  "dbName": "posts.db",
  "entries": [
    {
      "name": "Robotizzato Amorepostaggio Pangalattico",
      "facebookAccessToken": "blabla",
      "pageId": "2162479640684043",
      "mastodonServerUrl": "https://mastodon.social",
      "mastodonAccessToken": "blabla"
    },
    {
      "name": "Mysterious Example Page",
      "facebookAccessToken": "blabla",
      "pageId": "49835938749205789",
      "mastodonServerUrl": "https://othermastodon.server",
      "mastodonAccessToken": "blabla"
    },
    ...
  ]
}
```

The configuration file has some key-values top level, and an `entries` key that contains an array of all the pages to mirror. Every top level key-value is mirrored into each entry automatically so, e.g., in the example above the "dbName" entry was copied into all the entries without the need to explicitly write it down.

The allowed keys for each entry are the following:

- `name` (optional): the name of the page we are mirroring
- `facebookAccessToken`: the Facebook permanent access token (see below)
- `pageId`: the Facebook page id (see below)
- `mastodonServerUrl`: the URL of the Mastodon server we want to mirror to
- `mastodonAccesstoken`: the mastodon access token (see below)
- `dbLocation` (optional): directory where to save the db of the mirror pages; if not given, it defaults to the program directory
- `dbName`: the filename of the db; it will be joined with the dbLocation

## How to obtain the Facebook data

### Page ID

- Go to the Facebook page you want to mirror
- Left bar => About
- At the end of the page you will find a "Page ID", something like "2162479640684043"

### Facebook permanent auth token

This is the most tedious task, and it's better to split it into multiple steps, which are the creation of an app, the retrieval of a short lived auth token, then of a long lived auth token, and finally of the permanent auth token, which is what we need.

- Creation of an App: this step creates an entity to which permissions are given and that will act on your behalf to access the facebook data
  - Go to https://developers.facebook.com/apps/
  - Click "Add a New App", and choose a name
  - Go to Settings => Basic
  - Copy the App ID and the App Secret
- Get a short lived token
  - Go to https://developers.facebook.com/tools/explorer
  - Choose the Facebook App you just created
  - Choose "Get User Access Token" under "User or Page"
  - Confirm a user who is an admin of the page (_REMEMBER_: if this user gets suspended or deleted, the access to the page will break, so choose an FB account which will stay safe)
  - Add the permission "pages_show_list" (under the category "Events Groups Pages" of Add a Permission); adding this may ask you for which page you want the access of: confirm the page you're an admin for
  - Click "Get Access Token"
  - Copy the obtained access token
  - _To test the procedure up to here_: paste in the text input on top "_pageid_/feed?fields=id,message,attachments" (fill in the page id you obtained before) and click "Submit": if you obtain some JSON with data that contains presumably the latest post of your pages, you're ok to go
- Get a long lived token
  - On a new tab, go to the address https://graph.facebook.com/v2.10/oauth/access_token?grant_type=fb_exchange_token&client_id=*App ID*&client_secret=*App Secret*&fb_exchange_token=*access token\*
  - You should get an object like:
    ```
    {
        "access_token": "EAAVSafgPW6wBAAV3EprzL0ektfvzf_lots of other characters_Oi3MBDe1bJJaqNUZD",
        "token_type": "bearer",
        "expires_in": 5184000
    }
    ```
  - Write down the value of the "access_token" entry
  - _To test the procedure up to here_: paste your code at https://developers.facebook.com/tools/debug/accesstoken; under "expires" it should give you "in about 2 months"
- Get a permanent token
  - Go to https://graph.facebook.com/v4.0/me?access_token=*long lived token from previous step\*
  - You should get an object like:
  ```
  {
    "name": "Mattia Belletti",
    "id": "10157428244468791"
  }
  ```
  - Write down the value of "id": that's your user id
  - Go to https://graph.facebook.com/v4.0/*user id*/accounts?access_token=*long lived token\*
  - You should obtain a big object, like:
  ```
  {
    "data": [
        {
            "access_token": "EAAVSafgPW6wBAAct0P7_lots of characters_3hbwkJbIximtv9psxLJYmgZDZD",
            "category": "Health/Beauty",
            "category_list": [
                {
                "id": "2214",
                "name": "Health/Beauty"
                }
            ],
            "name": "Robotizzato Amorepostaggio Pangalattico",
            "id": "2162479640684043",
            "tasks": [
                "ANALYZE",
                "ADVERTISE",
                "MODERATE",
                "CREATE_CONTENT",
                "MANAGE"
            ]
        }
    ],
    "paging": {
        "cursors": {
            "before": "MjE2MjQ3OTY0MDY4NDA0MwZDZD",
            "after": "MjE2MjQ3OTY0MDY4NDA0MwZDZD"
        }
    }
  }
  ```
  - Write down access_token: that is finally your permanent access token
  - _To test the procedure up to here_: paste your code at https://developers.facebook.com/tools/debug/accesstoken; under "expires" it should give you "never"

## How to obtain the Mastodon auth token

- Go to your server's Mastodon home page.
- Go to "Preferences" => Development
- New Application
- Set any application name and website, ignore the redirect URI, and set as Scopes only "read:statuses", "write:conversations", "write:media" and "write:statuses"
- Enter the application you just created
- Write down your access token: this is the mastodon auth token
