# Spocal-Spamfilter
Bayesian spam filter to grey out unwanted posts and comments

## Installation
* Install tampermonkey for chrome
* Open the dashboard of tampermonkey
* Make a new script
* Paste the code of `userScript.js` into the new script
* Open/reload [spocal.net](http://www.spocal.net)

## Usage
You see % after the time stamp. That's the spam rating (higher -> spam, 0% -> no spam). Posts/comments with a rating higher than 50% will be greyed out gradually. However, to get a good estimation the word buckets need to be big enough. So there'll be misinterpretation in the beginning.

* To mark a post/comment as NON-spam -> hold ALT and click on it
* To mark a post/comment as spam -> hold ALT+SHIFT and click on it
* ALT + i : install word buckets (there is a notification on how to install)
* ALT + e : export buckets (json will be copied into post-text-field)
* ALT + l : delete word buckets

* ALT + h : go to stream / home
* ALT + a : go to notifications
* ALT + m : go to messages
* ALT + y : switch between normal and anonymous mode

There should be green/red feedback to the clicked post/comment. On every classification the words are added to the word buckets.

## Issues
The script may breaks on site changes. I'll fix it if someone wants that.

## Disclaimer
The author accepts no liability for any damage in direct or indirect way due to the use of the software. Use the software at your own risk. 
