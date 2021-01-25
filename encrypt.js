//TODO: im literally just adding comments
// to try to get the sublime text registration message
// but god damn it wont work

document.addEventListener('DOMContentLoaded', documentEvents  , false);

// function handle_input(input) { 
//     encrypt(hexStringToUint8Array("6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411e5fbc1191a0a52eff69f2445df4f9b17ad2b417be6"));
// }

function documentEvents() {    
  document.getElementById('encode_btn').addEventListener('click', 
    function() { 

    	const plaintextArray = asciiToUint8Array(document.getElementById('input_box').value);

    	Promise.all([encrypt(plaintextArray), getRandWikiHash()])
    	.then(function(results) {
    		const ciphertextHexString = bytesToHexString(new Uint8Array(results[0]));
    		const hashString = bytesToHexString(new Uint8Array(results[1]));
    		chrome.runtime.sendMessage({command: "write", ciphertext: ciphertextHexString, hash: hashString}, function(response) {});
    	});


    	// set_key();
    	// get_key();
  });
}

function getRandWikiHash() {
	return getRandWikiPage()
	.then(function(result) {
		const wikiPagesObj = result.query.pages;
		const wikiText = wikiPagesObj[Object.keys(wikiPagesObj)[0]].extract;
		const formattedWikiText = wikiText.replace(/(\n)/g, " ");
		const truncatedWikiText = formattedWikiText.slice(0, 400);
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

function encrypt(plaintext) {
	var iv = hexStringToUint8Array("000102030405060708090a0b0c0d0e0f");
	var jwkKey = {
	    "kty": "oct",
	    "alg": "A256CBC",
	    "use": "enc",
	    "ext": true,
	    "k": "YD3rEBXKcb4rc67whX13gR81LAc7YQjXLZgQowkU3_Q"
	};
	return crypto.subtle.importKey("jwk", jwkKey, {name: 'AES-CBC'}, false, ["encrypt"])
	.then(function(result) {
		return crypto.subtle.encrypt({name: "aes-cbc", iv: iv}, result, plaintext);
	});
}

// function get_key() {
// 	chrome.storage.sync.get(["aes_key"], function(result) {
// 		console.log('key value gotten: ' + result.aes_key.kty);
// 	});
// }

// function set_key() {
// 	chrome.storage.sync.set({ "aes_key": {
// 	    "kty": "oct",
// 	    "alg": "A256CBC",
// 	    "use": "enc",
// 	    "ext": true,
// 	    "k": "YD3rEBXKcb4rc67whX13gR81LAc7YQjXLZgQowkU3_Q"
// 	}}, function() {
// 		console.log('key value set');
// 	});
// }

// copy pasted functions, to be removed later
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