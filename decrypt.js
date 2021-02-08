// content script to perform decyprtion of facebook posts

function substituteText(dummyText, textNode) {
	crypto.subtle.digest("SHA-256", asciiToUint8Array(dummyText))
	.then(function(hash) {
		const hashString = bytesToHexString(new Uint8Array(hash));
		chrome.runtime.sendMessage({command: "read", hash: hashString}, function(response) {
			const cipherTextArray = hexStringToUint8Array(response.ciphertext);
			decrypt(cipherTextArray, textNode);
		});
	});
}

function decrypt(ciphertext, textNode) {
	var iv = ciphertext.slice(0, 16);
	var payload = ciphertext.slice(16);
	chrome.storage.local.get(["aes_key"], function(storageResult) {
		crypto.subtle.importKey("jwk", storageResult.aes_key, {name: 'AES-CBC'}, false, ["decrypt"])
		.then(function(result) {
			return crypto.subtle.decrypt({name: "aes-cbc", iv: iv}, result, payload);
		})
		.then(function(result) {
			decryptionResult = bytesToASCIIString(new Uint8Array(result));
			textNode.nodeValue = decryptionResult;
		});
	});
}

function walk(rootNode) {
	// find all text nodes
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
		substituteText(text[1], textNode);
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
function bytesToASCIIString(bytes)
{
    return String.fromCharCode.apply(null, new Uint8Array(bytes));
}

walkAndObserve(document);
