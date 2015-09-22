// ==UserScript==
// @name         Spocal Spam Filter & more
// @namespace    http://your.homepage/
// @version      0.3
// @description  enter something useful
// @author       Fabio D.
// @match        https://www.spocal.net/*
// @reeequire      https://raw.githubusercontent.com/lucaong/jQCloud/master/jqcloud/jqcloud-1.0.4.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// http://en.wikipedia.org/wiki/Naive_Bayes_spam_filtering#Combining_individual_probabilities

/* CONFIGS */
var BUCKETS = ['idBucketNOT', 'idBucketSPAM', 'wordBucketNOT', 'wordBucketSPAM'];
var COMMON_WORDS = "du ich er sie es im in d de vo eu".split(' ');

/* HELPERS */
var uw = (this.unsafeWindow) ? this.unsafeWindow : window;
uw.inArray = function(value, array) {
    return array.indexOf(value) > -1;
};
Node.prototype.findAncestorByClass = function(className){
    var el = this;
    while ((el = el.parentElement) && !el.classList.contains(className));
    return el;
};
uw.ObjectLength = function(obj){
    return Object.keys(obj).length;
};
function findPos(obj){
    var posX = obj.offsetLeft;var posY = obj.offsetTop;
    while(obj.offsetParent){
        if(obj==document.getElementsByTagName('body')[0]){break}
        else{
            posX=posX+obj.offsetParent.offsetLeft;
            posY=posY+obj.offsetParent.offsetTop;
            obj=obj.offsetParent;
        }
    }
    var posArray=[posX,posY];
    return posArray;
}

