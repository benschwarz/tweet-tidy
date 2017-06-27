require('dotenv').config()
const Twitter = require('twit')
const moment = require('moment')

/* Config — tweak these values if you want to change the defaults */

// Delete tweets that are older than this date
const oldDate = moment().subtract(3, 'days')

// Delete tweets that have less than this many favs + retweets
const popularityThreshold = 5

/* End config */

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

const params = {
  screen_name: process.env.SCREEN_NAME,
  count: 200
}

let tweetsSeen = 0

const deleteTweets = (maxId, createdAt) => {
  console.log('Calling delete tweets', maxId, createdAt)
  if (maxId) params.max_id = maxId

  client.get('statuses/user_timeline', params, (err, tweets) => {
    if (err) console.error(err)
    tweetsSeen += tweets.length
    console.log('\t', tweets.length, tweetsSeen)

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i]
      const date = tweet.created_at

      // Could use this to not delete tweets in reply to other tweets
      // if (!!tweet.in_reply_to_status_id) break;
      const popularity = tweet.retweet_count + tweet.favorite_count
      if (popularity < popularityThreshold && moment(date).isBefore(oldDate)) {

        client.post(`statuses/destroy/:id`, { id: tweet.id_str }, (err) => {
          if (err) console.error(err)
          console.log('Deleted', tweet.text)
        })
      }
    }

    const lastTweet = tweets[tweets.length - 1]
    if (lastTweet.id_str !== params.max_id) deleteTweets(lastTweet.id_str, lastTweet.created_at)
  })
}

deleteTweets()
