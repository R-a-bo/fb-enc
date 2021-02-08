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

var db = firebase.firestore();

chrome.runtime.onMessage.addListener(function(msg, sender, response) {
  if (msg.command == "write") {
    db.collection("ciphertexts").doc(msg.hash).set({
      ciphertext: msg.ciphertext
    });
    return true;
  }
  if (msg.command == "read") {
    var docRef = db.collection("ciphertexts").doc(msg.hash);
    docRef.get().then(function(doc) {
      if (doc.exists) {
        response({ciphertext: doc.data().ciphertext});
      } else {
        console.log("Could not find firestore doc.");
      }
    });
    return true;
  }
});
