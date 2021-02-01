var firebaseConfig = {
    apiKey: "AIzaSyBj-KEH31lnH3RdVYUgvH_8u41HgPswNXk",
    authDomain: "fb-enc.firebaseapp.com",
    projectId: "fb-enc",
    storageBucket: "fb-enc.appspot.com",
    messagingSenderId: "416732881219",
    appId: "1:416732881219:web:7c7219e5fbcb94b93a8ff6",
    measurementId: "G-P5NE30HC2E"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// firebase.analytics();

// console.log(firebase);

var db = firebase.firestore();

chrome.runtime.onMessage.addListener(function(msg, sender, response) {
  if (msg.command == "write") {
    db.collection("test-collection").doc(msg.hash).set({
      ciphertext: msg.ciphertext
    });
    return true;
  }
  if (msg.command == "read") {
    console.log("read command accepted!");
    console.log("hash: " + msg.hash);
    var docRef = db.collection("test-collection").doc(msg.hash);
    docRef.get().then(function(doc) {
      if (doc.exists) {
        console.log("doc exists!, ciphertext: " + doc.data().ciphertext);
        response({ciphertext: doc.data().ciphertext});
      } else {
        console.log("doc doesn't exist!");
      }
      // error handling
    });
    // error handling xdddddd
    return true;
  }
});

// db.collection("test-collection").doc("pretend_this_is_hex").set({
//   encrypted: "also_hex"
// })
// .then(function() {
//   console.log("document written");
// })
// .catch(function(error) {
//   console.error("error writing document: ", error);
// });