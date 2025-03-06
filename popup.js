document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    
    document.getElementById('save').addEventListener('click', saveUserData);
    document.getElementById('fill').addEventListener('click', fillCurrentForm);
    
    function showStatus(message, isError = false) {
      const statusElement = document.getElementById('status');
      statusElement.textContent = message;
      statusElement.className = isError ? 'error' : 'success';
      
      setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = '';
      }, 3000);
    }
    
    function loadSavedData() {
      chrome.storage.sync.get([
        'name',
        'registration',
        'phone',
        'email',
        'resume'
      ], function(data) {
        if (data.name) document.getElementById('name').value = data.name;
        if (data.registration) document.getElementById('registration').value = data.registration;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.resume) document.getElementById('resume').value = data.resume;
      });
    }
    
    function saveUserData() {
      const userData = {
        name: document.getElementById('name').value,
        registration: document.getElementById('registration').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        resume: document.getElementById('resume').value
      };
      
      chrome.storage.sync.set(userData, function() {
        showStatus('Your details have been saved!');
      });
    }
    
    function fillCurrentForm() {
      chrome.storage.sync.get([
        'name',
        'registration',
        'phone',
        'email',
        'resume'
      ], function(userData) {
        if (Object.keys(userData).length === 0 || 
            Object.values(userData).every(val => !val)) {
          showStatus('No data saved. Please save your details first.', true);
          return;
        }
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (!tabs || tabs.length === 0) {
            showStatus('No active tab found', true);
            return;
          }
          
          const activeTab = tabs[0];
          
          // Check if this is a Google Forms page
          if (!activeTab.url || !activeTab.url.includes('docs.google.com/forms')) {
            showStatus('This is not a Google Forms page', true);
            return;
          }
          
          try {
            chrome.tabs.sendMessage(
              activeTab.id, 
              {action: "fillForm"}, 
              function(response) {
                if (chrome.runtime.lastError) {
                  console.error("Error:", chrome.runtime.lastError);
                  
                  chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['content.js']
                  }, function() {
                    setTimeout(() => {
                      chrome.tabs.sendMessage(
                        activeTab.id, 
                        {action: "fillForm"}, 
                        function(response) {
                          if (chrome.runtime.lastError) {
                            showStatus('Error: Content script could not be loaded', true);
                          } else {
                            showStatus('Form fill triggered!');
                          }
                        }
                      );
                    }, 500);
                  });
                } else {
                  showStatus('Form fill triggered!');
                }
              }
            );
          } catch (error) {
            console.error("Error sending message:", error);
            showStatus('Error: ' + error.message, true);
          }
        });
      });
    }
  });