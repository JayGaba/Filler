chrome.commands.onCommand.addListener((command) => {
    if (command === "fill-form") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          if (tabs[0].url && tabs[0].url.includes('docs.google.com/forms')) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "fillForm"}, function(response) {
              if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError);
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id },
                  files: ['content.js']
                }, function() {
                  setTimeout(() => {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "fillForm"});
                  }, 500);
                });
              }
            });
          } else {
            console.log("Not a Google Forms page");
          }
        }
      });
    }
  });
  
  chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
      chrome.tabs.create({
        url: "popup.html"
      });
    }
  });
  
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "fillCurrentForm") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes('docs.google.com/forms')) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "fillForm"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error in message passing:", chrome.runtime.lastError);
            }
            if (response && response.success) {
              sendResponse({status: "Form fill triggered successfully"});
            } else {
              sendResponse({status: "Error: Content script did not respond"});
            }
          });
          return true; 
        } else {
          sendResponse({status: "Error: Not a Google Forms page"});
        }
      });
      return true; 
    }
  });