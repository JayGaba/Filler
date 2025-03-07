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
      'srmEmail',
      'personalEmail',
      'resume',
      'dob',
      'specialization',
      'department',
      'gender'
    ], function(data) {
      if (data.name) document.getElementById('name').value = data.name;
      if (data.registration) document.getElementById('registration').value = data.registration;
      if (data.phone) document.getElementById('phone').value = data.phone;
      if (data.srmEmail) document.getElementById('srm-email').value = data.srmEmail;
      if (data.personalEmail) document.getElementById('personal-email').value = data.personalEmail;
      if (data.resume) document.getElementById('resume').value = data.resume;
      if (data.dob) document.getElementById('dob').value = data.dob;
      if (data.specialization) document.getElementById('specialization').value = data.specialization;
      if (data.department) document.getElementById('department').value = data.department;
      if (data.gender) document.getElementById('gender').value = data.gender;
    });
  }
  
  function saveUserData() {
    const userData = {
      name: document.getElementById('name').value,
      registration: document.getElementById('registration').value,
      phone: document.getElementById('phone').value,
      srmEmail: document.getElementById('srm-email').value,
      personalEmail: document.getElementById('personal-email').value,
      resume: document.getElementById('resume').value,
      dob: document.getElementById('dob').value,
      specialization: document.getElementById('specialization').value,
      department: document.getElementById('department').value,
      gender: document.getElementById('gender').value
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
      'srmEmail',
      'personalEmail',
      'resume',
      'dob',
      'specialization',
      'department',
      'gender'
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