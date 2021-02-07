/* TODO: DOCUMENT
i am once again
trying to get the sublime text registration message
*/

function substituteText(dummyText, textNode) {
	console.log("dummText: " + dummyText)
	crypto.subtle.digest("SHA-256", asciiToUint8Array(dummyText))
	.then(function(hash) {
		const hashString = bytesToHexString(new Uint8Array(hash));
		chrome.runtime.sendMessage({command: "read", hash: hashString}, function(response) {
			console.log("response: " + response);
			console.log("ciphertext: " + response.ciphertext);
			const cipherTextArray = hexStringToUint8Array(response.ciphertext);
			decrypt(cipherTextArray, textNode);
		});
		// return cipherText;
	});
	// .then(function(ciphertext) {
	// 	const cipherTextArray = hexStringToUint8Array(ciphertext);
	// 	decrypt(cipherTextArray, textNode);
	// });
}

function decrypt(ciphertext, textNode) {
	// var iv = hexStringToUint8Array("000102030405060708090a0b0c0d0e0f");
	var iv = ciphertext.slice(0, 16);
	var payload = ciphertext.slice(16);
	// var jwkKey = {
	//     "kty": "oct",
	//     "alg": "A256CBC",
	//     "use": "enc",
	//     "ext": true,
	//     "k": "YD3rEBXKcb4rc67whX13gR81LAc7YQjXLZgQowkU3_Q"
	// };
	chrome.storage.local.get(["aes_key"], function(storageResult) {
		crypto.subtle.importKey("jwk", storageResult.aes_key, {name: 'AES-CBC'}, false, ["decrypt"])
		.then(function(result) {
			return crypto.subtle.decrypt({name: "aes-cbc", iv: iv}, result, payload);
		})
		.then(function(result) {
			decryptionResult = bytesToASCIIString(new Uint8Array(result));
			console.log("decryption result: " + decryptionResult);
			textNode.nodeValue = decryptionResult;
		});
	});
}

function walk(rootNode) {
	// find al text nodes
	var walker = document.createTreeWalker(
		rootNode,
		NodeFilter.SHOW_TEXT,
		null,
		false
	),
	node;

	// modify each text node's value
	while (node = walker.nextNode()) {
		handleText(node);
	}
}

function handleText(textNode) {
	v = textNode.nodeValue;

	text = v.match(/@@(.*)@@/);
	if (text != null) {
		console.log("pattern found");
		// decrypt(hexStringToUint8Array(text[1]), textNode);
		substituteText(text[1], textNode);
		// decrypt(hexStringToUint8Array(text[1])).then(function(result) {
		// 	decryptionResult = bytesToASCIIString(new Uint8Array(result));
		// 	console.log("decryption result: " + decryptionResult);
		// 	textNode.nodeValue = decryptionResult;
		// });
	} else {
		textNode.nodeValue =  v;
	}
}

function isEditBox(node) {
	return node.isContentEditable;
}

function observerCallback(mutations) {
	var i, node;
	mutations.forEach(function(mutation) {
		for (i = 0; i < mutation.addedNodes.length; i++) {
			node = mutation.addedNodes[i];
			// edit box case
			if (isEditBox(node)) {
				continue;
			}
			// text case
			else if (node.nodeType == 3) {
				handleText(node);
			}
			// otherwise
			else {
				walk(node);
			}
		}
	});
}

function walkAndObserve(doc) {
	var observerConfig = {
		characterData: true,
		childList: true,
		subtree: true
	},
	bodyObserver;

	// do text replacements
	walk(doc.body);

	// observe to make replacements in any added/modified nodes
	bodyObserver = new MutationObserver(observerCallback);
	bodyObserver.observe(doc.body, observerConfig);
}

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
function bytesToASCIIString(bytes)
{
    return String.fromCharCode.apply(null, new Uint8Array(bytes));
}

walkAndObserve(document);