/* CODE */
var Spamfilter = function(){
    self = this;
    
    this.init = function(){
        self.Buckets = {};
        self.loadBuckets();
        
        var int = setInterval(function(){
            if (window.location.href == 'https://www.spocal.net/stream/main' &&
                document.getElementsByClassName('post').length > 0){
                self.spamCheckPosts();
                self.spamCheckComments();
            }
        }, 1000);
        
        console.log ('Stats: non-spam / spam');
        console.log ('Posts: ' +ObjectLength(self.Buckets.idBucketNOT)+ ' / '+ObjectLength(self.Buckets.idBucketSPAM));
        console.log ('Words: ' +ObjectLength(self.Buckets.wordBucketNOT)+ ' / '+ObjectLength(self.Buckets.wordBucketSPAM));
    };
    
    this.spamCheckComments = function(){
        var comments = document.getElementsByClassName('inline-comment');
        if (comments.length === 0) return false;
        
        for (var i=0; i<comments.length; i++){
            var comment = comments[i];
            
            // continue if already checked
            var timeText = comment.getElementsByClassName('timeago')[0].innerHTML;  
            if (timeText.indexOf('(') != -1) 
                continue;
            
            // (unecessary) hero part
            // removed
            
            addClickListenerComment(comment);
            // has no id
            // if set spam/notspam ?
            
            var words = getWordsFromComment(comment);
            var nn = Math.round(isSpamLog(words)*100, 0);
            if (nn > 50) comment.style.opacity = 1 - nn/100;
            if (nn > 80) comment.style.opacity = 0.2;
            setTitleText(comment, '<small>('+nn+' %)</small>');
            
        }
    };
    
    this.spamCheckPosts = function(){
        var posts = document.getElementsByClassName('post');
        if (posts.length === 0) return false;
        
        for(var i=0; i<posts.length; i++){
            var post = posts[i];

            // continue if already checked
            var timeText = post.getElementsByClassName('timeago')[0].innerHTML;  
            if (timeText.indexOf('(') != -1) 
                continue;

            // (unecessary) hero part
            var username = post.getElementsByClassName('fi-name')[0].innerText;
            if (username === 'cappuccino'){
                post.style.color = 'gold';
                post.getElementsByClassName('timeago')[0].innerHTML += ' (golden hero)';

                var as = post.getElementsByTagName('a');
                for (var j=0; j<as.length; j++) as[j].style.color = 'gold';

                as = post.getElementsByTagName('strong');
                for (j=0; j<as.length; j++) as[j].style.color = 'gold';

                as = post.getElementsByClassName('timeago');
                for (j=0; j<as.length; j++) as[j].style.color = 'gold';

                continue;
            }

            addClickListenerPost(post); 
            var id = post.getAttribute('id');
            
            if (self.Buckets.idBucketNOT[id]){
                setTitleText(post, ' <small>(set as <span style="color:green">not spam</span>)</small>');
                continue;
            }
            if (self.Buckets.idBucketSPAM[id]){
                setTitleText(post, ' <small>(set as <span style="color:red">SPAM</span>)</small>');
                post.style.display = 'none';
                continue;
            }

            var wordsPost = getWordsFromPost(post);
            var nn = Math.round(isSpamLog(wordsPost)*100, 0);
            if (nn > 50) post.style.opacity = 1 - nn/100;
            if (nn > 80) post.style.opacity = 0.2;
            setTitleText(post, '<small>('+nn+' %)</small>');
        }
    };
    
    function isSpamLog(words){
        var wordsNOT = self.Buckets.wordBucketNOT;
        var wordsSPAM = self.Buckets.wordBucketSPAM;

        var prob = 0;
        var probAnti = 0;
        for (var i=0; i<words.length; i++){
            var word = words[i].trim();

            // word never encountered
            if (! wordsSPAM[word] && ! wordsNOT[word]) continue;

            // avoid undefined
            if (! wordsSPAM[word]) wordsSPAM[word] = 0;
            if (! wordsNOT[word]) wordsNOT[word] = 0;

            // rare words
            //if (wordsSPAM[word] < 3 && wordsNOT[word] < 3) continue;

            // p(Spam | word)
            pW = wordsSPAM[word] / (wordsSPAM[word] + wordsNOT[word]);
            // correction for rare words
            //if (wordsSPAM[word] < 3 && wordsNOT[word] < 3) 
            //    pW = (3 * 0.5 + wordsSPAM[word] * pW) / (3 + wordsSPAM[word]);

            prob += Math.log(pW);
            probAnti += Math.log(1-pW);
        }

        // p(Spam | Text)
        var p = Math.pow(Math.E, prob) / (Math.pow(Math.E, prob) + Math.pow(Math.E, probAnti)); // same as above

        if (isNaN(p)) p = 0; // shouldnt happen actually

        return p;
    };
    
    this.updateBuckets = function(){
        BUCKETS.forEach(function(bName){
            localStorage.setItem(bName, JSON.stringify(self.Buckets[bName]));
            console.log(bName + ' saved');
        });
        return true;
    };
    
    this.loadBuckets = function(){
        BUCKETS.forEach(function(bName){
            self.Buckets[bName] = JSON.parse(localStorage.getItem(bName)) || {};
            console.log(bName + ' loaded');
        });
    };
    
    this.installBuckets = function(){
        var bContent = document.getElementById('postText').value.split("\n");
        // ... implemented in the keypress event function
    };
    
    this.seeBuckets = function(){
        var tField = document.getElementById('postText');
        BUCKETS.forEach(function(bName){
            tField.value =  tField.value + localStorage.getItem(bName) + "\n";
        });
    };
    
    this.deleteBuckets = function(){
        BUCKETS.forEach(function(bName){
            self.Buckets[bName] = {};
        });
        self.updateBuckets();
    };
    
    function getWordsFromPost(post){
        var text = '';
        if (post.getElementsByClassName('fi-title')[0]) text += post.getElementsByClassName('fi-title')[0].innerHTML;
        if (post.getElementsByClassName('fi-text')[0]) text += ' ' + post.getElementsByClassName('fi-text')[0].innerHTML;
        return textToWords(text);
    }
    
    function getWordsFromComment(comment){
        var text = '';
        if (comment.getElementsByClassName('fi-text')[0]) text += comment.getElementsByClassName('fi-text')[0].innerHTML;
        if (comment.getElementsByClassName('fi-name')[0].getElementsByTagName('strong')[0]) text += ' ' + comment.getElementsByClassName('fi-name')[0].getElementsByTagName('strong')[0].innerHTML;
        return textToWords(text);
    }
    
    function textToWords(text){
        text = text.replace(/\?|!/, '');
        text = text.replace(/-|#|\/|\./, ' ');
        return text.toLowerCase().split(' ');//.diff(COMMON_WORDS); // diff not working
    }
    
    function addWords(bucket, words){
        var b = self.Buckets[bucket]
        for (var i=0; i<words.length; i++){
            var word = words[i].trim();
            if (b[word])
                b[word] = b[word] + 1;
            else
                b[word] = 1;
        }
    };
    
    function addClickListenerPost(el){
        el.addEventListener('click', function(e) {
            e = e || window.event;
            var target = e.target || e.srcElement,
                text = target.textContent || text.innerText;   
            
            if (target.findAncestorByClass('inline-comment')) return false;
            
            console.log('post click');

            var post = target.findAncestorByClass('post');
            if (!post) return false;

            if (e.altKey){
                console.log(post.getAttribute('id') + ' clicked');

                if (e.shiftKey){
                    if (setSpam(post))
                        setTitleText(post, 'SET <span style="color:red">SPAM</span>');
                } else {  
                    if (setNOTSpam(post))
                        setTitleText(post, 'SET <span style="color:green">NO SPAM</span>');
                }
            } else {
                var allPosts = post.getElementsByClassName('viewAllComments')[0];
                if (allPosts) allPosts.click();
            }
        }, false);
    }
    
    function addClickListenerComment(el){
        el.addEventListener('click', function(e) {
            e = e || window.event;
            var target = e.target || e.srcElement,
                text = target.textContent || text.innerText;   

            var comment = target.findAncestorByClass('inline-comment');
            if (comment) console.log('comment click');
            else return false;
            
            var words = getWordsFromComment(comment);
            if (e.altKey){
                console.log('add words:');
                console.log(words);
                
                if (e.shiftKey){
                    comment.style.color = 'red';
                    addWords('wordBucketSPAM', words);
                } else {
                    comment.style.color = 'green';
                    comment.style.opacity = 1;
                    addWords('wordBucketNOT', words);
                }
                self.updateBuckets();
                clearSelection(); // clear text selection which occurs by alt+click
            }
        });
    }
    
    function setTitleText(postEl, text){
        postEl.getElementsByClassName('timeago')[0].innerHTML += ' ' + text;
    };
    
    function setSpam(postEl){
        // check if already in bucket
        var idBu = self.Buckets.idBucketSPAM;
        var id = postEl.getAttribute('id');

        if (! idBu[id]){
            idBu[id] = true;

            var words = getWordsFromPost(postEl);
            addWords('wordBucketSPAM', words);
        }
        
        postEl.style.opacity = 0.2;

        // remove from not spam
        var idBuNOT = self.Buckets.idBucketNOT;
        if (idBuNOT[id]) idBuNOT[id] = false;

        self.updateBuckets();
        return true;
    };

    function setNOTSpam(postEl){
        // check if already in bucket
        var idBu = self.Buckets.idBucketNOT;
        var id = postEl.getAttribute('id');

        if (! idBu[id]){
            idBu[id] = true;

            var words = getWordsFromPost(postEl);
            addWords('wordBucketNOT', words);
        }
        
        postEl.style.opacity = 1;

        // remove from spam
        var idBuS = self.Buckets.idBucketSPAM;
        if (idBuS[id]) idBuS[id] = false;
        
        self.updateBuckets();
        return true;
    };
    
    function clearSelection() {
        if (window.getSelection) window.getSelection().removeAllRanges();
        else if (document.selection) document.selection.empty();
    }
}



document.onkeypress = function(e){
    // ALT + i
    if (e.which == 161){
        var tField = document.getElementById('postText');
        if (tField.value == '') tField.value = 'paste here';
        else {
            var buckets = tField.value.split("\n");
            if (buckets.length != BUCKETS.length+1) return false;
        
            for (var i=0; i<BUCKETS.length; i++){
                var bName = BUCKETS[i];
                SF.Buckets[bName] = JSON.parse(buckets[i]);
            }
            SF.updateBuckets();
            tField.value = 'installed';
        }
        // install buckets (c&p into text field)
        // if text field is empty -> alert message how to install, else install
    }
    // ALT + l
    if (e.which == 172){
        if (confirm('Die gespeicherten Einträge für Spam und Nicht-Spam löschen? (Alt+e um die Einträge anzusehen)') && confirm('Wirklich löschen?')){
            SF.seeBuckets();
            SF.deleteBuckets();
        }
    }
    // ALT + a
    if (e.which == 229){
        document.getElementsByClassName('nav-notifications')[0].getElementsByTagName('A')[0].click();
    }
    // ALT + h
    if (e.which == 170){
        document.getElementsByClassName('streamURL')[0].click();
    }
    // ALT + m
    if (e.which == 181){
        document.getElementsByClassName('nav-messages')[0].getElementsByTagName('A')[0].click();
    }
    // ALT + e
    if (e.which == 8364){
        SF.seeBuckets();
    }
    // ALT + y
    if (e.which == 165){
        document.getElementsByClassName('incognito')[0].click();
    }
    // CTRL + n
    if (e.which == 14){
        var posts = document.getElementsByClassName('post');
        for (var i=0; i<posts.length-1; i++){
            var post = posts[i];
            var pos = (post).offsetTop;
            var futPos = (posts[i+1]).offsetTop;
            
            if (window.pageYOffset-pos <= 20){
                if (futPos === 0) futPos = pos + 200;
                window.scrollTo(0, futPos - 25);
                break;
            }
        }
    }
    // ALT + p: forgot what this is for
    //if (e.which == 960){
        // https://www.spocal.net/api/2/conversations?limit=10
      //  GM_xmlhttpRequest({
        //    method: "GET",
        //    url: "https://www.spocal.net/api/2/conversations?limit=20",
         //   onload: function(response) {
          //      console.log(response.responseText);
    //        }
     //   });
    //}
    //console.log(e.which);
}

uw.SF = new Spamfilter();
uw.SF.init();
