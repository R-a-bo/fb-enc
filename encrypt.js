// JS for popup.html
// Manages the visibility of html elements and encryption

document.addEventListener('DOMContentLoaded', documentEvents  , false);

function documentEvents() {
    var groupKey;

    chrome.storage.local.get(["aes_key"], function(result) {
        if (typeof result.aes_key == 'undefined') {
            document.getElementById("key_input").style.display = "block";
            document.getElementById("save_key_btn").style.display = "block";
        } else {
            groupKey = result.aes_key;
            document.getElementById("input_box").style.display = "block";
            document.getElementById("encode_btn").style.display = "block";
            document.getElementById("change_key_btn").style.display = "block";
        }
    });

    document.getElementById('change_key_btn').addEventListener('click',
        function() {
            document.getElementById("key_input").style.display = "block";
            document.getElementById("save_key_btn").style.display = "block";
            document.getElementById("cancel_key_change_btn").style.display = "block";
            document.getElementById("input_box").style.display = "none";
            document.getElementById("encode_btn").style.display = "none";
            document.getElementById("change_key_btn").style.display = "none";
    });

    document.getElementById('cancel_key_change_btn').addEventListener('click',
        function() {
            document.getElementById("key_input").style.display = "none";
            document.getElementById("save_key_btn").style.display = "none";
            document.getElementById("cancel_key_change_btn").style.display = "none";
            document.getElementById("input_box").style.display = "block";
            document.getElementById("encode_btn").style.display = "block";
            document.getElementById("change_key_btn").style.display = "block";
    });

    document.getElementById('encode_btn').addEventListener('click', 
        function() { 
        	const plaintextArray = asciiToUint8Array(document.getElementById('input_box').value);
        	Promise.all([encrypt(plaintextArray, groupKey), getRandWikiHash()])
        	.then(function(results) {
        		const ciphertextHexString = bytesToHexString(results[0]);
        		const hashString = bytesToHexString(new Uint8Array(results[1]));
        		chrome.runtime.sendMessage({command: "write", ciphertext: ciphertextHexString, hash: hashString}, function(response) {});
        	});
    });

    document.getElementById('save_key_btn').addEventListener('click',
        function() {
            const keyString = document.getElementById('key_input').value;
            groupKey = {
                "kty": "oct",
                "alg": "A256CBC",
                "use": "enc",
                "ext": true,
                "k": keyString
            };
            chrome.storage.local.set({ "aes_key": groupKey}, function() {
                document.getElementById("key_input").style.display = "none";
                document.getElementById("save_key_btn").style.display = "none";
                document.getElementById("input_box").style.display = "block";
                document.getElementById("encode_btn").style.display = "block";
                document.getElementById("change_key_btn").style.display = "block";
            });
    });
}

function getRandWikiHash() {
	return getRandWikiPage()
	.then(function(result) {
		const wikiPagesObj = result.query.pages;
		const wikiText = wikiPagesObj[Object.keys(wikiPagesObj)[0]].extract;
		const lineBreaksRemoved = wikiText.replace(/(\n)/g, " ");
        const linksRemoved = lineBreaksRemoved.replace(/(\S)\.(\S)/g, "$1 $2");
		const truncatedWikiText = linksRemoved.slice(0, 400);
        const outputText = "@@" + truncatedWikiText + "@@";
		alert(outputText);
        document.getElementById('output').innerHTML = outputText;
		return crypto.subtle.digest('SHA-256', asciiToUint8Array(truncatedWikiText));
	})
}

function getRandWikiPage() {
	return fetch("https://en.wikipedia.org/w/api.php?action=query&list=random&format=json&rnnamespace=0&rnlimit=1&origin=*")
	.then(function(response) {
		return response.json();
	}).then(function(result) {
		return result.query.random[0].id;
	}).then(function(pageId) {
		return fetch("https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=1&explaintext=1&pageids=" + pageId + "&origin=*");
	}).then(function(response) {
		return response.json();
	});
}

function encrypt(plaintext, jwkKey) {
    var iv = new Uint8Array(16);
    crypto.getRandomValues(iv);
	return crypto.subtle.importKey("jwk", jwkKey, {name: 'AES-CBC'}, false, ["encrypt"])
	.then(function(result) {
		return crypto.subtle.encrypt({name: "aes-cbc", iv: iv}, result, plaintext);
	}).then(function(result) {
        var appendedArray = new Uint8Array(16 + new Uint8Array(result).length);
        appendedArray.set(iv);
        appendedArray.set(new Uint8Array(result), iv.length);
        return appendedArray;
    });
}

// byte/hex/ascii translation functions
// bororwed from WebCrypto API Chrome test files:
//   https://chromium.googlesource.com/chromium/blink/+/master/LayoutTests/crypto/
function hexStringToUint8Array(hexString)
{
    if (hexString.length % 2 != 0)
        throw "Invalid hexString";
    var arrayBuffer = new Uint8Array(hexString.length / 2);
    for (var i = 0; i < hexString.length; i += 2) {
        var byteValue = parseInt(hexString.substr(i, 2), 16);
        if (byteValue == NaN)
            throw "Invalid hexString";
        arrayBuffer[i/2] = byteValue;
    }
    return arrayBuffer;
}
function asciiToUint8Array(str)
{
    var chars = [];
    for (var i = 0; i < str.length; ++i)
        chars.push(str.charCodeAt(i));
    return new Uint8Array(chars);
}
function bytesToHexString(bytes)
{
    if (!bytes)
        return null;
    bytes = new Uint8Array(bytes);
    var hexBytes = [];
    for (var i = 0; i < bytes.length; ++i) {
        var byteString = bytes[i].toString(16);
        if (byteString.length < 2)
            byteString = "0" + byteString;
        hexBytes.push(byteString);
    }
    return hexBytes.join("");
}